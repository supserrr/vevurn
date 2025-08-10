// backend/src/services/ExportService.ts

import { PrismaClient } from '@prisma/client';
import { RedisService } from './RedisService';
import { S3Service } from './S3Service';
import EmailService from './EmailService';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';

const prisma = new PrismaClient();
const redis = new RedisService();
const s3Service = new S3Service();
const emailService = EmailService.getInstance();

// Date utility functions (replacing date-fns)
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'yyyy-MM-dd': return `${year}-${month}-${day}`;
    case 'yyyy-MM-dd_HH-mm-ss': return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    case 'HH:mm:ss': return `${hours}:${minutes}:${seconds}`;
    case 'MMM dd, yyyy': return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'MMMM dd, yyyy HH:mm:ss': return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ` ${hours}:${minutes}:${seconds}`;
    default: return date.toISOString();
  }
};

// Simple JSON to CSV converter
const jsonToCsv = (data: any[], fields?: string[]): string => {
  if (data.length === 0) return '';
  
  const keys = fields || Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
};

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  type: 'sales' | 'inventory' | 'customers' | 'financial' | 'analytics';
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  columns?: string[];
  groupBy?: string;
  includeCharts?: boolean;
  template?: 'standard' | 'detailed' | 'summary';
}

interface ScheduledExport {
  id: string;
  name: string;
  schedule: string; // Cron expression
  exportOptions: ExportOptions;
  recipients: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class ExportService {
  private static instance: ExportService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  static getInstance(): ExportService {
    if (!this.instance) {
      this.instance = new ExportService();
    }
    return this.instance;
  }

  constructor() {
    this.loadScheduledExports();
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(options: ExportOptions): Promise<Buffer> {
    try {
      const data = await this.fetchReportData(options);
      let csvContent = '';

      switch (options.type) {
        case 'sales':
          csvContent = this.generateSalesCSV(data.sales, options);
          break;
        case 'inventory':
          csvContent = this.generateInventoryCSV(data.inventory, options);
          break;
        case 'customers':
          csvContent = this.generateCustomersCSV(data.customers, options);
          break;
        case 'financial':
          csvContent = this.generateFinancialCSV(data.financial, options);
          break;
        case 'analytics':
          csvContent = this.generateAnalyticsCSV(data.analytics, options);
          break;
        default:
          throw new Error(`Unsupported export type: ${options.type}`);
      }

      return Buffer.from(csvContent, 'utf-8');
    } catch (error) {
      logger.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export data to Excel format (simplified without ExcelJS)
   */
  async exportToExcel(options: ExportOptions): Promise<Buffer> {
    try {
      // For now, return CSV with .xlsx extension as a placeholder
      // In production, you would use a proper Excel library like exceljs
      const csvBuffer = await this.exportToCSV(options);
      
      // Create a simple HTML table that can be opened by Excel
      const data = await this.fetchReportData(options);
      const htmlContent = this.generateExcelHTML(data, options);
      
      return Buffer.from(htmlContent, 'utf-8');
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Export data to PDF format (simplified without external libraries)
   */
  async exportToPDF(options: ExportOptions): Promise<Buffer> {
    try {
      // Generate HTML content that can be converted to PDF
      const htmlContent = await this.generatePDFHTML(options);
      
      // Return HTML buffer (in production, use puppeteer or similar to convert to PDF)
      return Buffer.from(htmlContent, 'utf-8');
    } catch (error) {
      logger.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Schedule automated report generation and delivery
   */
  async scheduleExport(scheduledExport: ScheduledExport): Promise<void> {
    try {
      // Save scheduled export to database
      await prisma.setting.upsert({
        where: { key: `scheduled_export_${scheduledExport.id}` },
        update: { value: JSON.stringify(scheduledExport) },
        create: {
          key: `scheduled_export_${scheduledExport.id}`,
          value: JSON.stringify(scheduledExport),
          category: 'scheduled_exports'
        }
      });

      // Cancel existing job if exists
      if (this.scheduledJobs.has(scheduledExport.id)) {
        this.scheduledJobs.get(scheduledExport.id)?.stop();
      }

      if (scheduledExport.enabled) {
        // Schedule new job
        const job = cron.schedule(scheduledExport.schedule, async () => {
          await this.executeScheduledExport(scheduledExport);
        });

        this.scheduledJobs.set(scheduledExport.id, job);
        job.start();

        logger.info(`Scheduled export ${scheduledExport.name} created with schedule: ${scheduledExport.schedule}`);
      }
    } catch (error) {
      logger.error('Error scheduling export:', error);
      throw error;
    }
  }

  /**
   * Execute a scheduled export
   */
  private async executeScheduledExport(scheduledExport: ScheduledExport): Promise<void> {
    try {
      logger.info(`Executing scheduled export: ${scheduledExport.name}`);

      // Generate the export
      let exportBuffer: Buffer;
      let filename: string;
      const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');

      switch (scheduledExport.exportOptions.format) {
        case 'excel':
          exportBuffer = await this.exportToExcel(scheduledExport.exportOptions);
          filename = `${scheduledExport.name}_${timestamp}.xlsx`;
          break;
        case 'pdf':
          exportBuffer = await this.exportToPDF(scheduledExport.exportOptions);
          filename = `${scheduledExport.name}_${timestamp}.pdf`;
          break;
        case 'csv':
        default:
          exportBuffer = await this.exportToCSV(scheduledExport.exportOptions);
          filename = `${scheduledExport.name}_${timestamp}.csv`;
          break;
      }

      // Upload to S3
      const s3Result = await s3Service.uploadFile(
        exportBuffer,
        filename,
        {
          folder: 'scheduled-exports',
          contentType: this.getContentType(scheduledExport.exportOptions.format)
        }
      );

      // Generate signed URL for download (valid for 7 days)
      const downloadUrl = await s3Service.getSignedUrl(s3Result.key, 604800);

      // Send email to recipients
      for (const recipient of scheduledExport.recipients) {
        await emailService.sendEmail({
          to: recipient,
          subject: `Scheduled Report: ${scheduledExport.name}`,
          html: this.getExportEmailTemplate(scheduledExport, downloadUrl, filename),
          attachments: [
            {
              filename,
              content: exportBuffer
            }
          ]
        });
      }

      // Update last run time
      scheduledExport.lastRun = new Date();
      await this.scheduleExport(scheduledExport);

      logger.info(`Scheduled export ${scheduledExport.name} completed and sent to ${scheduledExport.recipients.length} recipients`);
    } catch (error) {
      logger.error(`Error executing scheduled export ${scheduledExport.name}:`, error);
    }
  }

  /**
   * Load and initialize all scheduled exports on startup
   */
  private async loadScheduledExports(): Promise<void> {
    try {
      const scheduledExports = await prisma.setting.findMany({
        where: { category: 'scheduled_exports' }
      });

      for (const exportSetting of scheduledExports) {
        const scheduledExport = JSON.parse(exportSetting.value as string) as ScheduledExport;
        if (scheduledExport.enabled) {
          await this.scheduleExport(scheduledExport);
        }
      }

      logger.info(`Loaded ${scheduledExports.length} scheduled exports`);
    } catch (error) {
      logger.error('Error loading scheduled exports:', error);
    }
  }

  /**
   * Fetch report data based on export options
   */
  private async fetchReportData(options: ExportOptions): Promise<any> {
    const whereClause = {
      createdAt: options.dateRange ? {
        gte: options.dateRange.start,
        lte: options.dateRange.end
      } : undefined,
      ...options.filters
    };

    switch (options.type) {
      case 'sales':
        return {
          sales: await prisma.sale.findMany({
            where: whereClause,
            include: {
              items: {
                include: {
                  product: true
                }
              },
              customer: true,
              createdBy: true
            },
            orderBy: { createdAt: 'desc' }
          })
        };

      case 'inventory':
        return {
          inventory: await prisma.product.findMany({
            where: options.filters,
            include: {
              category: true,
              supplier: true,
              stockMovements: {
                take: 5,
                orderBy: { createdAt: 'desc' }
              }
            }
          })
        };

      case 'customers':
        return {
          customers: await prisma.customer.findMany({
            where: options.filters,
            include: {
              sales: {
                where: whereClause,
                include: {
                  items: true
                }
              }
            }
          })
        };

      case 'financial':
        const sales = await prisma.sale.findMany({
          where: { ...whereClause, status: 'COMPLETED' },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        const expenses = await prisma.expense.findMany({
          where: whereClause
        });

        return { sales, expenses };

      case 'analytics':
        // Return analytics data (would integrate with AdvancedAnalyticsService)
        return {
          analytics: {
            totalSales: await prisma.sale.count({ where: whereClause }),
            totalRevenue: await prisma.sale.aggregate({
              where: { ...whereClause, status: 'COMPLETED' },
              _sum: { totalAmount: true }
            }),
            topProducts: await prisma.product.findMany({
              include: {
                saleItems: {
                  where: {
                    sale: whereClause
                  }
                }
              },
              orderBy: {
                saleItems: {
                  _count: 'desc'
                }
              },
              take: 10
            })
          }
        };

      default:
        throw new Error(`Unsupported export type: ${options.type}`);
    }
  }

  /**
   * Generate sales CSV content
   */
  private generateSalesCSV(sales: any[], options: ExportOptions): string {
    const salesData = sales.map(sale => ({
      id: sale.id,
      date: formatDate(sale.createdAt, 'yyyy-MM-dd'),
      time: formatDate(sale.createdAt, 'HH:mm:ss'),
      customer: sale.customer?.name || 'Walk-in',
      items: sale.items.length,
      subtotal: sale.subtotal,
      tax: sale.taxAmount,
      discount: sale.discountAmount,
      total: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      cashier: `${sale.createdBy.firstName} ${sale.createdBy.lastName}`
    }));

    return jsonToCsv(salesData, options.columns);
  }

  /**
   * Generate inventory CSV content
   */
  private generateInventoryCSV(inventory: any[], options: ExportOptions): string {
    const inventoryData = inventory.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'Uncategorized',
      supplier: product.supplier?.name || 'N/A',
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      status: product.status,
      lastUpdated: formatDate(product.updatedAt, 'yyyy-MM-dd')
    }));

    return jsonToCsv(inventoryData, options.columns);
  }

  /**
   * Generate customers CSV content
   */
  private generateCustomersCSV(customers: any[], options: ExportOptions): string {
    const customersData = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email || 'N/A',
      phone: customer.phone,
      address: customer.address || 'N/A',
      totalSales: customer.sales?.length || 0,
      totalSpent: customer.sales?.reduce((sum: number, sale: any) => 
        sale.status === 'COMPLETED' ? sum + sale.totalAmount : sum, 0) || 0,
      lastPurchase: customer.sales?.[0]?.createdAt ? 
        formatDate(customer.sales[0].createdAt, 'yyyy-MM-dd') : 'Never',
      dateAdded: formatDate(customer.createdAt, 'yyyy-MM-dd')
    }));

    return jsonToCsv(customersData, options.columns);
  }

  /**
   * Generate financial CSV content
   */
  private generateFinancialCSV(financial: any, options: ExportOptions): string {
    const { sales, expenses } = financial;
    
    const revenue = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    
    const financialData = [
      {
        metric: 'Total Revenue',
        amount: revenue,
        type: 'Income',
        period: options.dateRange ? 
          `${formatDate(options.dateRange.start, 'yyyy-MM-dd')} to ${formatDate(options.dateRange.end, 'yyyy-MM-dd')}` : 
          'All Time'
      },
      {
        metric: 'Total Expenses',
        amount: totalExpenses,
        type: 'Expense',
        period: options.dateRange ? 
          `${formatDate(options.dateRange.start, 'yyyy-MM-dd')} to ${formatDate(options.dateRange.end, 'yyyy-MM-dd')}` : 
          'All Time'
      },
      {
        metric: 'Net Profit',
        amount: revenue - totalExpenses,
        type: 'Profit',
        period: options.dateRange ? 
          `${formatDate(options.dateRange.start, 'yyyy-MM-dd')} to ${formatDate(options.dateRange.end, 'yyyy-MM-dd')}` : 
          'All Time'
      }
    ];

    return jsonToCsv(financialData, options.columns);
  }

  /**
   * Generate analytics CSV content
   */
  private generateAnalyticsCSV(analytics: any, options: ExportOptions): string {
    const analyticsData = [
      {
        metric: 'Total Sales',
        value: analytics.totalSales,
        type: 'Count'
      },
      {
        metric: 'Total Revenue',
        value: analytics.totalRevenue._sum.totalAmount || 0,
        type: 'Amount'
      },
      {
        metric: 'Top Products Count',
        value: analytics.topProducts.length,
        type: 'Count'
      }
    ];

    return jsonToCsv(analyticsData, options.columns);
  }

  /**
   * Generate HTML content for Excel export
   */
  private generateExcelHTML(data: any, options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${options.type.toUpperCase()} Report</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4472C4; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Vevurn POS - ${options.type.toUpperCase()} Report</h1>
        <p>Generated on: ${formatDate(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
        ${this.generateHTMLTable(data, options)}
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF HTML content
   */
  private async generatePDFHTML(options: ExportOptions): Promise<string> {
    const data = await this.fetchReportData(options);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${options.type.toUpperCase()} Report</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #4472C4; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #4472C4; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4472C4; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Vevurn POS System</h1>
          <h2>${options.type.toUpperCase()} Report</h2>
          <p>Generated on ${formatDate(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
          ${options.dateRange ? `<p>Period: ${formatDate(options.dateRange.start, 'MMM dd, yyyy')} - ${formatDate(options.dateRange.end, 'MMM dd, yyyy')}</p>` : ''}
        </div>
        ${this.generateHTMLTable(data, options)}
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Vevurn POS System. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML table for reports
   */
  private generateHTMLTable(data: any, options: ExportOptions): string {
    switch (options.type) {
      case 'sales':
        return this.generateSalesHTMLTable(data.sales);
      case 'inventory':
        return this.generateInventoryHTMLTable(data.inventory);
      case 'customers':
        return this.generateCustomersHTMLTable(data.customers);
      default:
        return '<p>No data available</p>';
    }
  }

  private generateSalesHTMLTable(sales: any[]): string {
    if (!sales || sales.length === 0) return '<p>No sales data available</p>';

    const headers = ['Sale ID', 'Date', 'Customer', 'Items', 'Total', 'Status'];
    const rows = sales.map(sale => [
      sale.id,
      formatDate(sale.createdAt, 'yyyy-MM-dd'),
      sale.customer?.name || 'Walk-in',
      sale.items.length,
      sale.totalAmount.toLocaleString(),
      sale.status
    ]);

    return this.createHTMLTable(headers, rows);
  }

  private generateInventoryHTMLTable(inventory: any[]): string {
    if (!inventory || inventory.length === 0) return '<p>No inventory data available</p>';

    const headers = ['Product', 'SKU', 'Category', 'Stock', 'Price'];
    const rows = inventory.map(product => [
      product.name,
      product.sku,
      product.category?.name || 'Uncategorized',
      product.stockQuantity,
      product.sellingPrice.toLocaleString()
    ]);

    return this.createHTMLTable(headers, rows);
  }

  private generateCustomersHTMLTable(customers: any[]): string {
    if (!customers || customers.length === 0) return '<p>No customer data available</p>';

    const headers = ['Name', 'Phone', 'Email', 'Total Sales', 'Total Spent'];
    const rows = customers.map(customer => [
      customer.name,
      customer.phone,
      customer.email || 'N/A',
      customer.sales?.length || 0,
      customer.sales?.reduce((sum: number, sale: any) => 
        sale.status === 'COMPLETED' ? sum + sale.totalAmount : sum, 0).toLocaleString() || '0'
    ]);

    return this.createHTMLTable(headers, rows);
  }

  private createHTMLTable(headers: string[], rows: any[][]): string {
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const dataRows = rows.map(row => 
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
      <table>
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
    `;
  }

  /**
   * Get email template for export notifications
   */
  private getExportEmailTemplate(scheduledExport: ScheduledExport, downloadUrl: string, filename: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Vevurn POS System</h1>
          <h2 style="margin: 10px 0 0 0;">Scheduled Report Ready</h2>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h3 style="color: #333; margin-top: 0;">Report: ${scheduledExport.name}</h3>
          <p style="color: #666; line-height: 1.6;">
            Your scheduled report has been generated successfully and is ready for download.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #333;">Report Details:</h4>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Type:</strong> ${scheduledExport.exportOptions.type.toUpperCase()}</li>
              <li><strong>Format:</strong> ${scheduledExport.exportOptions.format.toUpperCase()}</li>
              <li><strong>Generated:</strong> ${formatDate(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</li>
              <li><strong>File:</strong> ${filename}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${downloadUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Download Report
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            This download link will expire in 7 days. The report is also attached to this email.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            &copy; ${new Date().getFullYear()} Vevurn POS System. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf': return 'application/pdf';
      case 'csv': return 'text/csv';
      default: return 'application/octet-stream';
    }
  }

  /**
   * Get all scheduled exports
   */
  async getScheduledExports(): Promise<ScheduledExport[]> {
    try {
      const settings = await prisma.setting.findMany({
        where: { category: 'scheduled_exports' }
      });

      return settings.map(s => JSON.parse(s.value as string) as ScheduledExport);
    } catch (error) {
      logger.error('Error getting scheduled exports:', error);
      throw error;
    }
  }

  /**
   * Delete a scheduled export
   */
  async deleteScheduledExport(exportId: string): Promise<void> {
    try {
      // Stop the cron job
      if (this.scheduledJobs.has(exportId)) {
        this.scheduledJobs.get(exportId)?.stop();
        this.scheduledJobs.delete(exportId);
      }

      // Delete from database
      await prisma.setting.delete({
        where: { key: `scheduled_export_${exportId}` }
      });

      logger.info(`Scheduled export ${exportId} deleted`);
    } catch (error) {
      logger.error('Error deleting scheduled export:', error);
      throw error;
    }
  }
}

export default ExportService;
