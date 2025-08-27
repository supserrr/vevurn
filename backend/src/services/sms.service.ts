// Note: Twilio types might not be available yet, this implementation assumes they are
// @ts-ignore
import twilio from 'twilio';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class SMSService {
  private static client: any | null = null;

  private static getClient(): any {
    if (!this.client) {
      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
        throw new Error('SMS service not configured. Please set Twilio environment variables.');
      }
      
      this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
    return this.client;
  }

  static async sendInvoiceSMS(
    phoneNumber: string,
    customerName: string,
    invoiceData: any
  ): Promise<boolean> {
    try {
      const client = this.getClient();
      
      const message = `Hello ${customerName}, your invoice ${invoiceData.invoiceNumber} for RWF ${Number(invoiceData.totalAmount).toLocaleString()} is ready. Amount due: RWF ${Number(invoiceData.amountDue).toLocaleString()}. Due: ${new Date(invoiceData.dueDate).toLocaleDateString()}. Thank you! - Vevurn Accessories`;
      
      const result = await client.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to: this.formatPhoneNumber(phoneNumber)
      });
      
      logger.info('Invoice SMS sent successfully', { 
        messageSid: result.sid,
        invoice: invoiceData.invoiceNumber,
        recipient: phoneNumber 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send invoice SMS:', error);
      return false;
    }
  }

  static async sendPaymentReminderSMS(
    phoneNumber: string,
    customerName: string,
    invoiceData: any
  ): Promise<boolean> {
    try {
      const client = this.getClient();
      const daysOverdue = Math.floor((Date.now() - new Date(invoiceData.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const message = `Hi ${customerName}, friendly reminder: Invoice ${invoiceData.invoiceNumber} (RWF ${Number(invoiceData.amountDue).toLocaleString()}) is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'due today'}. Please arrange payment. Thanks! - Vevurn`;
      
      await client.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to: this.formatPhoneNumber(phoneNumber)
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send reminder SMS:', error);
      return false;
    }
  }

  private static formatPhoneNumber(phone: string): string {
    // Convert Rwanda phone numbers to international format
    if (phone.startsWith('07') || phone.startsWith('78') || phone.startsWith('79')) {
      return '+25' + phone;
    }
    if (phone.startsWith('250')) {
      return '+' + phone;
    }
    if (phone.startsWith('+250')) {
      return phone;
    }
    return phone;
  }
}