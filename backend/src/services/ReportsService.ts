import { PrismaClient } from '@prisma/client'
import { redisService } from './RedisService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface DateRange {
  startDate: Date
  endDate: Date
}

interface SalesReportData {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  salesByPaymentMethod: any[]
  salesByStaff: any[]
  salesByDay: any[]
  topProducts: any[]
  customerMetrics: any
}

interface InventoryReportData {
  totalProducts: number
  lowStockProducts: any[]
  outOfStockProducts: any[]
  inventoryValue: number
  movementsByType: any[]
  topMovingProducts: any[]
}

interface StaffReportData {
  totalStaff: number
  activeStaff: number
  salesByStaff: any[]
  performanceMetrics: any[]
}

export class ReportsService {
  private static instance: ReportsService
  private readonly CACHE_TTL = 1800 // 30 minutes

  public static getInstance(): ReportsService {
    if (!ReportsService.instance) {
      ReportsService.instance = new ReportsService()
    }
    return ReportsService.instance
  }

  /**
   * Generate comprehensive sales report
   */
  async generateSalesReport(dateRange: DateRange, staffId?: string): Promise<SalesReportData> {
    try {
      const cacheKey = `report:sales:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}:${staffId || 'all'}`
      const cached = await redisService.getJSON<SalesReportData>(cacheKey)
      if (cached) return cached

      const where: any = {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        },
        status: 'COMPLETED'
      }

      if (staffId) {
        where.staffId = staffId
      }

      // Get basic sales metrics
      const [salesCount, revenueSum] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.aggregate({
          where,
          _sum: { totalAmount: true }
        })
      ])

      const totalRevenue = revenueSum._sum.totalAmount || 0
      const averageOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0

      // Sales by payment method
      const salesByPaymentMethod = await prisma.sale.groupBy({
        by: ['paymentMethod'],
        where,
        _count: { paymentMethod: true },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } }
      })

      // Sales by staff (using cashier_id instead of staff_id)
      const salesByStaff = await prisma.$queryRaw`
        SELECT 
          s.cashier_id as staff_id,
          u.first_name,
          u.last_name,
          u.employee_id,
          COUNT(s.id) as total_sales,
          SUM(s.total_amount) as total_revenue,
          AVG(s.total_amount) as average_order_value
        FROM sales s
        JOIN users u ON s.cashier_id = u.id
        WHERE s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
          ${staffId ? `AND s.cashier_id = '${staffId}'` : ''}
        GROUP BY s.cashier_id, u.first_name, u.last_name, u.employee_id
        ORDER BY total_revenue DESC
      `

      // Daily sales trend (using cashier_id and customer_name)
      const salesByDay = await prisma.$queryRaw`
        SELECT 
          DATE(s.created_at) as sale_date,
          COUNT(s.id) as total_sales,
          SUM(s.total_amount) as total_revenue,
          COUNT(DISTINCT s.customer_name) as unique_customers
        FROM sales s
        WHERE s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
          ${staffId ? `AND s.cashier_id = '${staffId}'` : ''}
        GROUP BY DATE(s.created_at)
        ORDER BY sale_date ASC
      `

      // Top selling products (using correct table and field names)
      const topProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.category_id as category,
          SUM(si.quantity) as total_quantity_sold,
          SUM(si.total_price) as total_revenue,
          COUNT(DISTINCT si.sale_id) as order_count,
          AVG(si.negotiated_price) as average_price
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
          ${staffId ? `AND s.cashier_id = '${staffId}'` : ''}
        GROUP BY p.id, p.name, p.sku, p.category_id
        ORDER BY total_quantity_sold DESC
        LIMIT 20
      `

      // Customer metrics (using customer_name instead of customer_id)
      const customerMetrics = await prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT s.customer_name) as unique_customers,
          COUNT(DISTINCT CASE WHEN prev_sales.customer_name IS NULL THEN s.customer_name END) as new_customers,
          COUNT(DISTINCT CASE WHEN prev_sales.customer_name IS NOT NULL THEN s.customer_name END) as returning_customers
        FROM sales s
        LEFT JOIN sales prev_sales ON s.customer_name = prev_sales.customer_name 
          AND prev_sales.created_at < ${dateRange.startDate}
          AND prev_sales.status = 'COMPLETED'
        WHERE s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
          AND s.customer_name IS NOT NULL
          AND s.customer_name != ''
          ${staffId ? `AND s.cashier_id = '${staffId}'` : ''}
      `

      const report: SalesReportData = {
        totalSales: salesCount,
        totalRevenue,
        averageOrderValue,
        salesByPaymentMethod,
        salesByStaff: salesByStaff as any[],
        salesByDay: salesByDay as any[],
        topProducts: topProducts as any[],
        customerMetrics: (customerMetrics as any)[0]
      }

      // Cache the report
      await redisService.setJSON(cacheKey, report, this.CACHE_TTL)

      return report

    } catch (error) {
      logger.error('Error generating sales report:', error)
      throw error
    }
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(): Promise<InventoryReportData> {
    try {
      const cacheKey = 'report:inventory'
      const cached = await redisService.getJSON<InventoryReportData>(cacheKey)
      if (cached) return cached

      // Get basic inventory metrics
      const totalProducts = await prisma.product.count({
        where: { isActive: true }
      })

      // Calculate inventory value (using costPrice instead of cost_price_rwf)
      const inventoryValue = await prisma.$queryRaw`
        SELECT SUM(stock_quantity * cost_price) as total_value
        FROM products 
        WHERE is_active = true AND cost_price IS NOT NULL
      `

      // Low stock products (using minStockLevel instead of lowStockThreshold)
      const lowStockProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: {
            lte: prisma.product.fields.minStockLevel,
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          minStockLevel: true,
          costPrice: true,
          basePriceRwf: true
        },
        orderBy: {
          stockQuantity: 'asc'
        }
      })

      // Out of stock products
      const outOfStockProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: 0
        },
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          basePriceRwf: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      // Inventory movements by type (last 30 days) - using stockMovement model
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const movementsByType = await prisma.stockMovement.groupBy({
        by: ['type'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _count: { type: true },
        _sum: { quantity: true }
      })

      // Top moving products (by quantity in last 30 days)
      const topMovingProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.category_id as category,
          SUM(ABS(sm.quantity)) as total_movement,
          p.stock_quantity as current_stock
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE sm.created_at >= ${thirtyDaysAgo}
          AND p.is_active = true
        GROUP BY p.id, p.name, p.sku, p.category_id, p.stock_quantity
        ORDER BY total_movement DESC
        LIMIT 20
      `

      const report: InventoryReportData = {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue: (inventoryValue as any)[0]?.total_value || 0,
        movementsByType,
        topMovingProducts: topMovingProducts as any[]
      }

      // Cache the report
      await redisService.setJSON(cacheKey, report, this.CACHE_TTL)

      return report

    } catch (error) {
      logger.error('Error generating inventory report:', error)
      throw error
    }
  }

  /**
   * Generate staff performance report
   */
  async generateStaffReport(dateRange: DateRange): Promise<StaffReportData> {
    try {
      const cacheKey = `report:staff:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`
      const cached = await redisService.getJSON<StaffReportData>(cacheKey)
      if (cached) return cached

      // Basic staff metrics (using User model instead of staff)
      const [totalStaff, activeStaff] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { isActive: true }
        })
      ])

      // Sales performance by staff (using User model)
      const salesByStaff = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.employee_id,
          u.role,
          COUNT(s.id) as total_sales,
          COALESCE(SUM(s.total_amount), 0) as total_revenue,
          COALESCE(AVG(s.total_amount), 0) as average_order_value,
          COUNT(DISTINCT s.customer_name) as unique_customers_served
        FROM users u
        LEFT JOIN sales s ON u.id = s.cashier_id 
          AND s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
        WHERE u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.employee_id, u.role
        ORDER BY total_revenue DESC
      `

      // Detailed performance metrics (using User model)
      const performanceMetrics = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.employee_id,
          COUNT(DISTINCT DATE(s.created_at)) as days_worked,
          MIN(s.created_at) as first_sale_date,
          MAX(s.created_at) as last_sale_date,
          COUNT(s.id) as total_transactions,
          COALESCE(SUM(s.total_amount), 0) as total_revenue,
          COALESCE(AVG(s.total_amount), 0) as avg_transaction_value,
          COUNT(DISTINCT s.customer_name) as customers_served
        FROM users u
        LEFT JOIN sales s ON u.id = s.cashier_id 
          AND s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
        WHERE u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.employee_id
        HAVING COUNT(s.id) > 0
        ORDER BY total_revenue DESC
      `

      const report: StaffReportData = {
        totalStaff,
        activeStaff,
        salesByStaff: salesByStaff as any[],
        performanceMetrics: performanceMetrics as any[]
      }

      // Cache the report
      await redisService.setJSON(cacheKey, report, this.CACHE_TTL)

      return report

    } catch (error) {
      logger.error('Error generating staff report:', error)
      throw error
    }
  }

  /**
   * Generate financial summary report
   */
  async generateFinancialSummary(dateRange: DateRange): Promise<any> {
    try {
      const cacheKey = `report:financial:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      // Revenue and profit analysis (using correct field names)
      const financialData = await prisma.$queryRaw`
        SELECT 
          COUNT(s.id) as total_transactions,
          SUM(s.total_amount) as total_revenue,
          SUM(s.discount_amount) as total_discounts,
          SUM(s.tax_amount) as total_taxes,
          SUM(si.quantity * p.cost_price) as total_cost,
          SUM(s.total_amount) - SUM(si.quantity * p.cost_price) as gross_profit,
          AVG(s.total_amount) as average_transaction_value
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
          AND p.cost_price IS NOT NULL
      `

      // Payment method breakdown
      const paymentBreakdown = await prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          },
          status: 'COMPLETED'
        },
        _count: { paymentMethod: true },
        _sum: { totalAmount: true }
      })

      // Monthly comparison (if date range allows)
      const monthlyTrend = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', s.created_at) as month,
          COUNT(s.id) as transactions,
          SUM(s.total_amount) as revenue
        FROM sales s
        WHERE s.created_at >= ${dateRange.startDate}
          AND s.created_at <= ${dateRange.endDate}
          AND s.status = 'COMPLETED'
        GROUP BY DATE_TRUNC('month', s.created_at)
        ORDER BY month
      `

      const report = {
        financial: (financialData as any)[0],
        paymentBreakdown,
        monthlyTrend
      }

      // Cache the report
      await redisService.setJSON(cacheKey, report, this.CACHE_TTL)

      return report

    } catch (error) {
      logger.error('Error generating financial summary:', error)
      throw error
    }
  }

  /**
   * Generate custom report based on query
   */
  async generateCustomReport(query: any): Promise<any> {
    try {
      // This is a flexible method that can be extended for custom reporting needs
      const {
        reportType,
        dateRange,
        filters
      } = query

      let result: any = {}

      switch (reportType) {
        case 'product_performance':
          result = await this.generateProductPerformanceReport(dateRange, filters)
          break
        case 'customer_analysis':
          result = await this.generateCustomerAnalysisReport(dateRange, filters)
          break
        default:
          throw new Error(`Unknown report type: ${reportType}`)
      }

      return result

    } catch (error) {
      logger.error('Error generating custom report:', error)
      throw error
    }
  }

  /**
   * Product performance analysis
   */
  private async generateProductPerformanceReport(dateRange: DateRange, filters: any): Promise<any> {
    const categoryFilter = filters?.category ? `AND p.category_id = '${filters.category}'` : ''
    
    const productPerformance = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category_id as category,
        p.cost_price,
        p.base_price_rwf as selling_price,
        SUM(si.quantity) as units_sold,
        SUM(si.total_price) as revenue,
        SUM(si.quantity * p.cost_price) as cost,
        SUM(si.total_price) - SUM(si.quantity * p.cost_price) as profit,
        COUNT(DISTINCT si.sale_id) as order_count,
        AVG(si.negotiated_price) as avg_selling_price
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ${dateRange.startDate}
        AND s.created_at <= ${dateRange.endDate}
        AND s.status = 'COMPLETED'
        ${categoryFilter}
      GROUP BY p.id, p.name, p.sku, p.category_id, p.cost_price, p.base_price_rwf
      ORDER BY revenue DESC
    `

    return { productPerformance }
  }

  /**
   * Customer analysis report
   */
  private async generateCustomerAnalysisReport(dateRange: DateRange, _filters: any): Promise<any> {
    const customerAnalysis = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name as first_name,
        '' as last_name,
        c.email,
        c.phone,
        COUNT(s.id) as total_orders,
        SUM(s.total_amount) as total_spent,
        AVG(s.total_amount) as avg_order_value,
        MIN(s.created_at) as first_purchase,
        MAX(s.created_at) as last_purchase
      FROM customers c
      JOIN sales s ON c.name = s.customer_name OR c.email = s.customer_email OR c.phone = s.customer_phone
      WHERE s.created_at >= ${dateRange.startDate}
        AND s.created_at <= ${dateRange.endDate}
        AND s.status = 'COMPLETED'
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY total_spent DESC
      LIMIT 100
    `

    return { customerAnalysis }
  }

  /**
   * Clear report cache
   */
  async clearReportCache(): Promise<void> {
    try {
      await redisService.invalidatePattern('report:*')
      logger.info('Report cache cleared')
    } catch (error) {
      logger.error('Error clearing report cache:', error)
      throw error
    }
  }
}

export const reportsService = ReportsService.getInstance()
