// Payment processing types
import { Currency, PaymentMethod } from '../constants'

export interface Payment {
  id: string
  transactionId: string
  
  // Payment details
  amount: number
  currency: Currency
  method: PaymentMethod
  
  // References
  referenceId: string // Sale ID, Loan Payment ID, etc.
  referenceType: string
  
  // Status
  status: PaymentStatus
  
  // Processing
  processedAt?: Date
  failureReason?: string
  
  // Provider details (for mobile money, etc.)
  providerTransactionId?: string
  providerName?: string
  
  // Audit
  createdAt: Date
  updatedAt: Date
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Mobile Money specific types
export interface MobileMoneyTransaction {
  id: string
  paymentId: string
  
  // Transaction details
  amount: number
  currency: Currency
  provider: MobileMoneyProvider
  
  // Customer details
  phoneNumber: string
  customerName?: string
  
  // Request details
  requestId: string
  externalTransactionId?: string
  
  // Status tracking
  status: MobileMoneyStatus
  statusDescription?: string
  
  // Timestamps
  initiatedAt: Date
  completedAt?: Date
  expiresAt: Date
  
  // Retry information
  retryCount: number
  maxRetries: number
  
  // Callback information
  callbackUrl?: string
  callbackReceived: boolean
  callbackData?: any
}

export enum MobileMoneyProvider {
  MTN = 'MTN',
  AIRTEL = 'AIRTEL',
  TIGO = 'TIGO'
}

export enum MobileMoneyStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

// Refund types
export interface Refund {
  id: string
  originalPaymentId: string
  
  // Refund details
  amount: number
  currency: Currency
  reason: RefundReason
  
  // Processing
  method: PaymentMethod
  status: RefundStatus
  
  // References
  referenceId: string
  providerRefundId?: string
  
  // Processing details
  requestedBy: string
  approvedBy?: string
  processedAt?: Date
  
  // Audit
  createdAt: Date
  updatedAt: Date
}

export enum RefundReason {
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  CANCELLED_ORDER = 'CANCELLED_ORDER',
  DEFECTIVE_PRODUCT = 'DEFECTIVE_PRODUCT',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  OTHER = 'OTHER'
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED'
}
