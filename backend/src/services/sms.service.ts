import twilio from 'twilio';
import { logger } from '../utils/logger';

export interface SMSMessage {
  to: string;
  message: string;
  sender?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  message: string;
  cost?: number;
}

export interface BulkSMSMessage {
  recipient: string;
  message: string;
}

export interface BulkSMSResponse {
  success: boolean;
  totalSent: number;
  failed: number;
  messageIds: string[];
  errors?: string[];
}

export class SMSService {
  private client: twilio.Twilio | null;
  private readonly defaultSender: string;

  constructor() {
    this.defaultSender = process.env.SMS_DEFAULT_SENDER || 'VEVURN-POS';
    
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      this.client = null;
      logger.warn('Twilio credentials not configured - SMS service disabled');
    }

  }

  /**
   * Send a single SMS message
   */
  async sendSMS(smsData: SMSMessage): Promise<SMSResponse> {
    try {
      if (!this.client) {
        return {
          success: false,
          message: 'SMS service not configured'
        };
      }

      // Validate Rwanda phone number format
      if (!this.isValidRwandaPhoneNumber(smsData.to)) {
        return {
          success: false,
          message: 'Invalid Rwanda phone number format'
        };
      }

      // Format phone number to international format
      const formattedPhone = this.formatRwandaPhoneNumber(smsData.to);

      const result = await this.client.messages.create({
        body: smsData.message,
        from: process.env.TWILIO_PHONE_NUMBER || this.defaultSender,
        to: formattedPhone
      });

      logger.info('SMS sent successfully', {
        to: formattedPhone,
        messageLength: smsData.message.length,
        messageId: result.sid
      });

      return {
        success: true,
        messageId: result.sid,
        message: 'SMS sent successfully',
        cost: 0.05 // Approximate cost in USD
      };
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  async sendInvoiceSMS(to: string, invoiceData: any) {
    try {
      const message = this.generateInvoiceSMSMessage(invoiceData);
      
      const result = await this.sendSMS({
        to,
        message,
        sender: this.defaultSender
      });

      logger.info('Invoice SMS sent successfully', { 
        to,
        invoiceNumber: invoiceData.invoiceNumber
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to send invoice SMS:', error);
      throw error;
    }
  }

  async sendReminderSMS(to: string, reminderData: any) {
    try {
      const message = `
REMINDER: Invoice ${reminderData.invoiceNumber} 
Amount: ${reminderData.amountDue.toLocaleString()} RWF
Due: ${new Date(reminderData.dueDate).toLocaleDateString()}

Please pay to avoid late fees.
Vevurn POS
      `.trim();

      const result = await this.sendSMS({
        to,
        message,
        sender: this.defaultSender
      });

      return result;
    } catch (error) {
      logger.error('Failed to send reminder SMS:', error);
      throw error;
    }
  }

  private generateInvoiceSMSMessage(invoiceData: any): string {
    return `
Vevurn POS Invoice ${invoiceData.invoiceNumber}

Amount: ${invoiceData.totalAmount.toLocaleString()} RWF
Due: ${new Date(invoiceData.dueDate).toLocaleDateString()}

Pay via MTN MoMo: *182*8*1*${invoiceData.totalAmount}#${process.env.MOMO_MERCHANT_NUMBER || 'XXXXXXX'}#

Thank you!
    `.trim();
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(messages: BulkSMSMessage[]): Promise<BulkSMSResponse> {
    try {
      const results: SMSResponse[] = [];
      const errors: string[] = [];

      // Process messages in batches to avoid overwhelming the API
      const batchSize = 50;
      const batches = this.chunkArray(messages, batchSize);

      for (const batch of batches) {
        const batchPromises = batch.map(msg => 
          this.sendSMS({ to: msg.recipient, message: msg.message })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push(`Message ${index + 1}: ${result.reason}`);
          }
        });

        // Small delay between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: successful.length > 0,
        totalSent: successful.length,
        failed: failed.length + errors.length,
        messageIds: successful.map(r => r.messageId!).filter(Boolean),
        errors: [...failed.map(r => r.message), ...errors]
      };
    } catch (error) {
      logger.error('Failed to send bulk SMS:', error);
      return {
        success: false,
        totalSent: 0,
        failed: messages.length,
        messageIds: [],
        errors: [error instanceof Error ? error.message : 'Failed to send bulk SMS']
      };
    }
  }

  /**
   * Send sales receipt via SMS
   */
  async sendReceiptSMS(phoneNumber: string, receiptData: {
    saleNumber: string;
    total: number;
    date: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }): Promise<SMSResponse> {
    const message = this.formatReceiptMessage(receiptData);
    return await this.sendSMS({
      to: phoneNumber,
      message,
      sender: this.defaultSender
    });
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminderSMS(phoneNumber: string, reminderData: {
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
  }): Promise<SMSResponse> {
    const message = `Dear ${reminderData.customerName}, your invoice ${reminderData.invoiceNumber} of RWF ${reminderData.amount.toLocaleString()} is due on ${reminderData.dueDate}. Please make payment to avoid late fees. Thank you - VEVURN POS`;

    return await this.sendSMS({
      to: phoneNumber,
      message,
      sender: this.defaultSender
    });
  }

  /**
   * Send promotional SMS
   */
  async sendPromotionalSMS(phoneNumber: string, promoData: {
    customerName?: string;
    offer: string;
    validUntil?: string;
  }): Promise<SMSResponse> {
    const greeting = promoData.customerName ? `Dear ${promoData.customerName}, ` : 'Dear valued customer, ';
    const validity = promoData.validUntil ? ` Valid until ${promoData.validUntil}.` : '';
    const message = `${greeting}${promoData.offer}${validity} Visit us at VEVURN POS. Terms apply.`;

    return await this.sendSMS({
      to: phoneNumber,
      message,
      sender: this.defaultSender
    });
  }

  /**
   * Validate Rwanda phone number format
   */
  private isValidRwandaPhoneNumber(phoneNumber: string): boolean {
    // Rwanda phone number formats:
    // - +250XXXXXXXXX (international)
    // - 250XXXXXXXXX  (country code)
    // - 07XXXXXXXX    (local format for mobile)
    // - 25007XXXXXXXX (full format)
    const rwandaRegex = /^(\+250|250)?[7][0-9]{8}$/;
    return rwandaRegex.test(phoneNumber.replace(/\s+/g, ''));
  }

  /**
   * Format phone number to international Rwanda format
   */
  private formatRwandaPhoneNumber(phoneNumber: string): string {
    // Remove all spaces and special characters
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If starts with +250, return as is
    if (cleaned.startsWith('+250')) {
      return cleaned;
    }
    
    // If starts with 250, add +
    if (cleaned.startsWith('250')) {
      return `+${cleaned}`;
    }
    
    // If starts with 07, replace with +2507
    if (cleaned.startsWith('07')) {
      return `+250${cleaned.substring(1)}`;
    }
    
    // If just the 9-digit mobile number, add +2507
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      return `+250${cleaned}`;
    }
    
    return cleaned; // Return as is if format is unclear
  }

  /**
   * Format receipt message for SMS
   */
  private formatReceiptMessage(receiptData: {
    saleNumber: string;
    total: number;
    date: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }): string {
    const header = `VEVURN POS Receipt\nSale: ${receiptData.saleNumber}\nDate: ${receiptData.date}\n\nItems:\n`;
    
    const itemsText = receiptData.items
      .slice(0, 3) // Limit to first 3 items to keep SMS short
      .map(item => `${item.name} x${item.quantity}: RWF ${item.price.toLocaleString()}`)
      .join('\n');
    
    const moreItems = receiptData.items.length > 3 ? `\n...and ${receiptData.items.length - 3} more items` : '';
    
    const footer = `\n\nTotal: RWF ${receiptData.total.toLocaleString()}\nThank you for shopping with us!`;
    
    return header + itemsText + moreItems + footer;
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }



  /**
   * Get SMS service status and configuration
   */
  getServiceInfo() {
    return {
      provider: 'Rwanda SMS Service',
      defaultSender: this.defaultSender,
      configured: !!(this.apiKey && this.apiKey !== 'demo-key'),
      supportedCountries: ['Rwanda (+250)'],
      features: [
        'Single SMS',
        'Bulk SMS',
        'Receipt notifications',
        'Payment reminders',
        'Promotional messages'
      ]
    };
  }
}

// Export singleton instance
export const smsService = new SMSService();
