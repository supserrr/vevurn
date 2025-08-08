import { Request, Response, NextFunction } from 'express'
import { customerService } from '../services/CustomerService'
import { z } from 'zod'

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  photoUrl: z.string().url().optional(),
  creditLimit: z.number().min(0).optional()
})

const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().uuid()
})

const customerQuerySchema = z.object({
  search: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  hasEmail: z.coerce.boolean().optional(),
  hasPhone: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'totalSpent']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export class CustomerController {
  /**
   * Create a new customer
   */
  static async createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createCustomerSchema.parse(req.body)
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const customer = await customerService.createCustomer(validatedData)

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
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

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        })
        return
      }

      next(error)
    }
  }

  /**
   * Get all customers with filtering and pagination
   */
  static async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = customerQuerySchema.parse(req.query)
      const result = await customerService.getCustomers(query)

      res.json({
        success: true,
        data: result.customers,
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
   * Get customer by ID
   */
  static async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        })
        return
      }

      const customer = await customerService.getCustomerById(id)

      res.json({
        success: true,
        data: customer
      })

    } catch (error) {
      if (error instanceof Error && error.message === 'Customer not found') {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
        return
      }
      next(error)
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const updateData = { ...req.body, id }
      const validatedData = updateCustomerSchema.parse(updateData)
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const customer = await customerService.updateCustomer(validatedData)

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
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

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        })
        return
      }

      next(error)
    }
  }

  /**
   * Search customers
   */
  static async searchCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit } = req.query

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        })
        return
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : 10
      const customers = await customerService.searchCustomers(q, searchLimit)

      res.json({
        success: true,
        data: customers
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await customerService.getCustomerAnalytics()

      res.json({
        success: true,
        data: analytics
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const success = await customerService.deleteCustomer(id)

      if (success) {
        res.json({
          success: true,
          message: 'Customer deleted successfully'
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete customer'
        })
      }

    } catch (error) {
      next(error)
    }
  }

  /**
   * Export customers to CSV
   */
  static async exportCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = customerQuerySchema.parse(req.query)
      
      // Remove pagination for export
      const exportQuery = { ...query, limit: 10000, offset: 0 }
      const result = await customerService.getCustomers(exportQuery)

      // Convert to CSV format
      const csvHeader = 'Customer ID,Name,Email,Phone,Total Orders,Total Spent,Created Date\n'
      const csvData = result.customers.map(customer => 
        `"${customer.id}","${customer.name}","${customer.email || ''}","${customer.phone || ''}",${customer.totalOrders},${customer.totalSpent || 0},"${customer.createdAt.toISOString().split('T')[0]}"`
      ).join('\n')

      const csv = csvHeader + csvData

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv')
      res.send(csv)

    } catch (error) {
      next(error)
    }
  }
}
