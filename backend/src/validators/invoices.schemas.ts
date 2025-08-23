import { z } from 'zod';
import { idSchema, decimalSchema, positiveIntSchema } from './common.schemas';

// ==========================================
// INVOICE VALIDATION SCHEMAS
// ==========================================

export const invoiceStatusEnum = z.enum([
  'DRAFT', 
  'SENT', 
  'OVERDUE', 
  'PARTIALLY_PAID', 
  'PAID', 
  'CANCELLED', 
  'REFUNDED'
]);

export const reminderTypeEnum = z.enum([
  'EMAIL', 
  'SMS', 
  'CALL', 
  'WHATSAPP'
]);

export const paymentMethodEnum = z.enum([
  'CASH', 
  'MOBILE_MONEY', 
  'BANK_TRANSFER', 
  'CREDIT'
]);

// ==========================================
// BASIC INVOICE OPERATIONS
// ==========================================

export const createInvoiceSchema = z.object({
  saleId: idSchema,
  dueDate: z.string().datetime(),
  paymentTerms: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  sendEmail: z.boolean().optional().default(false),
  sendSms: z.boolean().optional().default(false),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  paymentTerms: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  status: invoiceStatusEnum.optional(),
});

export const invoiceFilterSchema = z.object({
  page: z.union([z.string(), z.number()]).optional().default(1),
  limit: z.union([z.string(), z.number()]).optional().default(10),
  status: z.array(invoiceStatusEnum).optional(),
  customerId: idSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'totalAmount', 'invoiceNumber']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform(data => ({
  ...data,
  page: Math.max(1, parseInt(data.page.toString())),
  limit: Math.min(100, Math.max(1, parseInt(data.limit.toString()))),
}));

// ==========================================
// COMMUNICATION SCHEMAS
// ==========================================

export const sendInvoiceEmailSchema = z.object({
  recipientEmail: z.string().email().optional(),
  subject: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  attachPdf: z.boolean().optional().default(true),
});

export const sendInvoiceSmsSchema = z.object({
  phoneNumber: z.string().regex(/^\+?25078\d{7}$|^\+?25079\d{7}$/).optional(),
  message: z.string().max(160).optional(),
});

// ==========================================
// PAYMENT TRACKING SCHEMAS
// ==========================================

export const recordPaymentSchema = z.object({
  amount: z.union([
    z.number().positive(),
    z.string().regex(/^[1-9]\d*(\.\d{1,2})?$/).transform(val => parseFloat(val)),
  ]),
  method: paymentMethodEnum,
  transactionId: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

// ==========================================
// REMINDER SCHEMAS
// ==========================================

export const createReminderSchema = z.object({
  type: reminderTypeEnum,
  scheduledFor: z.string().datetime(),
  message: z.string().max(500),
});

// ==========================================
// BULK OPERATIONS SCHEMAS
// ==========================================

export const bulkCreateInvoicesSchema = z.object({
  saleIds: z.array(idSchema).min(1).max(50),
  dueDate: z.string().datetime(),
  paymentTerms: z.string().max(200).optional(),
  sendEmail: z.boolean().optional().default(false),
});

export const bulkSendInvoicesSchema = z.object({
  invoiceIds: z.array(idSchema).min(1).max(50),
  method: z.enum(['EMAIL', 'SMS']),
  message: z.string().max(500).optional(),
});

export const bulkMarkPaidSchema = z.object({
  invoiceIds: z.array(idSchema).min(1).max(50),
  paidDate: z.string().datetime().optional(),
});

// ==========================================
// CONSIGNMENT SCHEMAS
// ==========================================

export const createConsignmentInvoiceSchema = z.object({
  saleId: idSchema,
  consignerCustomerId: idSchema,
  dueDate: z.string().datetime(),
  commissionRate: z.number().min(0).max(100),
});

export const settleConsignmentSchema = z.object({
  paymentMethod: paymentMethodEnum,
  transactionId: z.string().max(100).optional(),
});

// ==========================================
// WEBHOOK & INTEGRATION SCHEMAS
// ==========================================

export const paymentWebhookSchema = z.object({
  invoiceId: idSchema,
  transactionId: z.string().max(100),
  status: z.string().max(50),
  amount: z.union([
    z.number().positive(),
    z.string().regex(/^[1-9]\d*(\.\d{1,2})?$/).transform(val => parseFloat(val)),
  ]),
});

export const convertSaleToInvoiceSchema = z.object({
  dueDate: z.string().datetime(),
  sendToCustomer: z.boolean().optional().default(false),
});

// ==========================================
// REPORTING SCHEMAS
// ==========================================

export const paymentForecastSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});

// ==========================================
// EXPORT ALL SCHEMAS
// ==========================================

export const invoiceSchemas = {
  // Basic operations
  createInvoice: createInvoiceSchema,
  updateInvoice: updateInvoiceSchema,
  invoiceFilter: invoiceFilterSchema,
  
  // Communication
  sendInvoiceEmail: sendInvoiceEmailSchema,
  sendInvoiceSms: sendInvoiceSmsSchema,
  
  // Payments
  recordPayment: recordPaymentSchema,
  
  // Reminders
  createReminder: createReminderSchema,
  
  // Bulk operations
  bulkCreateInvoices: bulkCreateInvoicesSchema,
  bulkSendInvoices: bulkSendInvoicesSchema,
  bulkMarkPaid: bulkMarkPaidSchema,
  
  // Consignment
  createConsignmentInvoice: createConsignmentInvoiceSchema,
  settleConsignment: settleConsignmentSchema,
  
  // Webhooks
  paymentWebhook: paymentWebhookSchema,
  convertSaleToInvoice: convertSaleToInvoiceSchema,
  
  // Reporting
  paymentForecast: paymentForecastSchema,
};
