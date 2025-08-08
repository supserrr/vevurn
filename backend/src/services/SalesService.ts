import { PrismaClient, Currency, PaymentMethod, PaymentStatus, SaleStatus } from '@prisma/client'
import { redisService } from './RedisService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface CreateSaleData {
  customerName?: string | undefined
  customerPhone?: string | undefined  
  customerEmail?: string | undefined
  cashierId: string
  items: Array<{
    productId: string
    quantity: number
    basePrice: number
    negotiatedPrice: number
    discountAmount?: number | undefined
    discountPercentage?: number | undefined
    discountReason?: string | undefined
  }>
  paymentMethod: 'CASH' | 'MTN_MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER'
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | undefined
  subtotal: number
  taxAmount?: number | undefined
  discountAmount?: number | undefined
  totalAmount: number
  currency?: 'RWF' | 'USD' | 'EUR' | undefined
  mtnTransactionId?: string | undefined
  staffNotes?: string | undefined
}

interface SaleQuery {
  cashierId?: string | undefined
  customerName?: string | undefined
  status?: string | undefined
  paymentMethod?: string | undefined
  paymentStatus?: string | undefined
  dateFrom?: Date | undefined
  dateTo?: Date | undefined
  minAmount?: number | undefined
  maxAmount?: number | undefined
  limit?: number | undefined
  offset?: number | undefined
  sortBy?: 'createdAt' | 'totalAmount' | 'receiptNumber' | undefined
  sortOrder?: 'asc' | 'desc' | undefined
}

export class SalesService {
  private static instance: SalesService

  public static getInstance(): SalesService {
    if (!SalesService.instance) {
      SalesService.instance = new SalesService()
    }
    return SalesService.instance
  }

  /**
   * Create a new sale transaction
   */
  async createSale(data: CreateSaleData): Promise<any> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Generate receipt number
        const receiptNumber = await this.generateReceiptNumber()

        // Validate stock availability
        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          })

          if (!product) {
            throw new Error(`Product ${item.productId} not found`)
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Required: ${item.quantity}`)
          }
        }

        // Create sale record  
        const saleData: any = {
          receiptNumber,
          paymentMethod: data.paymentMethod as PaymentMethod,
          paymentStatus: (data.paymentStatus || 'COMPLETED') as PaymentStatus,
          status: 'COMPLETED' as SaleStatus,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount || 0,
          discountAmount: data.discountAmount || 0,
          totalAmount: data.totalAmount,
          currency: (data.currency || 'RWF') as Currency,
          paidAmount: data.totalAmount,
          changeAmount: 0,
          cashierId: data.cashierId
        }
        
        // Only add customer fields if they have values
        if (data.customerName) saleData.customerName = data.customerName
        if (data.customerPhone) saleData.customerPhone = data.customerPhone
        if (data.customerEmail) saleData.customerEmail = data.customerEmail
        if (data.mtnTransactionId) saleData.mtnTransactionId = data.mtnTransactionId
        if (data.staffNotes) saleData.staffNotes = data.staffNotes

        const sale = await tx.sale.create({ data: saleData })

        // Create sale items and update inventory
        for (const item of data.items) {
          // Get product details for snapshot
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, sku: true }
          })

          // Create sale item
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              basePrice: item.basePrice,
              negotiatedPrice: item.negotiatedPrice,
              totalPrice: item.negotiatedPrice * item.quantity,
              discountAmount: item.discountAmount || 0,
              discountPercentage: item.discountPercentage || 0,
              discountReason: item.discountReason || 'none',
              productName: product?.name || 'Unknown Product',
              productSku: product?.sku || 'Unknown SKU'
            }
          })

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
              updatedAt: new Date()
            }
          })

          // Create stock movement
          const updatedProduct = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockQuantity: true }
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              userId: data.cashierId,
              type: 'SALE',
              quantity: -item.quantity,
              reason: `Sale: ${receiptNumber}`,
              reference: sale.id,
              stockBefore: (updatedProduct?.stockQuantity || 0) + item.quantity,
              stockAfter: updatedProduct?.stockQuantity || 0
            }
          })
        }

        // Get complete sale with relations
        const completeSale = await tx.sale.findUnique({
          where: { id: sale.id },
          include: {
            cashier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    categoryId: true
                  }
                }
              }
            },
            payments: true
          }
        })

        // Invalidate cache
        await this.invalidateSalesCache()

        logger.info(`Sale created: ${receiptNumber} - Amount: ${data.totalAmount} ${data.currency}`)
        return completeSale
      })

    } catch (error) {
      logger.error('Error creating sale:', error)
      throw error
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(id: string): Promise<any> {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          cashier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  categoryId: true,
                  images: true
                }
              }
            }
          },
          payments: true
        }
      })

      if (!sale) {
        throw new Error('Sale not found')
      }

      return sale

    } catch (error) {
      logger.error('Error getting sale:', error)
      throw error
    }
  }

  /**
   * Get sales with filtering and pagination
   */
  async getSales(query: SaleQuery): Promise<{
    sales: any[]
    total: number
    hasMore: boolean
  }> {
    try {
      const {
        cashierId,
        customerName,
        status,
        paymentMethod,
        paymentStatus,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query

      // Build where clause
      const where: any = {}

      if (cashierId) where.cashierId = cashierId
      if (customerName) where.customerName = { contains: customerName, mode: 'insensitive' }
      if (status) where.status = status
      if (paymentMethod) where.paymentMethod = paymentMethod
      if (paymentStatus) where.paymentStatus = paymentStatus

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) where.createdAt.lte = dateTo
      }

      if (minAmount || maxAmount) {
        where.totalAmount = {}
        if (minAmount) where.totalAmount.gte = minAmount
        if (maxAmount) where.totalAmount.lte = maxAmount
      }

      // Build order clause
      const orderBy: any = {}
      orderBy[sortBy] = sortOrder

      // Get sales and total count
      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            cashier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            },
            _count: {
              select: {
                items: true
              }
            }
          },
          orderBy,
          take: limit,
          skip: offset
        }),
        prisma.sale.count({ where })
      ])

      return {
        sales,
        total,
        hasMore: offset + sales.length < total
      }

    } catch (error) {
      logger.error('Error getting sales:', error)
      throw error
    }
  }

  /**
   * Update sale status
   */
  async updateSaleStatus(
    saleId: string, 
    status: string, 
    paymentStatus?: string
  ): Promise<any> {
    try {
      const updateData: any = {
        status: status as SaleStatus,
        updatedAt: new Date()
      }

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus as PaymentStatus
      }

      const sale = await prisma.sale.update({
        where: { id: saleId },
        data: updateData,
        include: {
          cashier: true,
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Invalidate cache
      await this.invalidateSalesCache()

      logger.info(`Sale status updated: ${sale.receiptNumber} - Status: ${status}`)
      return sale

    } catch (error) {
      logger.error('Error updating sale status:', error)
      throw error
    }
  }

  /**
   * Process MTN Mobile Money payment update
   */
  async updateMtnPayment(
    saleId: string,
    mtnTransactionId: string,
    mtnStatus: string
  ): Promise<any> {
    try {
      const sale = await prisma.sale.update({
        where: { id: saleId },
        data: {
          mtnTransactionId,
          mtnStatus,
          paymentStatus: mtnStatus === 'SUCCESSFUL' ? 'COMPLETED' as PaymentStatus : 'FAILED' as PaymentStatus,
          updatedAt: new Date()
        },
        include: {
          cashier: true,
          items: true
        }
      })

      // If payment failed, reverse inventory changes
      if (mtnStatus === 'FAILED') {
        for (const item of sale.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity }
            }
          })

          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              userId: sale.cashierId,
              type: 'RETURN',
              quantity: item.quantity,
              reason: `Payment failed reversal for sale: ${sale.receiptNumber}`,
              reference: sale.id,
              stockBefore: 0, // Will be calculated
              stockAfter: 0   // Will be calculated
            }
          })
        }
      }

      await this.invalidateSalesCache()
      return sale

    } catch (error) {
      logger.error('Error updating MTN payment:', error)
      throw error
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(
    dateFrom: Date,
    dateTo: Date,
    cashierId?: string
  ): Promise<any> {
    try {
      const cacheKey = `sales:analytics:${dateFrom.toISOString()}:${dateTo.toISOString()}:${cashierId || 'all'}`
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      const where: any = {
        createdAt: {
          gte: dateFrom,
          lte: dateTo
        },
        status: 'COMPLETED'
      }

      if (cashierId) {
        where.cashierId = cashierId
      }

      // Get basic metrics
      const [totalSales, totalRevenue, salesByMethod, topProducts] = await Promise.all([
        // Total sales count
        prisma.sale.count({ where }),

        // Total revenue
        prisma.sale.aggregate({
          where,
          _sum: { totalAmount: true }
        }),

        // Sales by payment method
        prisma.sale.groupBy({
          by: ['paymentMethod'],
          where,
          _count: { paymentMethod: true },
          _sum: { totalAmount: true }
        }),

        // Top selling products
        prisma.saleItem.groupBy({
          by: ['productId'],
          where: {
            sale: where
          },
          _sum: { quantity: true, totalPrice: true },
          _count: { productId: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10
        })
      ])

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true, sku: true, categoryId: true }
          })
          return {
            ...item,
            product
          }
        })
      )

      const analytics = {
        totalSales,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        averageSaleValue: totalSales > 0 ? (totalRevenue._sum.totalAmount || 0) / totalSales : 0,
        salesByMethod,
        topProducts: topProductsWithDetails
      }

      // Cache for 10 minutes
      await redisService.setJSON(cacheKey, analytics, 600)

      return analytics

    } catch (error) {
      logger.error('Error getting sales analytics:', error)
      throw error
    }
  }

  /**
   * Generate receipt number
   */
  private async generateReceiptNumber(): Promise<string> {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    const prefix = `VEV${year}${month}${day}`
    
    // Get the last receipt number for today
    const lastSale = await prisma.sale.findFirst({
      where: {
        receiptNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        receiptNumber: 'desc'
      }
    })

    let sequence = 1
    if (lastSale) {
      const lastSequence = parseInt(lastSale.receiptNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`
  }

  /**
   * Invalidate sales cache
   */
  private async invalidateSalesCache(): Promise<void> {
    try {
      await redisService.invalidatePattern('sales:*')
    } catch (error) {
      logger.error('Error invalidating sales cache:', error)
    }
  }
}

export const salesService = SalesService.getInstance()
