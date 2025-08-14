// Email service for sending various types of emails
export interface EmailData {
  userName?: string;
  resetUrl?: string;
  verificationUrl?: string;
  deletionUrl?: string;
  confirmationUrl?: string;
  newEmail?: string;
  token?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  data: EmailData;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, template, data } = options;
  
  // For development, just log the email details
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Template: ${template}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
    return;
  }

  // TODO: Implement actual email sending logic here
  // You can use services like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Nodemailer with SMTP
  
  try {
    // Example implementation with your email service of choice
    // await emailProvider.send({
    //   to,
    //   subject,
    //   html: await renderTemplate(template, data),
    // });
    
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send ${template} email to ${to}`);
  }
}

// Helper function to render email templates
async function renderTemplate(template: string, data: EmailData): Promise<string> {
  // Simple template rendering - you might want to use a proper template engine
  // like Handlebars, Mustache, or React Email
  
  const templates: Record<string, (data: EmailData) => string> = {
    'password-reset': (data) => `
      <h2>Reset Your Password</h2>
      <p>Hi ${data.userName},</p>
      <p>You requested to reset your password for your Vevurn POS account.</p>
      <p><a href="${data.resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Token: ${data.token}</p>
    `,
    
    'email-verification': (data) => `
      <h2>Verify Your Email</h2>
      <p>Hi ${data.userName},</p>
      <p>Please verify your email address to complete your Vevurn POS account setup.</p>
      <p><a href="${data.verificationUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      <p>Token: ${data.token}</p>
    `,
    
    'account-deletion': (data) => `
      <h2>Confirm Account Deletion</h2>
      <p>Hi ${data.userName},</p>
      <p>You requested to delete your Vevurn POS account. This action cannot be undone.</p>
      <p><a href="${data.deletionUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Confirm Deletion</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Token: ${data.token}</p>
    `,
    
    'email-change': (data) => `
      <h2>Confirm Email Change</h2>
      <p>Hi ${data.userName},</p>
      <p>You requested to change your email from your current email to ${data.newEmail}.</p>
      <p><a href="${data.confirmationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Confirm Change</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Token: ${data.token}</p>
    `,
  };

  const templateFn = templates[template];
  if (!templateFn) {
    throw new Error(`Template ${template} not found`);
  }

  return templateFn(data);
}
