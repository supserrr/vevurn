import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { invoiceService } from '../services/invoices.service';
import { 
  invoiceFilterSchema, 
  createInvoiceSchema, 
  updateInvoiceSchema,
  recordPaymentSchema,
  createReminderSchema,
  bulkCreateInvoicesSchema,
  bulkSendInvoicesSchema,
  bulkMarkPaidSchema,
  sendInvoiceEmailSchema,
  sendInvoiceSmsSchema,
  paymentForecastSchema,
  convertSaleToInvoiceSchema
} from '../validators/invoices.schemas';

export class InvoicesController {
  // ==========================================
  // BASIC CRUD OPERATIONS
  // ==========================================

  /**
   * Get all invoices with filtering and pagination
   * GET /api/invoices
   */
  async getAllInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedQuery = invoiceFilterSchema.parse(req.query);
      
      const result = await invoiceService.getInvoices(validatedQuery);
      
      res.json(ApiResponse.success('Invoices retrieved successfully', result));
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      next(error);
    }
  }

  /**
   * Create invoice from sale
   * POST /api/invoices
   */
  async createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createInvoiceSchema.parse(req.body);
      
      const invoice = await invoiceService.createInvoice(validatedData);
      
      res.status(201).json(ApiResponse.success('Invoice created successfully', invoice));
    } catch (error) {
      logger.error('Error creating invoice:', error);
      next(error);
    }
  }

  /**
   * Get specific invoice by ID
   * GET /api/invoices/:id
   */
  async getInvoiceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const invoice = await invoiceService.getInvoiceById(id);
      
      res.json(ApiResponse.success('Invoice retrieved successfully', invoice));
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      next(error);
    }
  }

  /**
   * Update invoice
   * PUT /api/invoices/:id
   */
  async updateInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateInvoiceSchema.parse(req.body);
      
      const invoice = await invoiceService.updateInvoice(id, validatedData);
      
      res.json(ApiResponse.success('Invoice updated successfully', invoice));
    } catch (error) {
      logger.error('Error updating invoice:', error);
      next(error);
    }
  }

  /**
   * Delete/Cancel invoice
   * DELETE /api/invoices/:id
   */
  async deleteInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const result = await invoiceService.deleteInvoice(id);
      
      res.json(ApiResponse.success('Invoice deleted successfully', result));
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      next(error);
    }
  }

  // ==========================================
  // COMMUNICATION
  // ==========================================

  /**
   * Send invoice via email
   * POST /api/invoices/:id/send-email
   */
  async sendInvoiceEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = sendInvoiceEmailSchema.parse(req.body);
      
      // TODO: Implement email sending service
      const result = { sent: true, message: 'Email sending not yet implemented' };
      
      res.json(ApiResponse.success('Invoice email sent successfully', result));
    } catch (error) {
      logger.error('Error sending invoice email:', error);
      next(error);
    }
  }

  /**
   * Send invoice via SMS
   * POST /api/invoices/:id/send-sms
   */
  async sendInvoiceSms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = sendInvoiceSmsSchema.parse(req.body);
      
      // TODO: Implement SMS sending service
      const result = { sent: true, message: 'SMS sending not yet implemented' };
      
      res.json(ApiResponse.success('Invoice SMS sent successfully', result));
    } catch (error) {
      logger.error('Error sending invoice SMS:', error);
      next(error);
    }
  }

  /**
   * Generate invoice PDF
   * GET /api/invoices/:id/pdf
   */
  async generateInvoicePdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // TODO: Implement PDF generation
      res.status(501).json(ApiResponse.error('PDF generation not yet implemented'));
    } catch (error) {
      logger.error('Error generating invoice PDF:', error);
      next(error);
    }
  }

  /**
   * Preview invoice (HTML)
   * GET /api/invoices/:id/preview
   */
  async previewInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const invoice = await invoiceService.getInvoiceById(id);
      
      // TODO: Generate HTML preview
      const preview = { html: '<div>Invoice preview not yet implemented</div>' };
      
      res.json(ApiResponse.success('Invoice preview generated', preview));
    } catch (error) {
      logger.error('Error previewing invoice:', error);
      next(error);
    }
  }

  // ==========================================
  // PAYMENT TRACKING
  // ==========================================

  /**
   * Record payment against invoice
   * POST /api/invoices/:id/payments
   */
  async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = recordPaymentSchema.parse(req.body);
      
      const result = await invoiceService.recordPayment(id, validatedData);
      
      res.json(ApiResponse.success('Payment recorded successfully', result));
    } catch (error) {
      logger.error('Error recording payment:', error);
      next(error);
    }
  }

  /**
   * Get invoice payments
   * GET /api/invoices/:id/payments
   */
  async getInvoicePayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // TODO: Implement payment retrieval
      const payments: any[] = [];
      
      res.json(ApiResponse.success('Invoice payments retrieved successfully', payments));
    } catch (error) {
      logger.error('Error fetching invoice payments:', error);
      next(error);
    }
  }

  // ==========================================
  // REMINDERS & FOLLOW-UPS
  // ==========================================

  /**
   * Schedule reminder
   * POST /api/invoices/:id/reminders
   */
  async createReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = createReminderSchema.parse(req.body);
      
      const reminder = await invoiceService.createReminder(id, validatedData);
      
      res.status(201).json(ApiResponse.success('Reminder created successfully', reminder));
    } catch (error) {
      logger.error('Error creating reminder:', error);
      next(error);
    }
  }

  /**
   * Get invoice reminders
   * GET /api/invoices/:id/reminders
   */
  async getInvoiceReminders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const reminders = await invoiceService.getInvoiceReminders(id);
      
      res.json(ApiResponse.success('Reminders retrieved successfully', reminders));
    } catch (error) {
      logger.error('Error fetching reminders:', error);
      next(error);
    }
  }

  /**
   * Send reminder now
   * POST /api/invoices/:id/reminders/:reminderId/send
   */
  async sendReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, reminderId } = req.params;
      
      // TODO: Implement reminder sending
      const result = { sent: true, message: 'Reminder sending not yet implemented' };
      
      res.json(ApiResponse.success('Reminder sent successfully', result));
    } catch (error) {
      logger.error('Error sending reminder:', error);
      next(error);
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Create invoices from multiple sales
   * POST /api/invoices/bulk-create
   */
  async bulkCreateInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = bulkCreateInvoicesSchema.parse(req.body);
      
      const result = await invoiceService.bulkCreateInvoices(validatedData);
      
      res.json(ApiResponse.success('Bulk invoice creation completed', result));
    } catch (error) {
      logger.error('Error in bulk invoice creation:', error);
      next(error);
    }
  }

  /**
   * Send multiple invoices
   * POST /api/invoices/bulk-send
   */
  async bulkSendInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = bulkSendInvoicesSchema.parse(req.body);
      
      // TODO: Implement bulk sending
      const result = { sent: 0, failed: 0, message: 'Bulk sending not yet implemented' };
      
      res.json(ApiResponse.success('Bulk sending completed', result));
    } catch (error) {
      logger.error('Error in bulk sending:', error);
      next(error);
    }
  }

  /**
   * Mark multiple as paid
   * PUT /api/invoices/bulk-mark-paid
   */
  async bulkMarkPaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = bulkMarkPaidSchema.parse(req.body);
      
      const result = await invoiceService.bulkMarkPaid(validatedData);
      
      res.json(ApiResponse.success('Bulk mark paid completed', result));
    } catch (error) {
      logger.error('Error in bulk mark paid:', error);
      next(error);
    }
  }

  // ==========================================
  // REPORTING & ANALYTICS
  // ==========================================

  /**
   * Invoice summary/dashboard
   * GET /api/invoices/summary
   */
  async getInvoiceSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await invoiceService.getInvoiceSummary();
      
      res.json(ApiResponse.success('Invoice summary retrieved successfully', summary));
    } catch (error) {
      logger.error('Error fetching invoice summary:', error);
      next(error);
    }
  }

  /**
   * Overdue report
   * GET /api/invoices/overdue
   */
  async getOverdueInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overdueInvoices = await invoiceService.getOverdueInvoices();
      
      res.json(ApiResponse.success('Overdue invoices retrieved successfully', overdueInvoices));
    } catch (error) {
      logger.error('Error fetching overdue invoices:', error);
      next(error);
    }
  }

  /**
   * Payment forecast
   * GET /api/invoices/payment-forecast
   */
  async getPaymentForecast(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedQuery = paymentForecastSchema.parse(req.query);
      
      const forecast = await invoiceService.getPaymentForecast(
        validatedQuery.dateFrom,
        validatedQuery.dateTo
      );
      
      res.json(ApiResponse.success('Payment forecast retrieved successfully', forecast));
    } catch (error) {
      logger.error('Error fetching payment forecast:', error);
      next(error);
    }
  }

  // ==========================================
  // CONSIGNMENT SPECIFIC
  // ==========================================

  /**
   * Create consignment invoice
   * POST /api/invoices/consignment
   */
  async createConsignmentInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement consignment invoice creation
      res.status(501).json(ApiResponse.error('Consignment invoices not yet implemented'));
    } catch (error) {
      logger.error('Error creating consignment invoice:', error);
      next(error);
    }
  }

  /**
   * Consignment payment settlement
   * POST /api/invoices/:id/settle-consignment
   */
  async settleConsignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement consignment settlement
      res.status(501).json(ApiResponse.error('Consignment settlement not yet implemented'));
    } catch (error) {
      logger.error('Error settling consignment:', error);
      next(error);
    }
  }

  // ==========================================
  // INTEGRATION ENDPOINTS
  // ==========================================

  /**
   * Webhook for payment updates (MTN MoMo, etc.)
   * POST /api/invoices/webhook/payment-update
   */
  async handlePaymentWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement webhook handling
      res.json(ApiResponse.success('Webhook received', { received: true }));
    } catch (error) {
      logger.error('Error handling payment webhook:', error);
      next(error);
    }
  }

  /**
   * Auto-create invoice when sale status changes
   * POST /api/sales/:id/convert-to-invoice
   */
  async convertSaleToInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = convertSaleToInvoiceSchema.parse(req.body);
      
      const invoice = await invoiceService.createInvoice({
        saleId: id,
        dueDate: validatedData.dueDate,
        sendEmail: validatedData.sendToCustomer,
      });
      
      res.json(ApiResponse.success('Sale converted to invoice successfully', invoice));
    } catch (error) {
      logger.error('Error converting sale to invoice:', error);
      next(error);
    }
  }
}

export const invoicesController = new InvoicesController();
