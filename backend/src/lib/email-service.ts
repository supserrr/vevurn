import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter

const createTransporter = async () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig)
    
    // Verify connection configuration
    try {
      await transporter.verify()
      console.log('Email server is ready to take our messages')
    } catch (error) {
      console.error('Email server connection failed:', error)
    }
  }
  return transporter
}

export interface EmailData {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
}

export const sendEmail = async (data: EmailData): Promise<void> => {
  try {
    const emailTransporter = await createTransporter()
    
    const mailOptions: SendMailOptions = {
      from: data.from || process.env.SMTP_FROM || `"Vevurn POS" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    }

    const info = await emailTransporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new Error('Failed to send email')
  }
}

// Email templates
export const createVerificationEmailTemplate = (userName: string, verificationUrl: string) => ({
  subject: 'Verify Your Email - Vevurn POS',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9fafb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vevurn POS</h1>
        </div>
        <div class="content">
          <h2>Welcome ${userName}!</h2>
          <p>Thank you for joining Vevurn POS. Please verify your email address to complete your account setup.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Vevurn POS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Welcome to Vevurn POS, ${userName}!
    
    Thank you for joining Vevurn POS. Please verify your email address to complete your account setup.
    
    Click this link to verify your email: ${verificationUrl}
    
    This verification link will expire in 24 hours.
    
    If you didn't create an account with us, please ignore this email.
    
    © 2025 Vevurn POS. All rights reserved.
  `
})

export const createPasswordResetEmailTemplate = (userName: string, resetUrl: string) => ({
  subject: 'Reset Your Password - Vevurn POS',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9fafb; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 15px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password for your Vevurn POS account.</p>
          <div class="warning">
            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. 
            Your password will remain unchanged.
          </div>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This password reset link will expire in 1 hour for security reasons.</p>
          <p>If you need assistance, please contact your system administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Vevurn POS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Password Reset Request - Vevurn POS
    
    Hello ${userName},
    
    We received a request to reset your password for your Vevurn POS account.
    
    SECURITY NOTICE: If you didn't request this password reset, please ignore this email. 
    Your password will remain unchanged.
    
    Click this link to reset your password: ${resetUrl}
    
    This password reset link will expire in 1 hour for security reasons.
    
    If you need assistance, please contact your system administrator.
    
    © 2025 Vevurn POS. All rights reserved.
  `
})

export const createWelcomeEmailTemplate = (userName: string, employeeId: string, role: string) => ({
  subject: 'Welcome to Vevurn POS - Your Account is Ready!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9fafb; }
        .info-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Vevurn POS!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Congratulations! Your email has been verified and your Vevurn POS account is now active.</p>
          
          <div class="info-box">
            <h3>Your Account Details:</h3>
            <ul>
              <li><strong>Employee ID:</strong> ${employeeId}</li>
              <li><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</li>
              <li><strong>Status:</strong> Active</li>
            </ul>
          </div>
          
          <h3>Getting Started:</h3>
          <ol>
            <li>Log in to the Vevurn POS system with your credentials</li>
            <li>Familiarize yourself with the dashboard and navigation</li>
            <li>Contact your system administrator for training materials</li>
            <li>Keep your employee ID handy for system access</li>
          </ol>
          
          <h3>Important Security Reminders:</h3>
          <ul>
            <li>Never share your login credentials with anyone</li>
            <li>Log out when you finish your shift</li>
            <li>Report any suspicious activity to your manager</li>
            <li>Use strong passwords and change them regularly</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact your system administrator or manager.</p>
          <p>Welcome aboard!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Vevurn POS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    🎉 Welcome to Vevurn POS!
    
    Hello ${userName},
    
    Congratulations! Your email has been verified and your Vevurn POS account is now active.
    
    Your Account Details:
    • Employee ID: ${employeeId}
    • Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
    • Status: Active
    
    Getting Started:
    1. Log in to the Vevurn POS system with your credentials
    2. Familiarize yourself with the dashboard and navigation  
    3. Contact your system administrator for training materials
    4. Keep your employee ID handy for system access
    
    Important Security Reminders:
    • Never share your login credentials with anyone
    • Log out when you finish your shift
    • Report any suspicious activity to your manager
    • Use strong passwords and change them regularly
    
    If you have any questions or need assistance, please contact your system administrator or manager.
    
    Welcome aboard!
    
    © 2025 Vevurn POS. All rights reserved.
  `
})

/**
 * Email Change Verification Template
 * Sent to the current email address to verify the email change request
 */
export const createEmailChangeVerificationTemplate = (
  userName: string,
  currentEmail: string,
  newEmail: string,
  verificationUrl: string
) => ({
  subject: '🔐 Verify Email Change Request - Vevurn POS',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Email Change - Vevurn POS</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .button-container { text-align: center; margin: 30px 0; }
        .info-box { background: #e9ecef; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Email Change Verification</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          
          <p>We received a request to change your email address for your Vevurn POS account.</p>
          
          <div class="info-box">
            <p><strong>Current Email:</strong> ${currentEmail}</p>
            <p><strong>New Email:</strong> ${newEmail}</p>
          </div>
          
          <p><strong>Important:</strong> If you did not request this email change, please ignore this email and contact your system administrator immediately.</p>
          
          <p>To approve this email change, click the button below:</p>
          
          <div class="button-container">
            <a href="${verificationUrl}" class="button">Verify Email Change</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          
          <p><strong>This verification link will expire in 1 hour for security reasons.</strong></p>
          
          <p>After verification, you'll receive a confirmation at your new email address.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Vevurn POS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    🔐 Email Change Verification - Vevurn POS
    
    Hello ${userName},
    
    We received a request to change your email address for your Vevurn POS account.
    
    Current Email: ${currentEmail}
    New Email: ${newEmail}
    
    Important: If you did not request this email change, please ignore this email and contact your system administrator immediately.
    
    To approve this email change, click this link:
    ${verificationUrl}
    
    This verification link will expire in 1 hour for security reasons.
    
    After verification, you'll receive a confirmation at your new email address.
    
    © 2025 Vevurn POS. All rights reserved.
  `
})

/**
 * Account Deletion Verification Template
 * Sent to confirm account deletion request
 */
export const createAccountDeletionTemplate = (
  userName: string,
  deletionUrl: string
) => ({
  subject: '⚠️ Account Deletion Request - Vevurn POS',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Deletion Request - Vevurn POS</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .button-container { text-align: center; margin: 30px 0; }
        .info-box { background: #e9ecef; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .danger { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Account Deletion Request</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          
          <p>We received a request to permanently delete your Vevurn POS account.</p>
          
          <div class="warning danger">
            <h3>⚠️ This action cannot be undone!</h3>
            <p><strong>Deleting your account will permanently remove:</strong></p>
            <ul>
              <li>All your account information</li>
              <li>Your transaction history access</li>
              <li>Any saved preferences or settings</li>
              <li>All associated data from our system</li>
            </ul>
          </div>
          
          <p><strong>Before proceeding, please consider:</strong></p>
          <ul>
            <li>Contact your manager if you're changing roles instead of leaving</li>
            <li>Ensure you've completed any pending transactions</li>
            <li>Download any personal data you want to keep</li>
          </ul>
          
          <p><strong>If you did not request this deletion, please ignore this email and contact your system administrator immediately.</strong></p>
          
          <p>If you're certain you want to delete your account, click the button below:</p>
          
          <div class="button-container">
            <a href="${deletionUrl}" class="button" style="background-color: #dc3545;">Delete My Account</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${deletionUrl}</p>
          
          <p><strong>This deletion link will expire in 24 hours for security reasons.</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Vevurn POS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    ⚠️ Account Deletion Request - Vevurn POS
    
    Hello ${userName},
    
    We received a request to permanently delete your Vevurn POS account.
    
    ⚠️ THIS ACTION CANNOT BE UNDONE!
    
    Deleting your account will permanently remove:
    • All your account information
    • Your transaction history access
    • Any saved preferences or settings
    • All associated data from our system
    
    Before proceeding, please consider:
    • Contact your manager if you're changing roles instead of leaving
    • Ensure you've completed any pending transactions
    • Download any personal data you want to keep
    
    If you did not request this deletion, please ignore this email and contact your system administrator immediately.
    
    If you're certain you want to delete your account, click this link:
    ${deletionUrl}
    
    This deletion link will expire in 24 hours for security reasons.
    
    © 2025 Vevurn POS. All rights reserved.
  `
})
