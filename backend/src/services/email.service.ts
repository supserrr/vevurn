import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class EmailService {
  private static transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  static async sendCashierCredentials(
    email: string, 
    data: {
      name: string;
      email: string;
      tempPassword: string;
      loginUrl: string;
    }
  ) {
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Vevurn POS</h1>
          <p style="color: white; margin-top: 10px; font-size: 16px;">You've been added as a cashier</p>
        </div>
        
        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #333;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; color: #333;">You have been added as a cashier to the Vevurn POS system. Here are your login credentials:</p>
          
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.tempPassword}</code></p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #856404; font-weight: bold; margin: 0; font-size: 14px;">⚠️ Important Security Notice:</p>
            <ul style="color: #856404; margin: 10px 0 0 0; padding-left: 20px;">
              <li>You must change this password on your first login</li>
              <li>Do not share these credentials with anyone</li>
              <li>This temporary password will expire in 7 days</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Login to Vevurn POS
            </a>
          </div>
          
          <p style="font-size: 16px; color: #333;">If you have any questions, please contact your manager or system administrator.</p>
          
          <p style="font-size: 16px; color: #333;">Best regards,<br><strong>The Vevurn POS Team</strong></p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
          <p style="margin: 5px 0 0 0;">© 2025 Vevurn POS. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: env.SMTP_FROM || 'noreply@vevurnpos.com',
      to: email,
      subject: 'Welcome to Vevurn POS - Your Cashier Account',
      html: emailTemplate
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Cashier credentials sent successfully', { 
        recipient: email,
        name: data.name
      });
    } catch (error) {
      logger.error('Failed to send cashier credentials:', error);
      throw new Error('Failed to send email');
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string) {
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc3545; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          <p style="color: white; margin-top: 10px; font-size: 16px;">Vevurn POS System</p>
        </div>
        
        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #333;">You requested a password reset for your Vevurn POS account.</p>
          
          <p style="font-size: 16px; color: #333;">Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: env.SMTP_FROM || 'noreply@vevurnpos.com',
      to: email,
      subject: 'Reset Your Vevurn POS Password',
      html: emailTemplate
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent', { recipient: email });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send reset email');
    }
  }

  static async sendLowStockAlert(
    managerEmail: string, 
    products: Array<{
      name: string;
      currentStock: number;
      minStock: number;
    }>
  ) {
    const productList = products.map(p => 
      `<li><strong>${p.name}</strong>: ${p.currentStock} remaining (minimum: ${p.minStock})</li>`
    ).join('');

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ffc107; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #212529; margin: 0; font-size: 28px;">⚠️ Low Stock Alert</h1>
          <p style="color: #212529; margin-top: 10px; font-size: 16px;">Immediate Attention Required</p>
        </div>
        
        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #333;">The following products are running low on stock:</p>
          
          <ul style="font-size: 16px; color: #333; padding-left: 20px;">
            ${productList}
          </ul>
          
          <p style="font-size: 16px; color: #333;">Please consider restocking these items to avoid running out of inventory.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: env.SMTP_FROM || 'noreply@vevurnpos.com',
      to: managerEmail,
      subject: `Low Stock Alert - ${products.length} Products Need Attention`,
      html: emailTemplate
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Low stock alert sent', { 
        recipient: managerEmail,
        productCount: products.length
      });
    } catch (error) {
      logger.error('Failed to send low stock alert:', error);
      throw new Error('Failed to send alert email');
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