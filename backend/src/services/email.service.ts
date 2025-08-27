import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!env.SMTP_HOST) {
        throw new Error('Email service not configured. Please set SMTP environment variables.');
      }

      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_SECURE || false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
    return this.transporter!;
  }

  static async sendInvoiceEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceData: any,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: env.SMTP_FROM || 'noreply@vevurn.com',
        to: recipientEmail,
        subject: `Invoice ${invoiceData.invoiceNumber} from Vevurn Accessories`,
        html: this.generateInvoiceEmailHTML(recipientName, invoiceData),
        attachments: [
          {
            filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await transporter.sendMail(mailOptions);
      
      logger.info('Invoice email sent successfully', { 
        messageId: result.messageId,
        invoice: invoiceData.invoiceNumber,
        recipient: recipientEmail 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send invoice email:', error);
      return false;
    }
  }

  private static generateInvoiceEmailHTML(recipientName: string, invoice: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        .btn { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VEVURN ACCESSORIES</h1>
            <p>Your Invoice is Ready</p>
        </div>
        
        <div class="content">
            <h2>Hello ${recipientName},</h2>
            
            <p>Thank you for your purchase! Please find your invoice attached to this email.</p>
            
            <div class="invoice-details">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> RWF ${Number(invoice.totalAmount).toLocaleString()}</p>
                <p><strong>Amount Due:</strong> RWF ${Number(invoice.amountDue).toLocaleString()}</p>
                <p><strong>Status:</strong> ${invoice.status}</p>
            </div>

            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <p>Payment can be made via:</p>
            <ul>
                <li>Mobile Money (MTN MoMo, Airtel Money)</li>
                <li>Bank Transfer</li>
                <li>Cash at our store</li>
            </ul>
        </div>
        
        <div class="footer">
            <p><strong>Vevurn Accessories</strong><br>
            Phone Accessories & Electronics<br>
            Kigali, Rwanda<br>
            +250 XXX XXX XXX | support@vevurn.com</p>
        </div>
    </div>
</body>
</html>`;
  }

  static async sendPaymentReminderEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceData: any
  ): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const daysOverdue = Math.floor((Date.now() - new Date(invoiceData.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const mailOptions = {
        from: env.SMTP_FROM || 'noreply@vevurn.com',
        to: recipientEmail,
        subject: `Payment Reminder - Invoice ${invoiceData.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Reminder</h2>
            <p>Hello ${recipientName},</p>
            <p>This is a friendly reminder that invoice ${invoiceData.invoiceNumber} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'due today'}.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Amount Due:</strong> RWF ${Number(invoiceData.amountDue).toLocaleString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
            </div>
            <p>Please arrange payment at your earliest convenience.</p>
            <p>Thank you,<br>Vevurn Accessories</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      logger.error('Failed to send reminder email:', error);
      return false;
    }
  }
}