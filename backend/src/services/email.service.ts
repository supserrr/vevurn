import * as nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendInvoiceEmail(to: string, invoiceData: any, options: { includePdf?: boolean; pdfPath?: string } = {}) {
    try {
      const mailOptions: EmailOptions = {
        to,
        subject: `Invoice ${invoiceData.invoiceNumber} - Vevurn POS`,
        html: this.generateInvoiceEmailTemplate(invoiceData),
        attachments: []
      };

      if (options.includePdf && options.pdfPath) {
        mailOptions.attachments!.push({
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          path: options.pdfPath,
          contentType: 'application/pdf'
        });
      }

      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        ...mailOptions
      });

      logger.info('Invoice email sent successfully', { 
        messageId: result.messageId, 
        to,
        invoiceNumber: invoiceData.invoiceNumber
      });
      
      return { sent: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send invoice email:', error);
      throw error;
    }
  }

  private generateInvoiceEmailTemplate(invoiceData: any): string {
    const customer = invoiceData.customer || {};
    const dueDate = new Date(invoiceData.dueDate).toLocaleDateString();
    const issueDate = new Date(invoiceData.createdAt).toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
            .company-name { color: #2563eb; font-size: 28px; font-weight: bold; margin: 0; }
            .amount { font-size: 20px; font-weight: bold; color: #059669; }
            .payment-info { background: #ecfdf5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="company-name">Vevurn POS</h1>
              <p>Phone Accessories & Technology Solutions</p>
              <p>Kigali, Rwanda</p>
            </div>
            
            <h2>Invoice #${invoiceData.invoiceNumber}</h2>
            
            <p><strong>Issue Date:</strong> ${issueDate}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Bill To:</strong> ${customer.firstName} ${customer.lastName || ''}</p>
            <p><strong>Amount:</strong> <span class="amount">${invoiceData.totalAmount.toLocaleString()} RWF</span></p>
            
            <p>Dear ${customer.firstName},</p>
            <p>Please find your invoice attached. Payment is due by <strong>${dueDate}</strong>.</p>
            
            <div class="payment-info">
              <h3>Payment Methods:</h3>
              <p><strong>MTN Mobile Money:</strong> *182*8*1*${invoiceData.totalAmount}#${process.env.MOMO_MERCHANT_NUMBER || 'XXXXXXX'}#</p>
              <p><strong>Cash:</strong> Visit our store in Kigali</p>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p><strong>Vevurn POS</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();