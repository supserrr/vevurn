// backend/src/controllers/ExportController.ts

import { Request, Response } from 'express';
import ExportService from '../services/ExportService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const exportService = ExportService.getInstance();

export class ExportController {
  /**
   * Generate and download report
   * POST /api/exports/generate
   */
  static async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { format, type, dateRange, filters, columns, groupBy, includeCharts, template } = req.body;

      if (!format || !type) {
        res.status(400).json({
          success: false,
          message: 'Format and type are required'
        });
        return;
      }

      const options = {
        format,
        type,
        dateRange: dateRange ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined,
        filters,
        columns,
        groupBy,
        includeCharts: includeCharts || false,
        template: template || 'standard'
      };

      let exportBuffer: Buffer;
      let contentType: string;
      let filename: string;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      switch (format) {
        case 'excel':
          exportBuffer = await exportService.exportToExcel(options);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${type}_report_${timestamp}.xlsx`;
          break;
        case 'pdf':
          exportBuffer = await exportService.exportToPDF(options);
          contentType = 'application/pdf';
          filename = `${type}_report_${timestamp}.pdf`;
          break;
        case 'csv':
        default:
          exportBuffer = await exportService.exportToCSV(options);
          contentType = 'text/csv';
          filename = `${type}_report_${timestamp}.csv`;
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportBuffer);
    } catch (error) {
      logger.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Schedule a report for automated generation
   * POST /api/exports/schedule
   */
  static async scheduleReport(req: Request, res: Response): Promise<void> {
    try {
      const { name, schedule, exportOptions, recipients } = req.body;

      if (!name || !schedule || !exportOptions || !recipients) {
        res.status(400).json({
          success: false,
          message: 'Name, schedule, exportOptions, and recipients are required'
        });
        return;
      }

      const scheduledExport = {
        id: uuidv4(),
        name,
        schedule,
        exportOptions,
        recipients,
        enabled: true,
        createdAt: new Date()
      };

      await exportService.scheduleExport(scheduledExport);

      res.json({
        success: true,
        message: 'Report scheduled successfully',
        data: scheduledExport
      });
    } catch (error) {
      logger.error('Error scheduling report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule report',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get all scheduled reports
   * GET /api/exports/scheduled
   */
  static async getScheduledReports(req: Request, res: Response): Promise<void> {
    try {
      const scheduledExports = await exportService.getScheduledExports();

      res.json({
        success: true,
        data: scheduledExports
      });
    } catch (error) {
      logger.error('Error getting scheduled reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled reports',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Update a scheduled report
   * PUT /api/exports/scheduled/:id
   */
  static async updateScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, schedule, exportOptions, recipients, enabled } = req.body;

      const scheduledExport = {
        id,
        name,
        schedule,
        exportOptions,
        recipients,
        enabled: enabled !== undefined ? enabled : true,
        updatedAt: new Date()
      };

      await exportService.scheduleExport(scheduledExport);

      res.json({
        success: true,
        message: 'Scheduled report updated successfully',
        data: scheduledExport
      });
    } catch (error) {
      logger.error('Error updating scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled report',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Delete a scheduled report
   * DELETE /api/exports/scheduled/:id
   */
  static async deleteScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await exportService.deleteScheduledExport(id);

      res.json({
        success: true,
        message: 'Scheduled report deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheduled report',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get export templates and options
   * GET /api/exports/templates
   */
  static async getExportTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = {
        formats: ['csv', 'excel', 'pdf'],
        types: ['sales', 'inventory', 'customers', 'financial', 'analytics'],
        templates: ['standard', 'detailed', 'summary'],
        scheduleExamples: {
          daily: '0 9 * * *',
          weekly: '0 9 * * 1',
          monthly: '0 9 1 * *',
          custom: 'Custom cron expression'
        },
        columnOptions: {
          sales: ['id', 'date', 'time', 'customer', 'items', 'subtotal', 'tax', 'discount', 'total', 'paymentMethod', 'status', 'cashier'],
          inventory: ['id', 'name', 'sku', 'category', 'supplier', 'stockQuantity', 'reorderLevel', 'costPrice', 'sellingPrice', 'status'],
          customers: ['id', 'name', 'email', 'phone', 'address', 'totalSales', 'totalSpent', 'lastPurchase', 'dateAdded'],
          financial: ['metric', 'amount', 'type', 'period'],
          analytics: ['metric', 'value', 'type']
        }
      };

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Error getting export templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get export templates',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Test scheduled export (for development)
   * POST /api/exports/test/:id
   */
  static async testScheduledExport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const scheduledExports = await exportService.getScheduledExports();
      const scheduledExport = scheduledExports.find(e => e.id === id);
      
      if (!scheduledExport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled export not found'
        });
        return;
      }

      // This would trigger the export manually for testing
      // In production, this endpoint might be removed or protected
      res.json({
        success: true,
        message: 'Test export triggered (implementation depends on requirements)',
        data: { scheduledExport }
      });
    } catch (error) {
      logger.error('Error testing scheduled export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test scheduled export',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}

export default ExportController;
