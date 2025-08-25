import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';
import { authMiddleware, requireRole } from '../middleware/better-auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { body, query, param } from 'express-validator';

const router: Router = Router();
const paymentsController = new PaymentsController();

// Protect all routes
router.use(authMiddleware);

/**
 * @route POST /api/payments/momo/initiate
 * @desc Initiate Mobile Money payment
 * @access Private (All roles)
 */
router.post('/momo/initiate', [
  body('saleId').isString().notEmpty().withMessage('Sale ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('phoneNumber').matches(/^(\+250|250)?[7][0-9]{8}$/).withMessage('Invalid Rwanda phone number format')
], validateRequest, paymentsController.initiateMoMoPayment);

/**
 * @route GET /api/payments/momo/verify/:transactionId
 * @desc Verify Mobile Money payment status
 * @access Private (All roles)
 */
router.get('/momo/verify/:transactionId', [
  param('transactionId').isString().notEmpty().withMessage('Transaction ID is required')
], validateRequest, paymentsController.verifyMoMoPayment);

/**
 * @route POST /api/payments/cash
 * @desc Record cash payment
 * @access Private (All roles)
 */
router.post('/cash', [
  body('saleId').isString().notEmpty().withMessage('Sale ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('changeGiven').optional().isFloat({ min: 0 }).withMessage('Change given must be a positive number')
], validateRequest, paymentsController.recordCashPayment);

/**
 * @route POST /api/payments/bank-transfer
 * @desc Record bank transfer payment
 * @access Private (All roles)
 */
router.post('/bank-transfer', [
  body('saleId').isString().notEmpty().withMessage('Sale ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('referenceNumber').isString().notEmpty().withMessage('Reference number is required'),
  body('bankAccount').optional().isString().withMessage('Bank account must be a string')
], validateRequest, paymentsController.recordBankTransfer);

/**
 * @route GET /api/payments/history
 * @desc Get payment history with filtering
 * @access Private (All roles)
 */
router.get('/history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('method').optional().isIn(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT']).withMessage('Invalid payment method'),
  query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']).withMessage('Invalid payment status'),
  query('saleId').optional().isString().withMessage('Sale ID must be a string'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  query('sortBy').optional().isIn(['createdAt', 'amount', 'method', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], validateRequest, paymentsController.getPaymentHistory);

/**
 * @route GET /api/payments/summary
 * @desc Get payment summary statistics
 * @access Private (All roles)
 */
router.get('/summary', [
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], validateRequest, paymentsController.getPaymentSummary);

/**
 * @route POST /api/payments/refund/:paymentId
 * @desc Process refund for a payment
 * @access Private (MANAGER, ADMIN)
 */
router.post('/refund/:paymentId', [
  requireRole('MANAGER', 'ADMIN'),
  param('paymentId').isString().notEmpty().withMessage('Payment ID is required'),
  body('refundAmount').isFloat({ min: 0 }).withMessage('Refund amount must be a positive number'),
  body('reason').isString().notEmpty().withMessage('Reason is required')
], validateRequest, paymentsController.processRefund);

export { router as paymentsRoutes };
