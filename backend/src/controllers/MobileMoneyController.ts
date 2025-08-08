import { Request, Response, NextFunction } from 'express';
import { MobileMoneyService } from '../services/MobileMoneyService';
import { z } from 'zod';
import { logger } from '../utils/logger';

const requestPaymentSchema = z.object({
  phoneNumber: z.string().regex(/^\+?250[0-9]{9}$/, 'Invalid Rwanda phone number'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('RWF'),
  externalId: z.string().min(1, 'External ID is required'),
  payerMessage: z.string().optional(),
  payeeNote: z.string().optional(),
});

const checkStatusSchema = z.object({
  referenceId: z.string().min(1, 'Reference ID is required'),
});

export class MobileMoneyController {
  private momoService: MobileMoneyService;

  constructor() {
    this.momoService = new MobileMoneyService();
  }

  /**
   * Request payment from customer
   */
  requestPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = requestPaymentSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validation.error.issues,
        });
        return;
      }

      const referenceId = await this.momoService.requestPayment(validation.data);

      res.status(200).json({
        success: true,
        message: 'Payment request initiated successfully',
        data: {
          referenceId,
          phoneNumber: validation.data.phoneNumber,
          amount: validation.data.amount,
          currency: validation.data.currency,
          status: 'PENDING',
        },
      });

      logger.info('Payment request successful', { 
        referenceId, 
        userId: (req as any).user?.id 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check payment status
   */
  checkStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = checkStatusSchema.safeParse(req.params);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid reference ID',
          errors: validation.error.issues,
        });
        return;
      }

      const paymentStatus = await this.momoService.checkPaymentStatus(validation.data.referenceId);

      res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: paymentStatus,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle webhook notifications
   */
  webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { referenceId, status } = req.body;
      
      if (!referenceId || !status) {
        res.status(400).json({
          success: false,
          message: 'Missing referenceId or status',
        });
        return;
      }

      await this.momoService.processWebhook(referenceId, status);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });

      logger.info('MoMo webhook received', { referenceId, status });
    } catch (error) {
      next(error);
    }
  };
}
