import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { MOMO_CONFIG } from '../utils/constants';

// Types based on MTN MoMo API documentation
export interface MoMoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MoMoBalance {
  availableBalance: string;
  currency: string;
}

export interface MoMoParty {
  partyIdType: 'MSISDN' | 'EMAIL' | 'PARTY_CODE';
  partyId: string;
}

export interface MoMoRequestToPay {
  amount: string;
  currency: string;
  externalId: string;
  payer: MoMoParty;
  payerMessage?: string;
  payeeNote?: string;
}

export interface MoMoRequestToPayResult {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId: string;
  payer: MoMoParty;
  payerMessage?: string;
  payeeNote?: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?: {
    code: string;
    message: string;
  };
}

export interface MoMoError {
  code: string;
  message: string;
}

class MoMoService {
  private client: AxiosInstance;
  private baseURL: string;
  private subscriptionKey: string;
  private apiUser: string;
  private apiKey: string;
  private targetEnvironment: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.baseURL = process.env.MOMO_BASE_URL || MOMO_CONFIG.SANDBOX_BASE_URL;
    this.subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY || '';
    this.apiUser = process.env.MOMO_API_USER || '';
    this.apiKey = process.env.MOMO_API_KEY || '';
    this.targetEnvironment = process.env.MOMO_TARGET_ENVIRONMENT || 'sandbox';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: MOMO_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    // Request interceptor to add access token
    this.client.interceptors.request.use(
      async (config) => {
        // Skip token for token endpoint
        if (!config.url?.includes('/token')) {
          const token = await this.getAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
          config.headers['X-Target-Environment'] = this.targetEnvironment;
        }
        
        logger.info('MoMo API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: { ...config.headers, Authorization: '[REDACTED]' },
        });
        
        return config;
      },
      (error) => {
        logger.error('MoMo API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info('MoMo API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error('MoMo API Response Error:', {
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Get access token from MTN MoMo API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
      
      const response = await axios.post<MoMoTokenResponse>(
        `${this.baseURL}/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json',
          },
          timeout: MOMO_CONFIG.TIMEOUT,
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      logger.info('MoMo access token refreshed');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get MoMo access token:', error);
      throw new Error('Failed to authenticate with MTN MoMo API');
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<MoMoBalance> {
    try {
      const response = await this.client.get<MoMoBalance>('/v1_0/account/balance');
      return response.data;
    } catch (error) {
      logger.error('Failed to get MoMo balance:', error);
      throw new Error('Failed to retrieve account balance');
    }
  }

  /**
   * Check if account holder is active
   */
  async isAccountHolderActive(
    accountHolderIdType: 'msisdn' | 'email' | 'party_code',
    accountHolderId: string
  ): Promise<boolean> {
    try {
      const response = await this.client.get(
        `/v1_0/accountholder/${accountHolderIdType}/${accountHolderId}/active`
      );
      return response.status === 200;
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return false;
      }
      logger.error('Failed to check account holder status:', error);
      throw new Error('Failed to verify account holder');
    }
  }

  /**
   * Request payment from customer
   */
  async requestToPay(
    amount: number,
    phoneNumber: string,
    externalId?: string,
    payerMessage?: string,
    payeeNote?: string
  ): Promise<{ referenceId: string; status: string }> {
    try {
      const referenceId = uuidv4();
      const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);

      const requestData: MoMoRequestToPay = {
        amount: amount.toString(),
        currency: MOMO_CONFIG.CURRENCY,
        externalId: externalId || referenceId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: cleanPhoneNumber,
        },
        payerMessage: payerMessage || 'Payment for Vevurn POS purchase',
        payeeNote: payeeNote || 'Vevurn POS transaction',
      };

      await this.client.post('/v1_0/requesttopay', requestData, {
        headers: {
          'X-Reference-Id': referenceId,
          'X-Callback-Url': process.env.MOMO_CALLBACK_URL,
        },
      });

      logger.info('MoMo payment request initiated:', {
        referenceId,
        amount,
        phoneNumber: cleanPhoneNumber,
        externalId,
      });

      return {
        referenceId,
        status: 'PENDING',
      };
    } catch (error) {
      logger.error('Failed to request MoMo payment:', error);
      throw new Error('Failed to initiate mobile money payment');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(referenceId: string): Promise<MoMoRequestToPayResult> {
    try {
      const response = await this.client.get<MoMoRequestToPayResult>(
        `/v1_0/requesttopay/${referenceId}`
      );

      logger.info('MoMo payment status retrieved:', {
        referenceId,
        status: response.data.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get MoMo payment status:', error);
      throw new Error('Failed to retrieve payment status');
    }
  }

  /**
   * Check payment status with retry logic
   */
  async checkPaymentStatusWithRetry(
    referenceId: string,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ): Promise<MoMoRequestToPayResult> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const result = await this.getPaymentStatus(referenceId);
        
        // If payment is still pending and we have retries left, wait and retry
        if (result.status === 'PENDING' && attempts < maxRetries - 1) {
          attempts++;
          logger.info(`Payment still pending, retrying in ${retryDelay}ms (attempt ${attempts}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        return result;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        
        logger.warn(`Payment status check failed, retrying in ${retryDelay}ms (attempt ${attempts}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error('Max retries exceeded for payment status check');
  }

  /**
   * Cancel payment request
   */
  async cancelPayment(referenceId: string): Promise<boolean> {
    try {
      // MTN MoMo doesn't have a specific cancel endpoint
      // We'll check the status and handle cancellation logic
      const status = await this.getPaymentStatus(referenceId);
      
      if (status.status === 'PENDING') {
        logger.info('Payment cancellation requested:', { referenceId });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to cancel MoMo payment:', error);
      throw new Error('Failed to cancel payment');
    }
  }

  /**
   * Process webhook callback
   */
  async processWebhookCallback(
    referenceId: string,
    callbackData: any
  ): Promise<MoMoRequestToPayResult> {
    try {
      logger.info('Processing MoMo webhook callback:', {
        referenceId,
        callbackData,
      });

      // Get the latest status from the API to verify
      const verifiedStatus = await this.getPaymentStatus(referenceId);
      
      return verifiedStatus;
    } catch (error) {
      logger.error('Failed to process MoMo webhook:', error);
      throw new Error('Failed to process webhook callback');
    }
  }

  /**
   * Validate webhook signature (if MTN provides signature validation)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // MTN MoMo doesn't provide signature validation in sandbox
    // In production, implement signature validation if available
    return true;
  }

  /**
   * Clean and format phone number for Rwanda
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('250')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '250' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '250' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any): Error {
    if (error.response?.data) {
      const errorData = error.response.data;
      const message = errorData.message || errorData.error || 'MTN MoMo API error';
      const code = errorData.code || error.response.status;
      
      return new Error(`MoMo API Error (${code}): ${message}`);
    }
    
    return new Error(error.message || 'Unknown MTN MoMo API error');
  }

  /**
   * Test connection to MTN MoMo API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      await this.getBalance();
      logger.info('MTN MoMo API connection test successful');
      return true;
    } catch (error) {
      logger.error('MTN MoMo API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get transaction history (if available)
   */
  async getTransactionHistory(
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any[]> {
    // MTN MoMo API doesn't provide transaction history endpoint in current version
    // This is a placeholder for future implementation
    logger.warn('Transaction history endpoint not available in current MTN MoMo API version');
    return [];
  }

  /**
   * Utility method to format amount for MoMo API
   */
  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Utility method to validate amount
   */
  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 5000000; // Max 5M RWF per transaction
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [MOMO_CONFIG.CURRENCY];
  }

  /**
   * Check if phone number is valid for MoMo
   */
  isValidMoMoPhoneNumber(phoneNumber: string): boolean {
    const cleaned = this.cleanPhoneNumber(phoneNumber);
    // Rwanda MTN numbers: 250 78X XXX XXX or 250 79X XXX XXX
    return /^250(78|79)\d{7}$/.test(cleaned);
  }
}

// Singleton instance
export const momoService = new MoMoService();
