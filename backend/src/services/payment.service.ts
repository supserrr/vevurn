import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import { momoService, MoMoRequestToPayResult } from './momo.service';
import { logger } from '../utils/logger';
import { generateSecureToken } from '../utils/encryption';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export interface CreatePaymentData {
  saleId?: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  referenceNumber?: string;
  momoPhoneNumber?: string;
  bankAccount?: string;
  changeGiven?: number;
  changeMethod?: PaymentMethod;
  notes?: string;
}

export interface PaymentResult {
  payment: any;
  requiresConfirmation?: boolean;
  externalReference?: string;
}

class PaymentService {
  /**
   * Process a payment based on method
   */
  async processPayment(data: CreatePaymentData): Promise<PaymentResult> {
    const referenceNumber = data.referenceNumber || generateSecureToken(16);

    switch (data.method) {
      case 'CASH':
        return this.processCashPayment(data, referenceNumber);
      
      case 'MOBILE_MONEY':
        return this.processMobileMoneyPayment(data, referenceNumber);
      
      case 'BANK_TRANSFER':
        return this.processBankTransferPayment(data, referenceNumber);
      
      case 'CREDIT':
        return this.processCreditPayment(data, referenceNumber);
      
      default:
        throw new Error(`Unsupported payment method: ${data.method}`);
    }
  }

  /**
   * Process cash payment
   */
  private async processCashPayment(
    data: CreatePaymentData,
    referenceNumber: string
  ): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.create({
        data: {
          saleId: data.saleId,
          amount: new Decimal(data.amount),
          method: 'CASH',
          status: 'COMPLETED',
          referenceNumber,
          changeGiven: data.changeGiven ? new Decimal(data.changeGiven) : null,
          changeMethod: data.changeMethod,
          notes: data.notes,
          processedAt: new Date(),
        },
        include: {
          sale: true,
        },
      });

      logger.info('Cash payment processed:', {
        paymentId: payment.id,
        amount: data.amount,
        referenceNumber,
      });

      return { payment };
    } catch (error) {
      logger.error('Cash payment processing failed:', error);
      throw new Error('Failed to process cash payment');
    }
  }

  /**
   * Process mobile money payment
   */
  private async processMobileMoneyPayment(
    data: CreatePaymentData,
    referenceNumber: string
  ): Promise<PaymentResult> {
    if (!data.momoPhoneNumber) {
      throw new Error('Phone number is required for mobile money payments');
    }

    if (!momoService.isValidMoMoPhoneNumber(data.momoPhoneNumber)) {
      throw new Error('Invalid MTN mobile money phone number');
    }

    try {
      // Create pending payment record
      const payment = await prisma.payment.create({
        data: {
          saleId: data.saleId,
          amount: new Decimal(data.amount),
          method: 'MOBILE_MONEY',
          status: 'PENDING',
          referenceNumber,
          momoPhoneNumber: data.momoPhoneNumber,
          notes: data.notes,
        },
        include: {
          sale: true,
        },
      });

      // Initiate MoMo payment request
      const momoResult = await momoService.requestToPay(
        data.amount,
        data.momoPhoneNumber,
        referenceNumber,
        'Payment for Vevurn POS purchase',
        `Sale #${payment.sale?.saleNumber || 'N/A'}`
      );

      // Update payment with MoMo reference
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          momoRequestId: momoResult.referenceId,
          momoStatus: momoResult.status,
        },
      });

      logger.info('Mobile money payment initiated:', {
        paymentId: payment.id,
        amount: data.amount,
        phoneNumber: data.momoPhoneNumber,
        momoReferenceId: momoResult.referenceId,
      });

      return {
        payment: { ...payment, momoRequestId: momoResult.referenceId },
        requiresConfirmation: true,
        externalReference: momoResult.referenceId,
      };
    } catch (error) {
      logger.error('Mobile money payment processing failed:', error);
      throw new Error('Failed to initiate mobile money payment');
    }
  }

  /**
   * Process bank transfer payment
   */
  private async processBankTransferPayment(
    data: CreatePaymentData,
    referenceNumber: string
  ): Promise<PaymentResult> {
    if (!data.bankAccount) {
      throw new Error('Bank account information is required');
    }

    try {
      const payment = await prisma.payment.create({
        data: {
          saleId: data.saleId,
          amount: new Decimal(data.amount),
          method: 'BANK_TRANSFER',
          status: 'PENDING', // Requires manual confirmation
          referenceNumber,
          bankAccount: data.bankAccount,
          transactionId: data.transactionId,
          notes: data.notes,
        },
        include: {
          sale: true,
        },
      });

      logger.info('Bank transfer payment recorded:', {
        paymentId: payment.id,
        amount: data.amount,
        bankAccount: data.bankAccount,
        referenceNumber,
      });

      return {
        payment,
        requiresConfirmation: true,
      };
    } catch (error) {
      logger.error('Bank transfer payment processing failed:', error);
      throw new Error('Failed to record bank transfer payment');
    }
  }

  /**
   * Process credit payment
   */
  private async processCreditPayment(
    data: CreatePaymentData,
    referenceNumber: string
  ): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.create({
        data: {
          saleId: data.saleId,
          amount: new Decimal(data.amount),
          method: 'CREDIT',
          status: 'COMPLETED',
          referenceNumber,
          notes: data.notes,
          processedAt: new Date(),
        },
        include: {
          sale: true,
        },
      });

      logger.info('Credit payment processed:', {
        paymentId: payment.id,
        amount: data.amount,
        referenceNumber,
      });

      return { payment };
    } catch (error) {
      logger.error('Credit payment processing failed:', error);
      throw new Error('Failed to process credit payment');
    }
  }

  /**
   * Confirm mobile money payment
   */
  async confirmMobileMoneyPayment(paymentId: string): Promise<any> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { sale: true },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.method !== 'MOBILE_MONEY') {
        throw new Error('Payment is not a mobile money payment');
      }

      if (!payment.momoRequestId) {
        throw new Error('No MoMo request ID found');
      }

      // Check payment status with MTN
      const momoResult = await momoService.getPaymentStatus(payment.momoRequestId);

      // Update payment status based on MoMo result
      let status: PaymentStatus;
      let processedAt: Date | null = null;

      switch (momoResult.status) {
        case 'SUCCESSFUL':
          status = 'COMPLETED';
          processedAt = new Date();
          break;
        case 'FAILED':
          status = 'FAILED';
          break;
        case 'PENDING':
        default:
          status = 'PENDING';
          break;
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          momoStatus: momoResult.status,
          transactionId: momoResult.financialTransactionId,
          processedAt,
        },
        include: { sale: true },
      });

      logger.info('Mobile money payment confirmed:', {
        paymentId,
        status: momoResult.status,
        transactionId: momoResult.financialTransactionId,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Mobile money payment confirmation failed:', error);
      throw new Error('Failed to confirm mobile money payment');
    }
  }

  /**
   * Process MoMo webhook
   */
  async processMoMoWebhook(referenceId: string, callbackData: any): Promise<void> {
    try {
      // Find payment by MoMo request ID
      const payment = await prisma.payment.findFirst({
        where: { momoRequestId: referenceId },
        include: { sale: true },
      });

      if (!payment) {
        logger.warn('Payment not found for MoMo webhook:', { referenceId });
        return;
      }

      // Process the webhook
      const momoResult = await momoService.processWebhookCallback(referenceId, callbackData);

      // Update payment status
      let status: PaymentStatus;
      let processedAt: Date | null = null;

      switch (momoResult.status) {
        case 'SUCCESSFUL':
          status = 'COMPLETED';
          processedAt = new Date();
          break;
        case 'FAILED':
          status = 'FAILED';
          break;
        default:
          status = 'PENDING';
          break;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          momoStatus: momoResult.status,
          transactionId: momoResult.financialTransactionId,
          processedAt,
        },
      });

      // Emit real-time update if available
      if (global.socketIO) {
        global.socketIO.emit('payment-updated', {
          paymentId: payment.id,
          saleId: payment.saleId,
          status,
        });
      }

      logger.info('MoMo webhook processed:', {
        paymentId: payment.id,
        referenceId,
        status: momoResult.status,
      });
    } catch (error) {
      logger.error('MoMo webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Get payment by reference
   */
  async getPaymentByReference(referenceNumber: string): Promise<any> {
    return prisma.payment.findFirst({
      where: { referenceNumber },
      include: {
        sale: {
          include: {
            customer: true,
            cashier: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<any> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed payment');
      }

      // Cancel MoMo payment if applicable
      if (payment.method === 'MOBILE_MONEY' && payment.momoRequestId) {
        await momoService.cancelPayment(payment.momoRequestId);
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          notes: payment.notes ? `${payment.notes} | Cancelled: ${reason || 'No reason provided'}` : `Cancelled: ${reason || 'No reason provided'}`,
        },
        include: { sale: true },
      });

      logger.info('Payment cancelled:', {
        paymentId,
        reason,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Payment cancellation failed:', error);
      throw new Error('Failed to cancel payment');
    }
  }

  /**
   * Get payment history for a customer
   */
  async getCustomerPaymentHistory(customerId: string, limit: number = 50): Promise<any[]> {
    return prisma.payment.findMany({
      where: {
        sale: {
          customerId,
        },
      },
      include: {
        sale: {
          select: {
            saleNumber: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(startDate?: Date, endDate?: Date) {
    const whereClause = {
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [totalPayments, paymentsByMethod, paymentsByStatus] = await Promise.all([
      // Total payments and amount
      prisma.payment.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: true,
      }),
      
      // Payments by method
      prisma.payment.groupBy({
        by: ['method'],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
      }),
      
      // Payments by status
      prisma.payment.groupBy({
        by: ['status'],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        count: totalPayments._count,
        amount: totalPayments._sum.amount || 0,
      },
      byMethod: paymentsByMethod.map(p => ({
        method: p.method,
        count: p._count,
        amount: p._sum.amount || 0,
      })),
      byStatus: paymentsByStatus.map(p => ({
        status: p.status,
        count: p._count,
        amount: p._sum.amount || 0,
      })),
    };
  }

  /**
   * Get failed payments that need attention
   */
  async getFailedPayments(limit: number = 20): Promise<any[]> {
    return prisma.payment.findMany({
      where: {
        status: 'FAILED',
      },
      include: {
        sale: {
          include: {
            customer: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Retry failed mobile money payment
   */
  async retryMobileMoneyPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { sale: true },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.method !== 'MOBILE_MONEY') {
        throw new Error('Payment is not a mobile money payment');
      }

      if (payment.status !== 'FAILED') {
        throw new Error('Payment is not in failed status');
      }

      if (!payment.momoPhoneNumber) {
        throw new Error('No phone number found for retry');
      }

      // Retry the payment
      const momoResult = await momoService.requestToPay(
        payment.amount.toNumber(),
        payment.momoPhoneNumber,
        payment.referenceNumber || undefined,
        'Retry payment for Vevurn POS purchase',
        `Retry Sale #${payment.sale?.saleNumber || 'N/A'}`
      );

      // Update payment with new MoMo reference
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PENDING',
          momoRequestId: momoResult.referenceId,
          momoStatus: momoResult.status,
        },
        include: { sale: true },
      });

      logger.info('Mobile money payment retried:', {
        paymentId,
        momoReferenceId: momoResult.referenceId,
      });

      return {
        payment: updatedPayment,
        requiresConfirmation: true,
        externalReference: momoResult.referenceId,
      };
    } catch (error) {
      logger.error('Mobile money payment retry failed:', error);
      throw new Error('Failed to retry mobile money payment');
    }
  }

  /**
   * Get pending payments that need confirmation
   */
  async getPendingPayments(limit: number = 50): Promise<any[]> {
    return prisma.payment.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        sale: {
          include: {
            customer: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Manual payment confirmation (for bank transfers, etc.)
   */
  async manualConfirmPayment(
    paymentId: string,
    transactionId?: string,
    notes?: string
  ): Promise<any> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'COMPLETED') {
        throw new Error('Payment is already completed');
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          transactionId,
          processedAt: new Date(),
          notes: notes ? (payment.notes ? `${payment.notes} | ${notes}` : notes) : payment.notes,
        },
        include: { sale: true },
      });

      logger.info('Payment manually confirmed:', {
        paymentId,
        transactionId,
        method: payment.method,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Manual payment confirmation failed:', error);
      throw new Error('Failed to confirm payment manually');
    }
  }
}

export const paymentService = new PaymentService();
