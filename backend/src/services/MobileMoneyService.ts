import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logger } from '../utils/logger';

interface MoMoPaymentRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  externalId: string;
  payerMessage?: string | undefined;
  payeeNote?: string | undefined;
}

interface MoMoPaymentResponse {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
}

export class MobileMoneyService {
  private prisma: PrismaClient;
  private baseUrl: string;
  private subscriptionKey: string;
  private apiUser: string;
  private apiKey: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.baseUrl = process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY!;
    this.apiUser = process.env.MOMO_API_USER!;
    this.apiKey = process.env.MOMO_API_KEY!;
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to get MoMo access token', { error });
      throw new Error('Failed to authenticate with Mobile Money API');
    }
  }

  /**
   * Request payment from customer
   */
  async requestPayment(paymentData: MoMoPaymentRequest): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();
      const referenceId = `vevurn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Format phone number (remove +250 and ensure 10 digits)
      const phoneNumber = paymentData.phoneNumber.replace(/^\+?250/, '').padStart(9, '0');
      
      const requestBody = {
        amount: paymentData.amount.toString(),
        currency: paymentData.currency || 'RWF',
        externalId: paymentData.externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: paymentData.payerMessage || 'Payment for purchase',
        payeeNote: paymentData.payeeNote || 'Vevurn POS Payment',
      };

      const response = await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Store payment request in database
      await this.prisma.momoTransaction.create({
        data: {
          referenceId,
          externalId: paymentData.externalId,
          phoneNumber: paymentData.phoneNumber,
          amount: paymentData.amount,
          currency: paymentData.currency || 'RWF',
          status: 'PENDING',
          requestData: JSON.stringify(requestBody),
        },
      });

      logger.info('MoMo payment request initiated', { 
        referenceId, 
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount 
      });

      return referenceId;
    } catch (error) {
      logger.error('Failed to request MoMo payment', { error, paymentData });
      throw new Error('Failed to initiate mobile money payment');
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(referenceId: string): Promise<MoMoPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          },
        }
      );

      const paymentData = response.data;

      // Update database with status
      await this.prisma.momoTransaction.update({
        where: { referenceId },
        data: {
          status: paymentData.status,
          financialTransactionId: paymentData.financialTransactionId,
          responseData: JSON.stringify(paymentData),
          updatedAt: new Date(),
        },
      });

      logger.info('MoMo payment status checked', { 
        referenceId, 
        status: paymentData.status 
      });

      return paymentData;
    } catch (error) {
      logger.error('Failed to check MoMo payment status', { error, referenceId });
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(referenceId: string, status: string): Promise<void> {
    try {
      await this.prisma.momoTransaction.update({
        where: { referenceId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      logger.info('MoMo webhook processed', { referenceId, status });
    } catch (error) {
      logger.error('Failed to process MoMo webhook', { error, referenceId, status });
      throw error;
    }
  }
}
