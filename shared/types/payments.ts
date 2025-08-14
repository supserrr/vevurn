// Payment Types
export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  momoPhone?: string;
  momoTransactionId?: string;
  cardLastFour?: string;
  cardType?: CardType;
  processorResponse?: ProcessorResponse;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  sale?: any; // Sale type from sales
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOMO_MTN = 'MOMO_MTN',
  MOMO_AIRTEL = 'MOMO_AIRTEL',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum CardType {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMERICAN_EXPRESS = 'AMERICAN_EXPRESS',
  OTHER = 'OTHER',
}

export interface ProcessorResponse {
  processorId: string;
  transactionId?: string;
  authCode?: string;
  responseCode: string;
  responseMessage: string;
  processorFee?: number;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
}

export interface CreatePaymentRequest {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  momoPhone?: string;
  notes?: string;
}

export interface MomoPaymentRequest {
  amount: number;
  phone: string;
  reference?: string;
  description?: string;
}

export interface MomoPaymentResponse {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  message: string;
  reference?: string;
}

export interface PaymentRefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if less than original amount
  reason: string;
  notes?: string;
}

export interface PaymentRefund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt?: string;
  processorResponse?: ProcessorResponse;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  payment?: Payment;
}

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Mobile Money Types
export interface MomoProvider {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  config: MomoProviderConfig;
}

export interface MomoProviderConfig {
  baseUrl: string;
  apiKey: string;
  secretKey?: string;
  userId?: string;
  subscriptionKey: string;
  environment: 'sandbox' | 'production';
  timeout: number;
  retryAttempts: number;
}

export interface MomoTransaction {
  id: string;
  paymentId: string;
  provider: string;
  externalId: string;
  phone: string;
  amount: number;
  currency: string;
  status: MomoTransactionStatus;
  statusReason?: string;
  payer?: MomoPayer;
  requestedAt: string;
  completedAt?: string;
  failedAt?: string;
  webhookReceived: boolean;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export enum MomoTransactionStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

export interface MomoPayer {
  partyId: string;
  partyIdType: string;
  name?: string;
  personalId?: string;
}

// Webhook Types
export interface MomoWebhookPayload {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: MomoPayer;
  payerMessage?: string;
  payeeNote?: string;
  status: string;
  reason?: {
    code: string;
    message: string;
  };
}

export interface PaymentWebhookData {
  paymentId: string;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: string;
  metadata?: Record<string, any>;
}

// Payment Analytics Types
export interface PaymentAnalytics {
  totalAmount: number;
  totalCount: number;
  successRate: number;
  averageAmount: number;
  methodBreakdown: PaymentMethodBreakdown[];
  dailyTrends: DailyPaymentTrend[];
  processingTimes: PaymentProcessingTime[];
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
  successRate: number;
}

export interface DailyPaymentTrend {
  date: string;
  amount: number;
  count: number;
  methods: Record<PaymentMethod, number>;
}

export interface PaymentProcessingTime {
  method: PaymentMethod;
  averageSeconds: number;
  medianSeconds: number;
  p95Seconds: number;
}
