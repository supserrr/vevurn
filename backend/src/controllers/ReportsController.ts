import { Request, Response, NextFunction } from 'express'
import { reportsService } from '../services/ReportsService'
import { logger } from '../utils/logger'
import { z } from 'zod'

const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
})

export class ReportsController {
  /**
   * Generate sales report
   */
  static async getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, staffId } = dateRangeSchema.extend({
        staffId: z.string().uuid().optional()
      }).parse(req.query)

      const report = await reportsService.generateSalesReport(
        { startDate, endDate },
        staffId
      )

      res.json({
        success: true,
        data: report
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid date range parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Generate inventory report
   */
  static async getInventoryReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.generateInventoryReport()

      res.json({
        success: true,
        data: report
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Generate staff report
   */
  static async getStaffReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = dateRangeSchema.parse(req.query)

      const report = await reportsService.generateStaffReport({ startDate, endDate })

      res.json({
        success: true,
        data: report
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid date range parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Generate financial summary
   */
  static async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = dateRangeSchema.parse(req.query)

      const report = await reportsService.generateFinancialSummary({ startDate, endDate })

      res.json({
        success: true,
        data: report
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid date range parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Generate custom report
   */
  static async getCustomReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customReportSchema = z.object({
        reportType: z.enum(['product_performance', 'customer_analysis']),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        filters: z.object({
          category: z.string().optional()
        }).optional()
      })

      const query = customReportSchema.parse(req.body)

      const report = await reportsService.generateCustomReport({
        ...query,
        dateRange: {
          startDate: query.startDate,
          endDate: query.endDate
        }
      })

      res.json({
        success: true,
        data: report
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid custom report parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Get dashboard summary
   */
  static async getDashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get summary for today and last 7 days
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)

      // Get concurrent reports
      const [todaySales, weekSales, monthSales, inventorySummary, staffSummary] = await Promise.all([
        reportsService.generateSalesReport({ startDate: yesterday, endDate: today }),
        reportsService.generateSalesReport({ startDate: weekAgo, endDate: today }),
        reportsService.generateSalesReport({ startDate: monthAgo, endDate: today }),
        reportsService.generateInventoryReport(),
        reportsService.generateStaffReport({ startDate: monthAgo, endDate: today })
      ])

      const summary = {
        today: {
          sales: todaySales.totalSales,
          revenue: todaySales.totalRevenue,
          averageOrder: todaySales.averageOrderValue
        },
        thisWeek: {
          sales: weekSales.totalSales,
          revenue: weekSales.totalRevenue,
          averageOrder: weekSales.averageOrderValue
        },
        thisMonth: {
          sales: monthSales.totalSales,
          revenue: monthSales.totalRevenue,
          averageOrder: monthSales.averageOrderValue
        },
        inventory: {
          totalProducts: inventorySummary.totalProducts,
          lowStockCount: inventorySummary.lowStockProducts.length,
          outOfStockCount: inventorySummary.outOfStockProducts.length,
          totalValue: inventorySummary.inventoryValue
        },
        staff: {
          totalStaff: staffSummary.totalStaff,
          activeStaff: staffSummary.activeStaff,
          topPerformer: staffSummary.salesByStaff[0] || null
        }
      }

      res.json({
        success: true,
        data: summary
      })

    } catch (error) {
      logger.error('Error generating dashboard summary:', error)
      next(error)
    }
  }

  /**
   * Export report as CSV
   */
  static async exportReportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exportSchema = z.object({
        reportType: z.enum(['sales', 'inventory', 'staff', 'financial']),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        staffId: z.string().uuid().optional()
      })

      const { reportType, startDate, endDate, staffId } = exportSchema.parse(req.query)

      let data: any
      let filename: string
      let headers: string[]

      switch (reportType) {
        case 'sales':
          if (!startDate || !endDate) {
            res.status(400).json({
              success: false,
              message: 'Start date and end date are required for sales report'
            })
            return
          }
          data = await reportsService.generateSalesReport({ startDate, endDate }, staffId)
          filename = `sales_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`
          headers = ['Date', 'Sales Count', 'Revenue', 'Average Order Value']
          break

        case 'inventory':
          data = await reportsService.generateInventoryReport()
          filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`
          headers = ['Product', 'SKU', 'Stock Quantity', 'Min Stock Level', 'Value']
          break

        case 'staff':
          if (!startDate || !endDate) {
            res.status(400).json({
              success: false,
              message: 'Start date and end date are required for staff report'
            })
            return
          }
          data = await reportsService.generateStaffReport({ startDate, endDate })
          filename = `staff_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`
          headers = ['Staff Name', 'Employee ID', 'Total Sales', 'Total Revenue', 'Average Order Value']
          break

        case 'financial':
          if (!startDate || !endDate) {
            res.status(400).json({
              success: false,
              message: 'Start date and end date are required for financial report'
            })
            return
          }
          data = await reportsService.generateFinancialSummary({ startDate, endDate })
          filename = `financial_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`
          headers = ['Metric', 'Value']
          break

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid report type'
          })
          return
      }

      // Convert data to CSV format
      let csvContent = headers.join(',') + '\n'

      if (reportType === 'sales') {
        data.salesByDay.forEach((day: any) => {
          csvContent += `${day.sale_date},${day.total_sales},${day.total_revenue},${day.total_revenue / day.total_sales}\n`
        })
      } else if (reportType === 'inventory') {
        data.lowStockProducts.concat(data.outOfStockProducts).forEach((product: any) => {
          csvContent += `${product.name},${product.sku},${product.stockQuantity},${product.minStockLevel},${product.costPrice * product.stockQuantity}\n`
        })
      } else if (reportType === 'staff') {
        data.salesByStaff.forEach((staff: any) => {
          csvContent += `${staff.first_name} ${staff.last_name},${staff.employee_id},${staff.total_sales},${staff.total_revenue},${staff.average_order_value}\n`
        })
      } else if (reportType === 'financial') {
        const financial = data.financial
        csvContent += `Total Transactions,${financial.total_transactions}\n`
        csvContent += `Total Revenue,${financial.total_revenue}\n`
        csvContent += `Total Discounts,${financial.total_discounts}\n`
        csvContent += `Total Taxes,${financial.total_taxes}\n`
        csvContent += `Gross Profit,${financial.gross_profit}\n`
      }

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(csvContent)

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid export parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Clear report cache
   */
  static async clearReportCache(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await reportsService.clearReportCache()

      res.json({
        success: true,
        message: 'Report cache cleared successfully'
      })

    } catch (error) {
      next(error)
    }
  }
}
