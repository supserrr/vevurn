import express, { Request, Response } from 'express';
import { MobileMoneyController } from '../controllers/MobileMoneyController';
import { requireBetterAuth, requireRole } from '../middleware/betterAuth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const momoController = new MobileMoneyController();

// Payment request (staff and above)
router.post(
  '/request-payment',
  rateLimiter,
  requireBetterAuth,
  requireRole(['cashier', 'supervisor', 'manager', 'admin']),
  momoController.requestPayment
);

// Check payment status
router.get(
  '/status/:referenceId',
  requireBetterAuth,
  momoController.checkStatus
);

// Webhook endpoint (no auth required - external service)
router.post('/webhook', momoController.webhook);

export default router;
