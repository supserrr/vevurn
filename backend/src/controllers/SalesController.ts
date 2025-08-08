import { Request, Response, NextFunction } from 'express'
import { salesService } from '../services/SalesService'
import { logger } from '../utils/logger'
import { z } from 'zod'

// Validation schemas aligned with SalesService and database schema
const createSaleSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    basePrice: z.number().min(0),
    negotiatedPrice: z.number().min(0),
    discountAmount: z.number().min(0).optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    discountReason: z.string().optional()
  })).min(1),
  paymentMethod: z.enum(['CASH', 'MTN_MOBILE_MONEY', 'CARD', 'BANK_TRANSFER']),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0),
  currency: z.enum(['RWF', 'USD', 'EUR']).default('RWF'),
  mtnTransactionId: z.string().optional(),
  staffNotes: z.string().optional()
})

const salesQuerySchema = z.object({
  cashierId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  status: z.enum(['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH', 'MTN_MOBILE_MONEY', 'CARD', 'BANK_TRANSFER']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'totalAmount', 'receiptNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional()
})

const mtnCallbackSchema = z.object({
  saleId: z.string().uuid(),
  mtnTransactionId: z.string(),
  mtnStatus: z.string()
})

export class SalesController {
  /**
   * Create a new sale
   */
  static async createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createSaleSchema.parse(req.body)
      const cashierId = (req as any).user?.id

      if (!cashierId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const saleData = {
        ...validatedData,
        cashierId
      }

      const sale = await salesService.createSale(saleData)

      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: sale
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        })
        return
      }

      if (error instanceof Error && error.message.includes('Insufficient stock')) {
        res.status(400).json({
          success: false,
          message: error.message
        })
        return
      }

      logger.error('Error creating sale:', error)
      next(error)
    }
  }

  /**
   * Get all sales with filtering
   */
  static async getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = salesQuerySchema.parse(req.query)
      const result = await salesService.getSales(query)

      res.json({
        success: true,
        data: result.sales,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
          hasMore: result.hasMore
        }
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Get sale by ID
   */
  static async getSaleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Sale ID is required'
        })
        return
      }

      const sale = await salesService.getSaleById(id)

      res.json({
        success: true,
        data: sale
      })

    } catch (error) {
      if (error instanceof Error && error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          message: 'Sale not found'
        })
        return
      }
      next(error)
    }
  }

  /**
   * Update sale status
   */
  static async updateSaleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const validatedData = updateStatusSchema.parse(req.body)

      const sale = await salesService.updateSaleStatus(
        id, 
        validatedData.status, 
        validatedData.paymentStatus
      )

      res.json({
        success: true,
        message: 'Sale status updated successfully',
        data: sale
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Process MTN Mobile Money payment update
   */
  static async updateMtnPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = mtnCallbackSchema.parse(req.body)

      const sale = await salesService.updateMtnPayment(
        validatedData.saleId,
        validatedData.mtnTransactionId,
        validatedData.mtnStatus
      )

      res.json({
        success: true,
        message: 'MTN payment updated successfully',
        data: sale
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        })
        return
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        })
        return
      }
      next(error)
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dateFrom, dateTo, cashierId } = req.query

      if (!dateFrom || !dateTo) {
        res.status(400).json({
          success: false,
          message: 'Date range is required (dateFrom and dateTo)'
        })
        return
      }

      const analytics = await salesService.getSalesAnalytics(
        new Date(dateFrom as string),
        new Date(dateTo as string),
        cashierId as string
      )

      res.json({
        success: true,
        data: analytics
      })

    } catch (error) {
      logger.error('Error getting sales analytics:', error)
      next(error)
    }
  }

  /**
   * Get daily sales summary
   */
  static async getDailySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, cashierId } = req.query
      const targetDate = date ? new Date(date as string) : new Date()
      
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const summary = await salesService.getSalesAnalytics(
        startOfDay, 
        endOfDay, 
        cashierId as string
      )

      res.json({
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          ...summary
        }
      })

    } catch (error) {
      logger.error('Error getting daily summary:', error)
      next(error)
    }
  }

  /**
   * Export sales to CSV
   */
  static async exportSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = salesQuerySchema.parse(req.query)
      
      // Remove pagination for export
      const exportQuery = { ...query, limit: 10000, offset: 0 }
      const result = await salesService.getSales(exportQuery)

      // Convert to CSV format
      const csvHeader = 'Receipt Number,Date,Cashier,Customer Name,Customer Phone,Payment Method,Payment Status,Status,Subtotal,Tax,Discount,Total Amount,Currency\n'
      const csvData = result.sales.map(sale => {
        const customerName = sale.customerName || 'Walk-in Customer'
        const customerPhone = sale.customerPhone || ''
        const cashierName = sale.cashier 
          ? `${sale.cashier.firstName || ''} ${sale.cashier.lastName || ''}`.trim()
          : 'Unknown'
        
        return [
          `"${sale.receiptNumber}"`,
          `"${sale.createdAt.toISOString().split('T')[0]}"`,
          `"${cashierName}"`,
          `"${customerName}"`,
          `"${customerPhone}"`,
          `"${sale.paymentMethod}"`,
          `"${sale.paymentStatus}"`,
          `"${sale.status}"`,
          sale.subtotal,
          sale.taxAmount,
          sale.discountAmount,
          sale.totalAmount,
          `"${sale.currency}"`
        ].join(',')
      }).join('\n')

      const csv = csvHeader + csvData
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `sales_export_${timestamp}.csv`

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
      res.send(csv)

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues
        })
        return
      }
      logger.error('Error exporting sales:', error)
      next(error)
    }
  }

  /**
   * Get receipt data for printing
   */
  static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Sale ID is required'
        })
        return
      }

      const sale = await salesService.getSaleById(id)

      // Format receipt data
      const receiptData = {
        receiptNumber: sale.receiptNumber,
        date: sale.createdAt,
        cashier: sale.cashier ? `${sale.cashier.firstName} ${sale.cashier.lastName}` : 'Unknown',
        customer: {
          name: sale.customerName || 'Walk-in Customer',
          phone: sale.customerPhone,
          email: sale.customerEmail
        },
        items: sale.items.map((item: any) => ({
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          basePrice: item.basePrice,
          negotiatedPrice: item.negotiatedPrice,
          totalPrice: item.totalPrice,
          discountAmount: item.discountAmount
        })),
        totals: {
          subtotal: sale.subtotal,
          taxAmount: sale.taxAmount,
          discountAmount: sale.discountAmount,
          totalAmount: sale.totalAmount,
          currency: sale.currency
        },
        payment: {
          method: sale.paymentMethod,
          status: sale.paymentStatus,
          paidAmount: sale.paidAmount,
          changeAmount: sale.changeAmount
        },
        notes: sale.staffNotes
      }

      res.json({
        success: true,
        data: receiptData
      })

    } catch (error) {
      if (error instanceof Error && error.message === 'Sale not found') {
        res.status(404).json({
          success: false,
          message: 'Sale not found'
        })
        return
      }
      next(error)
    }
  }
}
