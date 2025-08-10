import { Request, Response, NextFunction } from 'express';
import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';
import ExportService from '../services/ExportService';
import LocalizationService from '../services/LocalizationService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const analyticsService = AdvancedAnalyticsService.getInstance();
const exportService = ExportService.getInstance();
const localizationService = LocalizationService.getInstance();

// Validation schemas
const profitMarginSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['product', 'category', 'both']).optional()
});

const customerLTVSchema = z.object({
  customerId: z.string().optional(),
  segment: z.enum(['all', 'vip', 'at-risk']).optional()
});

const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']),
  type: z.enum(['sales', 'inventory', 'customers', 'financial', 'analytics']),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string()).optional(),
  includeCharts: z.boolean().optional(),
  template: z.enum(['standard', 'detailed', 'summary']).optional()
});

const scheduleExportSchema = z.object({
  name: z.string(),
  schedule: z.string(), // Cron expression
  exportOptions: exportSchema,
  recipients: z.array(z.string().email()),
  enabled: z.boolean()
});

export class AnalyticsController {
  /**
   * GET /api/analytics/profit-margin
   * Get profit margin analysis
   */
  async getProfitMarginAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = profitMarginSchema.parse(req.query);
      
      const analysis = await analyticsService.getProfitMarginAnalysis(
        new Date(validated.startDate),
        new Date(validated.endDate),
        validated.groupBy
      );

      // Format numbers according to user's locale
      const userId = (req as any).user?.id;
      if (userId) {
        const formattedAnalysis = {
          ...analysis,
          overall: {
            ...analysis.overall,
            revenue: localizationService.formatNumber(
              analysis.overall.revenue,
              userId,
              { style: 'currency' }
            ).formatted,
            profit: localizationService.formatNumber(
              analysis.overall.profit,
              userId,
              { style: 'currency' }
            ).formatted,
            marginPercentage: localizationService.formatNumber(
              analysis.overall.marginPercentage / 100,
              userId,
              { style: 'percent' }
            ).formatted
          }
        };

        res.json({
          success: true,
          data: formattedAnalysis
        });
      } else {
        res.json({
          success: true,
          data: analysis
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/customer-ltv
   * Get customer lifetime value analysis
   */
  async getCustomerLifetimeValue(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = customerLTVSchema.parse(req.query);
      
      const ltvData = await analyticsService.getCustomerLifetimeValue(
        validated.customerId,
        validated.segment
      );

      // Format currency values
      const userId = (req as any).user?.id;
      if (userId) {
        ltvData.forEach(customer => {
          customer.metrics.totalSpent = localizationService.formatNumber(
            customer.metrics.totalSpent,
            userId,
            { style: 'currency' }
          ).formatted as any;
          
          customer.metrics.averageOrderValue = localizationService.formatNumber(
            customer.metrics.averageOrderValue,
            userId,
            { style: 'currency' }
          ).formatted as any;
          
          customer.metrics.predictedLTV = localizationService.formatNumber(
            customer.metrics.predictedLTV,
            userId,
            { style: 'currency' }
          ).formatted as any;
        });
      }

      res.json({
        success: true,
        data: ltvData,
        summary: {
          totalCustomers: ltvData.length,
          avgLTV: ltvData.reduce((sum, c) => sum + c.metrics.predictedLTV, 0) / ltvData.length,
          vipCount: ltvData.filter(c => c.metrics.segment === 'vip').length,
          atRiskCount: ltvData.filter(c => c.metrics.segment === 'at-risk').length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/inventory-aging
   * Get inventory aging report
   */
  async getInventoryAgingReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await analyticsService.getInventoryAgingReport();
      
      // Format currency values
      const userId = (req as any).user?.id;
      if (userId) {
        report.summary.totalInventoryValue = localizationService.formatNumber(
          report.summary.totalInventoryValue,
          userId,
          { style: 'currency' }
        ).formatted as any;
        
        report.summary.writeOffRecommended = localizationService.formatNumber(
          report.summary.writeOffRecommended,
          userId,
          { style: 'currency' }
        ).formatted as any;
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/export
   * Export data in various formats
   */
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = exportSchema.parse(req.body);
      
      // Convert date strings to Date objects
      const exportOptions = {
        ...validated,
        dateRange: validated.dateRange ? {
          start: new Date(validated.dateRange.start),
          end: new Date(validated.dateRange.end)
        } : undefined
      };
      
      let buffer: Buffer;
      let contentType: string;
      let filename: string;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      switch (validated.format) {
        case 'excel':
          buffer = await exportService.exportToExcel(exportOptions);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${validated.type}_export_${timestamp}.xlsx`;
          break;
          
        case 'pdf':
          buffer = await exportService.exportToPDF(exportOptions);
          contentType = 'application/pdf';
          filename = `${validated.type}_report_${timestamp}.pdf`;
          break;
          
        case 'csv':
        default:
          buffer = await exportService.exportToCSV(exportOptions);
          contentType = 'text/csv';
          filename = `${validated.type}_export_${timestamp}.csv`;
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/schedule
   * Schedule automated report generation
   */
  async scheduleReport(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = scheduleExportSchema.parse(req.body);
      
      // Convert date strings to Date objects in exportOptions
      const exportOptions = {
        ...validated.exportOptions,
        dateRange: validated.exportOptions.dateRange ? {
          start: new Date(validated.exportOptions.dateRange.start),
          end: new Date(validated.exportOptions.dateRange.end)
        } : undefined
      };
      
      const scheduledExport = {
        id: crypto.randomUUID(),
        name: validated.name,
        schedule: validated.schedule,
        exportOptions,
        recipients: validated.recipients,
        enabled: validated.enabled,
        lastRun: undefined,
        nextRun: undefined
      };
      
      await exportService.scheduleExport(scheduledExport);
      
      res.json({
        success: true,
        message: 'Report scheduled successfully',
        data: scheduledExport
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/scheduled
   * Get all scheduled reports
   */
  async getScheduledReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await exportService.getScheduledExports();
      
      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/reports/scheduled/:id
   * Cancel a scheduled report
   */
  async cancelScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      await exportService.deleteScheduledExport(id);
      
      res.json({
        success: true,
        message: 'Scheduled report cancelled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/analytics/dashboard
   * Get comprehensive dashboard data
   */
  async getDashboardAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      // Gather all analytics data in parallel
      const [profitMargin, inventoryAging, topCustomers] = await Promise.all([
        analyticsService.getProfitMarginAnalysis(startDate, endDate, 'both'),
        analyticsService.getInventoryAgingReport(),
        analyticsService.getCustomerLifetimeValue(undefined, 'vip')
      ]);
      
      res.json({
        success: true,
        data: {
          profitMargin: {
            overall: profitMargin.overall,
            topProducts: profitMargin.byProduct.slice(0, 5),
            topCategories: profitMargin.byCategory.slice(0, 5),
            trends: profitMargin.trends
          },
          inventory: {
            summary: inventoryAging.summary,
            agingBrackets: inventoryAging.agingBrackets,
            criticalItems: inventoryAging.deadStock.slice(0, 10)
          },
          customers: {
            topCustomers: topCustomers.slice(0, 10),
            segments: {
              vip: topCustomers.filter(c => c.metrics.segment === 'vip').length,
              loyal: topCustomers.filter(c => c.metrics.segment === 'loyal').length,
              regular: topCustomers.filter(c => c.metrics.segment === 'regular').length,
              atRisk: topCustomers.filter(c => c.metrics.segment === 'at-risk').length
            }
          },
          period: {
            start: startDate,
            end: endDate,
            label: period
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/sales-trends
   * Get sales trend analysis (placeholder - requires implementation in service)
   */
  async getSalesTrends(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: false,
        message: 'Sales trends endpoint not yet implemented in AdvancedAnalyticsService'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/product-performance
   * Get product performance analytics (placeholder - requires implementation in service)
   */
  async getProductPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: false,
        message: 'Product performance endpoint not yet implemented in AdvancedAnalyticsService'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/staff-performance
   * Get staff performance metrics (placeholder - requires implementation in service)
   */
  async getStaffPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: false,
        message: 'Staff performance endpoint not yet implemented in AdvancedAnalyticsService'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
