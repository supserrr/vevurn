import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { invoiceService } from '../services/invoices.service';
import { PDFService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';
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
      
      const invoice = await invoiceService.getInvoiceById(id);
      
      if (!invoice.customer?.email) {
        return res.status(400).json(ApiResponse.error('Customer email not found'));
      }
      
      // Generate PDF
      const pdfBuffer = await PDFService.generateInvoicePDF(invoice);
      
      // Send email with PDF attachment
      const emailSent = await EmailService.sendInvoiceEmail(
        invoice.customer.email,
        `${invoice.customer.firstName} ${invoice.customer.lastName || ''}`.trim(),
        invoice,
        pdfBuffer
      );
      
      if (emailSent) {
        // Could add email sent tracking to notes or separate log
        logger.info('Invoice email sent', { invoiceId: id, recipient: invoice.customer.email });
      }
      
      res.json(ApiResponse.success('Invoice email sent successfully', { 
        emailSent,
        recipient: invoice.customer.email 
      }));
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
      
      const invoice = await invoiceService.getInvoiceById(id);
      
      if (!invoice.customer?.phone) {
        return res.status(400).json(ApiResponse.error('Customer phone number not found'));
      }
      
      const smsSent = await SMSService.sendInvoiceSMS(
        invoice.customer.phone,
        `${invoice.customer.firstName} ${invoice.customer.lastName || ''}`.trim(),
        invoice
      );
      
      if (smsSent) {
        // Could add SMS sent tracking to notes or separate log
        logger.info('Invoice SMS sent', { invoiceId: id, recipient: invoice.customer.phone });
      }
      
      res.json(ApiResponse.success('Invoice SMS sent successfully', { 
        smsSent,
        recipient: invoice.customer.phone 
      }));
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
      
      const invoice = await invoiceService.getInvoiceById(id);
      const pdfBuffer = await PDFService.generateInvoicePDF(invoice);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber}.pdf`);
      res.send(pdfBuffer);
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
      
      // Generate HTML preview (same as PDF but without PDF conversion)
      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice.invoiceNumber} Preview</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .invoice-title { font-size: 20px; margin: 20px 0; }
        .invoice-details { display: flex; justify-content: space-between; margin: 20px 0; }
        .customer-info, .invoice-info { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total-section { margin-top: 20px; text-align: right; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">VEVURN ACCESSORIES</div>
        <div>Phone Accessories & Electronics</div>
        <div>Kigali, Rwanda</div>
    </div>

    <div class="invoice-title">INVOICE #${invoice.invoiceNumber}</div>

    <div class="invoice-details">
        <div class="customer-info">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName || ''}`.trim() : 'Walk-in Customer'}</strong></p>
            <p>${invoice.customer?.email || ''}</p>
            <p>${invoice.customer?.phone || ''}</p>
        </div>
        <div class="invoice-info">
            <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.sale?.items?.map((item: any) => `
                <tr>
                    <td>${item.product?.name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>RWF ${Number(item.unitPrice).toLocaleString()}</td>
                    <td>RWF ${Number(item.totalPrice).toLocaleString()}</td>
                </tr>
            `).join('') || ''}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>RWF ${Number(invoice.subtotal).toLocaleString()}</span>
        </div>
        <div class="total-row">
            <span>VAT (18%):</span>
            <span>RWF ${Number(invoice.taxAmount).toLocaleString()}</span>
        </div>
        <div class="total-row total-final">
            <span>Total Amount:</span>
            <span>RWF ${Number(invoice.totalAmount).toLocaleString()}</span>
        </div>
        <div class="total-row">
            <span>Amount Due:</span>
            <span>RWF ${Number(invoice.amountDue).toLocaleString()}</span>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
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
