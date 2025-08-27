import { Router } from 'express';
import { invoicesController } from '../controllers/invoices.controller';
import { requireAuth } from '../middleware/better-auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
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

const router: Router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// ==========================================
// BASIC CRUD OPERATIONS
// ==========================================

// List all invoices
router.get('/', 
  validateRequest({ query: invoiceFilterSchema }),
  (req, res, next) => invoicesController.getAllInvoices(req, res, next)
);

// Create invoice from sale
router.post('/', 
  validateRequest({ body: createInvoiceSchema }),
  invoicesController.createInvoice
);

// Get specific invoice
router.get('/:id', invoicesController.getInvoiceById);

// Update invoice
router.put('/:id', 
  validateRequest({ body: updateInvoiceSchema }),
  invoicesController.updateInvoice
);

// Delete/Cancel invoice
router.delete('/:id', invoicesController.deleteInvoice);

// ==========================================
// COMMUNICATION
// ==========================================

// Send invoice via email
router.post('/:id/send-email', 
  validateRequest({ body: sendInvoiceEmailSchema }),
  invoicesController.sendInvoiceEmail
);

// Send invoice via SMS
router.post('/:id/send-sms', 
  validateRequest({ body: sendInvoiceSmsSchema }),
  invoicesController.sendInvoiceSms
);

// Generate invoice PDF
router.get('/:id/pdf', invoicesController.generateInvoicePdf);

// Preview invoice (HTML)
router.get('/:id/preview', invoicesController.previewInvoice);

// ==========================================
// PAYMENT TRACKING
// ==========================================

// Record payment against invoice
router.post('/:id/payments', 
  validateRequest({ body: recordPaymentSchema }),
  invoicesController.recordPayment
);

// Get invoice payments
router.get('/:id/payments', invoicesController.getInvoicePayments);

// ==========================================
// REMINDERS & FOLLOW-UPS
// ==========================================

// Schedule reminder
router.post('/:id/reminders', 
  validateRequest({ body: createReminderSchema }),
  invoicesController.createReminder
);

// Get invoice reminders
router.get('/:id/reminders', invoicesController.getInvoiceReminders);

// Send reminder now
router.post('/:id/reminders/:reminderId/send', invoicesController.sendReminder);

// ==========================================
// BULK OPERATIONS
// ==========================================

// Create invoices from multiple sales
router.post('/bulk-create', 
  validateRequest({ body: bulkCreateInvoicesSchema }),
  invoicesController.bulkCreateInvoices
);

// Send multiple invoices
router.post('/bulk-send', 
  validateRequest({ body: bulkSendInvoicesSchema }),
  invoicesController.bulkSendInvoices
);

// Mark multiple as paid
router.put('/bulk-mark-paid', 
  validateRequest({ body: bulkMarkPaidSchema }),
  invoicesController.bulkMarkPaid
);

// ==========================================
// REPORTING & ANALYTICS
// ==========================================

// Invoice summary/dashboard
router.get('/summary', invoicesController.getInvoiceSummary);

// Overdue report
router.get('/overdue', invoicesController.getOverdueInvoices);

// Payment forecast
router.get('/payment-forecast', 
  validateRequest({ query: paymentForecastSchema }),
  invoicesController.getPaymentForecast
);

// ==========================================
// CONSIGNMENT SPECIFIC
// ==========================================

// Create consignment invoice
router.post('/consignment', invoicesController.createConsignmentInvoice);

// Consignment payment settlement
router.post('/:id/settle-consignment', invoicesController.settleConsignment);

// ==========================================
// INTEGRATION ENDPOINTS
// ==========================================

// Webhook for payment updates (MTN MoMo, etc.)
// Note: This endpoint might not need authentication for external webhooks
router.post('/webhook/payment-update', invoicesController.handlePaymentWebhook);

export default router;
