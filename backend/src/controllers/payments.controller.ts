import { Request, Response, NextFunction } from 'express';
import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { validatePagination } from '../utils/helpers';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class PaymentsController {
  /**
   * Initiate Mobile Money (MoMo) payment
   */
  async initiateMoMoPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { saleId, amount, phoneNumber } = req.body;

      if (!saleId || !amount || !phoneNumber) {
        return res.status(400).json(ApiResponse.error('Sale ID, amount, and phone number are required'));
      }

      // Validate phone number format (Rwanda format)
      const rwandaPhoneRegex = /^(\+250|250)?[7][0-9]{8}$/;
      if (!rwandaPhoneRegex.test(phoneNumber)) {
        return res.status(400).json(ApiResponse.error('Invalid Rwanda phone number format'));
      }

      // Check if sale exists
      const sale = await prisma.sale.findUnique({
        where: { id: saleId }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      // Generate unique transaction ID
      const transactionId = `MOMO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const payment = await prisma.payment.create({
        data: {
          saleId,
          amount: new Decimal(amount),
          method: PaymentMethod.MOBILE_MONEY,
          status: PaymentStatus.PENDING,
          transactionId,
          momoPhoneNumber: phoneNumber,
          momoRequestId: transactionId, // In real implementation, this would come from MoMo API
          momoStatus: 'PENDING'
        }
      });

      // Here you would integrate with actual Mobile Money API
      // For now, we'll simulate the process
      logger.info(`MoMo payment initiated for sale ${saleId}`, {
        saleId,
        amount,
        phoneNumber,
        transactionId
      });

      // Simulate API call to Mobile Money provider
      const momoResponse = await this.simulateMoMoRequest(phoneNumber, amount, transactionId);

      return res.status(200).json(ApiResponse.success('Mobile Money payment initiated successfully', {
        payment,
        momoResponse,
        instructions: 'Please check your phone and enter your Mobile Money PIN to complete the payment'
      }));
    } catch (error) {
      logger.error('Error initiating MoMo payment:', error);
      next(error);
    }
  }

  /**
   * Verify Mobile Money payment status
   */
  async verifyMoMoPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: {
          sale: true
        }
      });

      if (!payment) {
        return res.status(404).json(ApiResponse.error('Payment not found'));
      }

      // In real implementation, query Mobile Money API for status
      const momoStatus = await this.checkMoMoStatus(transactionId);

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: momoStatus.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          momoStatus: momoStatus.status,
          processedAt: momoStatus.success ? new Date() : null
        }
      });

      // If payment is successful, update sale
      if (momoStatus.success) {
        await this.updateSalePaymentStatus(payment.saleId!, payment.amount);
      }

      return res.status(200).json(ApiResponse.success('Payment status verified', {
        payment: updatedPayment,
        momoStatus
      }));
    } catch (error) {
      logger.error('Error verifying MoMo payment:', error);
      next(error);
    }
  }

  /**
   * Record cash payment
   */
  async recordCashPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { saleId, amount, changeGiven } = req.body;

      if (!saleId || !amount) {
        return res.status(400).json(ApiResponse.error('Sale ID and amount are required'));
      }

      const sale = await prisma.sale.findUnique({
        where: { id: saleId }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      const payment = await prisma.payment.create({
        data: {
          saleId,
          amount: new Decimal(amount),
          method: PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          changeGiven: changeGiven ? new Decimal(changeGiven) : null,
          processedAt: new Date(),
          receiptNumber: `CASH_${Date.now()}`
        }
      });

      // Update sale payment status
      await this.updateSalePaymentStatus(saleId, new Decimal(amount));

      logger.info(`Cash payment recorded for sale ${saleId}`, {
        saleId,
        amount,
        changeGiven
      });

      return res.status(200).json(ApiResponse.success('Cash payment recorded successfully', payment));
    } catch (error) {
      logger.error('Error recording cash payment:', error);
      next(error);
    }
  }

  /**
   * Record bank transfer payment
   */
  async recordBankTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { saleId, amount, bankAccount, referenceNumber } = req.body;

      if (!saleId || !amount || !referenceNumber) {
        return res.status(400).json(ApiResponse.error('Sale ID, amount, and reference number are required'));
      }

      const sale = await prisma.sale.findUnique({
        where: { id: saleId }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      const payment = await prisma.payment.create({
        data: {
          saleId,
          amount: new Decimal(amount),
          method: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.COMPLETED,
          bankAccount,
          referenceNumber,
          processedAt: new Date()
        }
      });

      // Update sale payment status
      await this.updateSalePaymentStatus(saleId, new Decimal(amount));

      logger.info(`Bank transfer payment recorded for sale ${saleId}`, {
        saleId,
        amount,
        referenceNumber
      });

      return res.status(200).json(ApiResponse.success('Bank transfer payment recorded successfully', payment));
    } catch (error) {
      logger.error('Error recording bank transfer payment:', error);
      next(error);
    }
  }

  /**
   * Get payment history with filtering
   */
  async getPaymentHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        method,
        status,
        dateFrom,
        dateTo,
        saleId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query as any;

      const { page: validPage, limit: validLimit } = validatePagination(page, limit);
      const offset = (validPage - 1) * validLimit;

      const where: any = {};

      if (method) where.method = method;
      if (status) where.status = status;
      if (saleId) where.saleId = saleId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            sale: {
              select: {
                id: true,
                saleNumber: true,
                totalAmount: true,
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: offset,
          take: validLimit
        }),
        prisma.payment.count({ where })
      ]);

      return res.status(200).json(ApiResponse.paginated(
        'Payment history retrieved successfully',
        payments,
        validPage,
        validLimit,
        total
      ));
    } catch (error) {
      logger.error('Error getting payment history:', error);
      next(error);
    }
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo } = req.query as any;

      const where: any = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [
        totalPayments,
        paymentsByMethod,
        paymentsByStatus,
        totalAmount
      ] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.groupBy({
          by: ['method'],
          where,
          _count: { id: true },
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { ...where, status: PaymentStatus.COMPLETED },
          _sum: { amount: true }
        })
      ]);

      return res.status(200).json(ApiResponse.success('Payment summary retrieved successfully', {
        totalPayments,
        totalAmount: totalAmount._sum.amount || 0,
        byMethod: paymentsByMethod,
        byStatus: paymentsByStatus
      }));
    } catch (error) {
      logger.error('Error getting payment summary:', error);
      next(error);
    }
  }

  /**
   * Process refund
   */
  async processRefund(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { refundAmount, reason } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { sale: true }
      });

      if (!payment) {
        return res.status(404).json(ApiResponse.error('Payment not found'));
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        return res.status(400).json(ApiResponse.error('Can only refund completed payments'));
      }

      const refundAmountDecimal = new Decimal(refundAmount);
      if (refundAmountDecimal.gt(payment.amount)) {
        return res.status(400).json(ApiResponse.error('Refund amount cannot exceed payment amount'));
      }

      const refundPayment = await prisma.payment.create({
        data: {
          saleId: payment.saleId,
          amount: refundAmountDecimal.neg(), // Negative amount for refund
          method: payment.method,
          status: PaymentStatus.COMPLETED,
          referenceNumber: `REFUND_${Date.now()}`,
          notes: `Refund for payment ${payment.id}: ${reason}`,
          processedAt: new Date()
        }
      });

      logger.info(`Refund processed for payment ${paymentId}`, {
        paymentId,
        refundAmount,
        reason
      });

      return res.status(200).json(ApiResponse.success('Refund processed successfully', refundPayment));
    } catch (error) {
      logger.error('Error processing refund:', error);
      next(error);
    }
  }

  // Private helper methods

  private async simulateMoMoRequest(phoneNumber: string, amount: number, transactionId: string) {
    // Simulate MoMo API call
    return {
      success: true,
      requestId: transactionId,
      message: 'Payment request sent to customer',
      status: 'PENDING'
    };
  }

  private async checkMoMoStatus(transactionId: string) {
    // Simulate MoMo status check
    // In real implementation, this would call the MoMo API
    const isSuccess = Math.random() > 0.3; // 70% success rate for simulation
    
    return {
      success: isSuccess,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      message: isSuccess ? 'Payment completed successfully' : 'Payment failed'
    };
  }

  private async updateSalePaymentStatus(saleId: string, paymentAmount: Decimal) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { payments: true }
    });

    if (!sale) return;

    const totalPaid = sale.payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

    const newAmountPaid = totalPaid.plus(paymentAmount);
    const newAmountDue = sale.totalAmount.minus(newAmountPaid);

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue.lt(0) ? new Decimal(0) : newAmountDue,
        status: newAmountDue.lte(0) ? 'COMPLETED' : 'DRAFT'
      }
    });
  }
}
