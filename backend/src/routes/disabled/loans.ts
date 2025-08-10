import { Router } from 'express'
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { AuthenticatedRequest } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import { roleMiddleware } from '../middleware/roleMiddleware'

const router = Router()
const prisma = new PrismaClient()

// Loan validation schemas
const createLoanSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  principalAmount: z.number().positive('Principal amount must be positive'),
  interestRate: z.number().min(0).max(100).default(0),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid due date'),
  notes: z.string().optional()
})

const paymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MTN_MOBILE_MONEY', 'CARD']),
  receiptNumber: z.string().optional(),
  notes: z.string().optional()
})

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'loans' })
})

// Apply authentication and role-based access
router.use(authMiddleware, roleMiddleware(['manager', 'admin']))

// Get all loans with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      status,
      search,
      page = '1',
      limit = '10'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    const where: any = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { notes: { contains: search as string, mode: 'insensitive' } },
        { customer: {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          _count: {
            select: {
              payments: true
            }
          }
        },
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.loan.count({ where })
    ])

    res.json({
      success: true,
      data: loans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans'
    })
  }
})

// Get loan by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    return res.json({
      success: true,
      data: loan
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch loan'
    })
  }
})

// Create new loan
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = createLoanSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      })
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: result.data.customerId }
    })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    // Calculate total amount with interest
    const interestAmount = (result.data.principalAmount * result.data.interestRate) / 100
    const totalAmount = result.data.principalAmount + interestAmount

    const loanData: any = {
      customerId: result.data.customerId,
      principalAmount: result.data.principalAmount,
      interestRate: result.data.interestRate,
      totalAmount: totalAmount,
      remainingAmount: totalAmount,
      paidAmount: 0,
      dueDate: new Date(result.data.dueDate)
    }

    if (result.data.notes !== undefined) {
      loanData.notes = result.data.notes
    }

    const loan = await prisma.loan.create({
      data: loanData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan created successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create loan'
    })
  }
})

// Make payment on loan
router.post('/:id/payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = paymentSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      })
    }

    const loan = await prisma.loan.findUnique({
      where: { id }
    })

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    if (loan.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot make payment on inactive loan'
      })
    }

    if (result.data.amount > loan.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds remaining balance'
      })
    }

    // Create payment and update loan in transaction
    const [payment, updatedLoan] = await prisma.$transaction(async (tx) => {
      const paymentData: any = {
        loanId: id,
        amount: result.data.amount,
        paymentMethod: result.data.paymentMethod
      }

      if (result.data.receiptNumber !== undefined) {
        paymentData.receiptNumber = result.data.receiptNumber
      }

      if (result.data.notes !== undefined) {
        paymentData.notes = result.data.notes
      }

      // Create payment record
      const newPayment = await tx.loanPayment.create({
        data: paymentData
      })

      // Update loan balance
      const newPaidAmount = loan.paidAmount + result.data.amount
      const newRemainingAmount = loan.totalAmount - newPaidAmount
      const updateData: any = {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount
      }

      // Mark as paid if fully paid
      if (newRemainingAmount <= 0) {
        updateData.status = 'PAID'
      }

      const updated = await tx.loan.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })

      return [newPayment, updated]
    })

    return res.json({
      success: true,
      data: {
        payment,
        loan: updatedLoan
      },
      message: 'Payment processed successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    })
  }
})

// Get loan payments
router.get('/:id/payments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      page = '1',
      limit = '20'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    const [payments, total] = await Promise.all([
      prisma.loanPayment.findMany({
        where: { loanId: id },
        skip: offset,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.loanPayment.count({
        where: { loanId: id }
      })
    ])

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    })
  }
})

export default router
