import { logger } from '../utils/logger';

export class EmailService {
  static async sendInvoiceEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceData: any,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    try {
      // Dynamic import to avoid JSX compilation issues in main service
      const sendMail = (await import('../../emails')).default;
      const { default: InvoiceEmail } = await import('../../emails/InvoiceEmail');
      const React = await import('react');

      await sendMail({
        to: recipientEmail,
        subject: `Invoice ${invoiceData.invoiceNumber} from Vevurn Accessories`,
        component: React.createElement(InvoiceEmail, {
          recipientName: recipientName,
          invoice: {
            invoiceNumber: invoiceData.invoiceNumber,
            issueDate: invoiceData.issueDate,
            dueDate: invoiceData.dueDate,
            totalAmount: invoiceData.totalAmount,
            amountDue: invoiceData.amountDue,
            status: invoiceData.status,
          }
        }),
        attachments: [
          {
            filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      
      logger.info('Invoice email sent successfully', { 
        invoice: invoiceData.invoiceNumber,
        recipient: recipientEmail 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send invoice email:', error);
      return false;
    }
  }

  static async sendPaymentReminderEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceData: any
  ): Promise<boolean> {
    try {
      const sendMail = (await import('../../emails')).default;
      const { default: PaymentReminderEmail } = await import('../../emails/PaymentReminderEmail');
      const React = await import('react');

      const daysOverdue = Math.floor((Date.now() - new Date(invoiceData.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      await sendMail({
        to: recipientEmail,
        subject: `Payment Reminder - Invoice ${invoiceData.invoiceNumber}`,
        component: React.createElement(PaymentReminderEmail, {
          recipientName: recipientName,
          invoice: {
            invoiceNumber: invoiceData.invoiceNumber,
            dueDate: invoiceData.dueDate,
            amountDue: invoiceData.amountDue,
          },
          daysOverdue: Math.max(0, daysOverdue)
        }),
      });

      logger.info('Payment reminder email sent successfully', { 
        invoice: invoiceData.invoiceNumber,
        recipient: recipientEmail,
        daysOverdue 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send reminder email:', error);
      return false;
    }
  }

  static async sendCashierCredentials(email: string, data: {
    name: string;
    email: string;
    tempPassword: string;
    loginUrl: string;
  }): Promise<boolean> {
    try {
      const sendMail = (await import('../../emails')).default;
      const { default: CashierCredentialsEmail } = await import('../../emails/CashierCredentialsEmail');
      const React = await import('react');

      await sendMail({
        to: email,
        subject: 'Welcome to Vevurn POS - Your Cashier Account',
        component: React.createElement(CashierCredentialsEmail, {
          name: data.name,
          email: data.email,
          tempPassword: data.tempPassword,
          loginUrl: data.loginUrl
        }),
      });
      
      logger.info('Cashier credentials sent successfully', { 
        recipient: email 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send cashier credentials:', error);
      return false;
    }
  }

  static async sendPasswordResetEmail(
    recipientEmail: string,
    userName: string,
    resetUrl: string
  ): Promise<boolean> {
    try {
      const sendMail = (await import('../../emails')).default;
      const { default: PasswordResetEmail } = await import('../../emails/PasswordResetEmail');
      const React = await import('react');

      await sendMail({
        to: recipientEmail,
        subject: 'Reset Your Vevurn POS Password',
        component: React.createElement(PasswordResetEmail, {
          userName: userName,
          resetUrl: resetUrl
        }),
      });
      
      logger.info('Password reset email sent successfully', { 
        recipient: recipientEmail 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  static async sendEmailVerification(
    recipientEmail: string,
    userName: string,
    verificationUrl: string
  ): Promise<boolean> {
    try {
      const sendMail = (await import('../../emails')).default;
      const { default: EmailVerificationEmail } = await import('../../emails/EmailVerificationEmail');
      const React = await import('react');

      await sendMail({
        to: recipientEmail,
        subject: 'Verify Your Vevurn POS Account',
        component: React.createElement(EmailVerificationEmail, {
          userName: userName,
          verificationUrl: verificationUrl
        }),
      });
      
      logger.info('Email verification sent successfully', { 
        recipient: recipientEmail 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email verification:', error);
      return false;
    }
  }
}

// Utility function to generate temporary password
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}