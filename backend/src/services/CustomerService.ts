import { PrismaClient } from '@prisma/client'
import { redisService } from './RedisService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface CreateCustomerData {
  name: string
  email?: string | undefined
  phone?: string | undefined
  address?: string | undefined
  photoUrl?: string | undefined
  creditLimit?: number | undefined
}

interface UpdateCustomerData {
  id: string
  name?: string | undefined
  email?: string | undefined
  phone?: string | undefined
  address?: string | undefined
  photoUrl?: string | undefined
  creditLimit?: number | undefined
}

interface CustomerQuery {
  search?: string | undefined
  email?: string | undefined
  phone?: string | undefined
  hasEmail?: boolean | undefined
  hasPhone?: boolean | undefined
  limit?: number | undefined
  offset?: number | undefined
  sortBy?: 'name' | 'createdAt' | 'totalSpent' | undefined
  sortOrder?: 'asc' | 'desc' | undefined
}

// Customer with sales data (computed from Sale records)
interface CustomerWithSales {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  photoUrl: string | null
  creditLimit: number
  currentBalance: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  totalSpent: number
  totalOrders: number
  recentSales: any[]
}

export class CustomerService {
  private static instance: CustomerService
  private readonly CACHE_TTL = 3600 // 1 hour

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService()
    }
    return CustomerService.instance
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<any> {
    try {
      // Check if customer with email or phone already exists
      if (data.email || data.phone) {
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              ...(data.email ? [{ email: data.email }] : []),
              ...(data.phone ? [{ phone: data.phone }] : [])
            ]
          }
        })

        if (existingCustomer) {
          const field = existingCustomer.email === data.email ? 'email' : 'phone'
          throw new Error(`Customer with this ${field} already exists`)
        }
      }

      const customer = await prisma.customer.create({
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          photoUrl: data.photoUrl || null,
          creditLimit: data.creditLimit || 0,
          isActive: true
        }
      })

      // Invalidate cache
      await this.invalidateCustomerCache()

      logger.info(`Customer created: ${customer.name} (${customer.id})`)
      return customer

    } catch (error) {
      logger.error('Error creating customer:', error)
      throw error
    }
  }

  /**
   * Get customer by ID with sales data
   */
  async getCustomerById(id: string, useCache: boolean = true): Promise<CustomerWithSales> {
    try {
      const cacheKey = `customer:${id}`

      if (useCache) {
        const cached = await redisService.getJSON(cacheKey)
        if (cached) return cached
      }

      const customer = await prisma.customer.findUnique({
        where: { id }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      // Get sales data based on customer info matching
      const recentSales = await prisma.sale.findMany({
        where: {
          OR: [
            ...(customer.email ? [{ customerEmail: customer.email }] : []),
            ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
            { customerName: customer.name }
          ],
          status: 'COMPLETED'
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          receiptNumber: true,
          totalAmount: true,
          currency: true,
          paymentMethod: true,
          status: true,
          createdAt: true
        }
      })

      // Calculate totals
      const totalSpent = recentSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalOrders = recentSales.length

      const customerWithStats: CustomerWithSales = {
        ...customer,
        totalSpent,
        totalOrders,
        recentSales
      }

      // Cache the result
      if (useCache) {
        await redisService.setJSON(cacheKey, customerWithStats, this.CACHE_TTL)
      }

      return customerWithStats

    } catch (error) {
      logger.error('Error getting customer:', error)
      throw error
    }
  }

  /**
   * Get customers with filtering and pagination
   */
  async getCustomers(query: CustomerQuery): Promise<{
    customers: CustomerWithSales[]
    total: number
    hasMore: boolean
  }> {
    try {
      const {
        search,
        email,
        phone,
        hasEmail,
        hasPhone,
        limit = 20,
        offset = 0,
        sortBy = 'name',
        sortOrder = 'asc'
      } = query

      // Build cache key
      const cacheKey = `customers:${JSON.stringify(query)}`
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      // Build where clause
      const where: any = {
        isActive: true
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      }

      if (email) {
        where.email = { contains: email, mode: 'insensitive' }
      }

      if (phone) {
        where.phone = { contains: phone }
      }

      if (hasEmail !== undefined) {
        where.email = hasEmail ? { not: null } : null
      }

      if (hasPhone !== undefined) {
        where.phone = hasPhone ? { not: null } : null
      }

      // Build order clause
      const orderBy: any = {}
      if (sortBy === 'totalSpent') {
        orderBy.name = sortOrder // Fallback to name
      } else {
        orderBy[sortBy] = sortOrder
      }

      // Get customers and total count
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset
        }),
        prisma.customer.count({ where })
      ])

      // Add sales data for each customer
      const customersWithSales = await Promise.all(
        customers.map(async (customer): Promise<CustomerWithSales> => {
          // Get sales matching this customer
          const salesData = await prisma.sale.aggregate({
            where: {
              OR: [
                ...(customer.email ? [{ customerEmail: customer.email }] : []),
                ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
                { customerName: customer.name }
              ],
              status: 'COMPLETED'
            },
            _sum: { totalAmount: true },
            _count: true
          })

          return {
            ...customer,
            totalSpent: salesData._sum.totalAmount || 0,
            totalOrders: salesData._count,
            recentSales: []
          }
        })
      )

      // Sort by total spent if requested
      if (sortBy === 'totalSpent') {
        customersWithSales.sort((a, b) => {
          const aVal = a.totalSpent
          const bVal = b.totalSpent
          return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        })
      }

      const result = {
        customers: customersWithSales,
        total,
        hasMore: offset + customers.length < total
      }

      // Cache for 5 minutes
      await redisService.setJSON(cacheKey, result, 300)

      return result

    } catch (error) {
      logger.error('Error getting customers:', error)
      throw error
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(data: UpdateCustomerData): Promise<any> {
    try {
      const { id, ...updateData } = data

      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id }
      })

      if (!existingCustomer) {
        throw new Error('Customer not found')
      }

      // Check email/phone uniqueness if being updated
      if (updateData.email || updateData.phone) {
        const conflictWhere: any = {
          NOT: { id },
          OR: []
        }

        if (updateData.email && updateData.email !== existingCustomer.email) {
          conflictWhere.OR.push({ email: updateData.email })
        }

        if (updateData.phone && updateData.phone !== existingCustomer.phone) {
          conflictWhere.OR.push({ phone: updateData.phone })
        }

        if (conflictWhere.OR.length > 0) {
          const conflictingCustomer = await prisma.customer.findFirst({
            where: conflictWhere
          })

          if (conflictingCustomer) {
            const field = conflictingCustomer.email === updateData.email ? 'email' : 'phone'
            throw new Error(`Another customer with this ${field} already exists`)
          }
        }
      }

      // Update customer
      const customer = await prisma.customer.update({
        where: { id },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.email !== undefined && { email: updateData.email }),
          ...(updateData.phone !== undefined && { phone: updateData.phone }),
          ...(updateData.address !== undefined && { address: updateData.address }),
          ...(updateData.photoUrl !== undefined && { photoUrl: updateData.photoUrl }),
          ...(updateData.creditLimit !== undefined && { creditLimit: updateData.creditLimit })
        }
      })

      // Invalidate cache
      await this.invalidateCustomerCache(id)

      logger.info(`Customer updated: ${customer.name} (${customer.id})`)
      return customer

    } catch (error) {
      logger.error('Error updating customer:', error)
      throw error
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<CustomerWithSales[]> {
    try {
      const cacheKey = `customer_search:${searchTerm}:${limit}`
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      const customers = await prisma.customer.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } }
          ]
        },
        orderBy: [
          { name: 'asc' }
        ],
        take: limit
      })

      // Add sales data for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer): Promise<CustomerWithSales> => {
          const salesData = await prisma.sale.aggregate({
            where: {
              OR: [
                ...(customer.email ? [{ customerEmail: customer.email }] : []),
                ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
                { customerName: customer.name }
              ],
              status: 'COMPLETED'
            },
            _sum: { totalAmount: true },
            _count: true
          })

          return {
            ...customer,
            totalSpent: salesData._sum.totalAmount || 0,
            totalOrders: salesData._count,
            recentSales: []
          }
        })
      )

      // Cache for 10 minutes
      await redisService.setJSON(cacheKey, customersWithStats, 600)

      return customersWithStats

    } catch (error) {
      logger.error('Error searching customers:', error)
      throw error
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(): Promise<any> {
    try {
      const cacheKey = 'customer:analytics'
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      const [totalCustomers, newCustomersThisMonth, topCustomers] = await Promise.all([
        // Total active customers
        prisma.customer.count({
          where: { isActive: true }
        }),

        // New customers this month
        prisma.customer.count({
          where: {
            isActive: true,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Top customers by spending
        this.getTopCustomersBySpending()
      ])

      const analytics = {
        totalCustomers,
        newCustomersThisMonth,
        topCustomers
      }

      // Cache for 1 hour
      await redisService.setJSON(cacheKey, analytics, 3600)

      return analytics

    } catch (error) {
      logger.error('Error getting customer analytics:', error)
      throw error
    }
  }

  /**
   * Get top customers by spending
   */
  private async getTopCustomersBySpending(): Promise<any[]> {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      take: 50 // Get reasonable number to process
    })

    const customersWithSpending = await Promise.all(
      customers.map(async (customer) => {
        const salesData = await prisma.sale.aggregate({
          where: {
            OR: [
              ...(customer.email ? [{ customerEmail: customer.email }] : []),
              ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
              { customerName: customer.name }
            ],
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true },
          _count: true
        })

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          totalOrders: salesData._count,
          totalSpent: salesData._sum.totalAmount || 0
        }
      })
    )

    // Sort by total spent and take top 10
    return customersWithSpending
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      // Check if customer has any sales
      const salesCount = await prisma.sale.count({
        where: {
          OR: [
            ...(customer.email ? [{ customerEmail: customer.email }] : []),
            ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
            { customerName: customer.name }
          ]
        }
      })

      if (salesCount > 0) {
        // Soft delete - just deactivate
        await prisma.customer.update({
          where: { id },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        })
      } else {
        // Hard delete if no sales history
        await prisma.customer.delete({
          where: { id }
        })
      }

      // Invalidate cache
      await this.invalidateCustomerCache(id)

      return true

    } catch (error) {
      logger.error('Error deleting customer:', error)
      throw error
    }
  }

  /**
   * Invalidate customer cache
   */
  private async invalidateCustomerCache(customerId?: string): Promise<void> {
    try {
      const patterns = [
        'customers:*',
        'customer:analytics',
        'customer_search:*'
      ]

      if (customerId) {
        patterns.push(`customer:${customerId}`)
      }

      await Promise.all(
        patterns.map(pattern => redisService.invalidatePattern(pattern))
      )

    } catch (error) {
      logger.error('Error invalidating customer cache:', error)
    }
  }
}

export const customerService = CustomerService.getInstance()
