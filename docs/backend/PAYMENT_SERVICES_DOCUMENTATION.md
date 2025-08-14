# Payment Services Documentation

This document provides comprehensive information about the payment processing system, including MTN Mobile Money integration and multi-payment method support.

## Overview

The payment system consists of two main services:
- **MoMo Service**: MTN Mobile Money API integration
- **Payment Service**: Comprehensive payment processing for all methods

## Services Structure

```
src/services/
├── momo.service.ts     # MTN Mobile Money API integration
└── payment.service.ts  # Multi-method payment processing
```

## MoMo Service (momo.service.ts)

### Features
- MTN Mobile Money API integration for Rwanda
- Automatic token management and refresh
- Phone number validation and formatting
- Payment request and status tracking
- Webhook callback processing
- Error handling and retry logic

### Key Methods

#### Authentication
```typescript
// Automatic token management (internal)
private async getAccessToken(): Promise<string>
```

#### Payment Operations
```typescript
// Request payment from customer
async requestToPay(
  amount: number,
  phoneNumber: string,
  externalId?: string,
  payerMessage?: string,
  payeeNote?: string
): Promise<{ referenceId: string; status: string }>

// Check payment status
async getPaymentStatus(referenceId: string): Promise<MoMoRequestToPayResult>

// Check status with retry logic
async checkPaymentStatusWithRetry(
  referenceId: string,
  maxRetries?: number,
  retryDelay?: number
): Promise<MoMoRequestToPayResult>
```

#### Account Management
```typescript
// Get account balance
async getBalance(): Promise<MoMoBalance>

// Check if account holder is active
async isAccountHolderActive(
  accountHolderIdType: 'msisdn' | 'email' | 'party_code',
  accountHolderId: string
): Promise<boolean>
```

#### Utility Methods
```typescript
// Validate Rwanda MTN phone numbers
isValidMoMoPhoneNumber(phoneNumber: string): boolean

// Format amount for API
formatAmount(amount: number): string

// Validate amount limits
validateAmount(amount: number): boolean

// Test API connection
async testConnection(): Promise<boolean>
```

### Usage Examples

#### Basic Payment Request
```typescript
import { momoService } from '../services/momo.service';

// Request payment
const result = await momoService.requestToPay(
  5000,                    // Amount in RWF
  '0788123456',           // Customer phone
  'ORDER-123',            // External ID
  'Payment for iPhone case', // Message to customer
  'Vevurn POS Sale'       // Internal note
);

console.log('Payment initiated:', result.referenceId);
```

#### Check Payment Status
```typescript
// Check status with retries
const status = await momoService.checkPaymentStatusWithRetry(
  referenceId,
  3,     // Max retries
  5000   // 5 second delay
);

if (status.status === 'SUCCESSFUL') {
  console.log('Payment completed!');
}
```

### Configuration

#### Environment Variables
```env
# MTN MoMo Configuration
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_SUBSCRIPTION_KEY=your-subscription-key
MOMO_API_USER=your-api-user-id
MOMO_API_KEY=your-api-key
MOMO_TARGET_ENVIRONMENT=sandbox
MOMO_CALLBACK_URL=https://your-domain.com/webhooks/momo
```

#### Constants Configuration
```typescript
// In src/utils/constants.ts
export const MOMO_CONFIG = {
  SANDBOX_BASE_URL: 'https://sandbox.momodeveloper.mtn.com',
  PRODUCTION_BASE_URL: 'https://ericssonbasicapi1.azure-api.net',
  CURRENCY: 'RWF',
  TIMEOUT: 30000, // 30 seconds
};
```

## Payment Service (payment.service.ts)

### Features
- Multi-method payment processing (Cash, Mobile Money, Bank Transfer, Credit)
- Integration with MoMo service for mobile payments
- Payment status tracking and confirmation
- Webhook processing for real-time updates
- Payment statistics and reporting
- Retry mechanisms for failed payments
- Manual confirmation for bank transfers

### Supported Payment Methods

#### 1. Cash Payments
```typescript
const cashPayment = await paymentService.processPayment({
  saleId: 'sale-123',
  amount: 5000,
  method: 'CASH',
  changeGiven: 1000,
  changeMethod: 'CASH',
  notes: 'Paid in full with change'
});
```

#### 2. Mobile Money Payments
```typescript
const momoPayment = await paymentService.processPayment({
  saleId: 'sale-123',
  amount: 5000,
  method: 'MOBILE_MONEY',
  momoPhoneNumber: '0788123456',
  notes: 'MTN Mobile Money payment'
});

// Requires confirmation
if (momoPayment.requiresConfirmation) {
  // Check status later or process webhook
  const confirmed = await paymentService.confirmMobileMoneyPayment(
    momoPayment.payment.id
  );
}
```

#### 3. Bank Transfer Payments
```typescript
const bankPayment = await paymentService.processPayment({
  saleId: 'sale-123',
  amount: 5000,
  method: 'BANK_TRANSFER',
  bankAccount: 'Bank of Kigali - 123456789',
  transactionId: 'TXN-987654321',
  notes: 'Bank transfer payment'
});

// Manual confirmation required
await paymentService.manualConfirmPayment(
  bankPayment.payment.id,
  'CONFIRMED-TXN-123',
  'Confirmed via bank statement'
);
```

#### 4. Credit Payments
```typescript
const creditPayment = await paymentService.processPayment({
  saleId: 'sale-123',
  amount: 5000,
  method: 'CREDIT',
  notes: 'Customer credit account'
});
```

### Key Methods

#### Payment Processing
```typescript
// Process payment based on method
async processPayment(data: CreatePaymentData): Promise<PaymentResult>

// Confirm mobile money payment
async confirmMobileMoneyPayment(paymentId: string): Promise<any>

// Manual confirmation for bank transfers
async manualConfirmPayment(
  paymentId: string,
  transactionId?: string,
  notes?: string
): Promise<any>

// Cancel payment
async cancelPayment(paymentId: string, reason?: string): Promise<any>
```

#### Payment Management
```typescript
// Get payment by reference number
async getPaymentByReference(referenceNumber: string): Promise<any>

// Get customer payment history
async getCustomerPaymentHistory(customerId: string, limit?: number): Promise<any[]>

// Get failed payments
async getFailedPayments(limit?: number): Promise<any[]>

// Get pending payments
async getPendingPayments(limit?: number): Promise<any[]>

// Retry failed mobile money payment
async retryMobileMoneyPayment(paymentId: string): Promise<PaymentResult>
```

#### Analytics & Reporting
```typescript
// Get payment statistics
async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
  total: { count: number; amount: number };
  byMethod: Array<{ method: string; count: number; amount: number }>;
  byStatus: Array<{ status: string; count: number; amount: number }>;
}>
```

#### Webhook Processing
```typescript
// Process MoMo webhook callbacks
async processMoMoWebhook(referenceId: string, callbackData: any): Promise<void>
```

### Types and Interfaces

#### CreatePaymentData
```typescript
interface CreatePaymentData {
  saleId?: string;                    // Related sale ID
  amount: number;                     // Payment amount
  method: PaymentMethod;              // Payment method
  transactionId?: string;             // External transaction ID
  referenceNumber?: string;           // Payment reference
  momoPhoneNumber?: string;           // For mobile money
  bankAccount?: string;               // For bank transfers
  changeGiven?: number;               // Cash change given
  changeMethod?: PaymentMethod;       // Method for change
  notes?: string;                     // Additional notes
}
```

#### PaymentResult
```typescript
interface PaymentResult {
  payment: any;                       // Created payment record
  requiresConfirmation?: boolean;     // Needs confirmation
  externalReference?: string;         // External reference ID
}
```

### Usage Examples

#### Complete Payment Flow
```typescript
import { paymentService } from '../services/payment.service';

// 1. Process mobile money payment
const result = await paymentService.processPayment({
  saleId: saleId,
  amount: totalAmount,
  method: 'MOBILE_MONEY',
  momoPhoneNumber: customerPhone,
  notes: 'iPhone 15 Pro Case purchase'
});

// 2. Handle confirmation if required
if (result.requiresConfirmation) {
  // Option A: Poll for status
  setTimeout(async () => {
    const confirmed = await paymentService.confirmMobileMoneyPayment(
      result.payment.id
    );
    console.log('Payment status:', confirmed.status);
  }, 10000);
  
  // Option B: Handle via webhook (automatic)
  // Webhook will call processMoMoWebhook automatically
}
```

#### Payment Statistics
```typescript
// Get today's payment statistics
const today = new Date();
const startOfDay = new Date(today.setHours(0, 0, 0, 0));
const endOfDay = new Date(today.setHours(23, 59, 59, 999));

const stats = await paymentService.getPaymentStats(startOfDay, endOfDay);

console.log('Total payments today:', stats.total.count);
console.log('Total amount:', stats.total.amount);
console.log('By method:', stats.byMethod);
console.log('By status:', stats.byStatus);
```

#### Failed Payment Management
```typescript
// Get failed payments for review
const failedPayments = await paymentService.getFailedPayments(10);

// Retry a failed mobile money payment
for (const payment of failedPayments) {
  if (payment.method === 'MOBILE_MONEY') {
    try {
      const retried = await paymentService.retryMobileMoneyPayment(payment.id);
      console.log('Payment retried:', retried.externalReference);
    } catch (error) {
      console.error('Retry failed:', error.message);
    }
  }
}
```

## Error Handling

### Common Error Scenarios

#### MoMo Service Errors
```typescript
try {
  const result = await momoService.requestToPay(amount, phone);
} catch (error) {
  if (error.message.includes('Invalid MTN')) {
    // Handle invalid phone number
  } else if (error.message.includes('Failed to authenticate')) {
    // Handle API authentication issues
  } else {
    // Handle other MoMo API errors
  }
}
```

#### Payment Service Errors
```typescript
try {
  const payment = await paymentService.processPayment(paymentData);
} catch (error) {
  if (error.message.includes('Phone number is required')) {
    // Handle missing phone for mobile money
  } else if (error.message.includes('Bank account information')) {
    // Handle missing bank details
  } else {
    // Handle other payment processing errors
  }
}
```

## Security Considerations

### Data Protection
- Sensitive payment data is logged with redaction
- Phone numbers are validated and formatted
- Transaction IDs are generated securely
- API credentials are environment-based

### API Security
- Automatic token refresh for MoMo API
- Request/response logging for audit trails
- Error handling prevents sensitive data leakage
- Webhook signature validation (when available)

### Best Practices
- Always validate phone numbers before MoMo requests
- Use reference numbers for transaction tracking
- Implement proper error handling and user feedback
- Monitor failed payments for manual intervention
- Use webhook callbacks for real-time status updates

## Testing

### Test Connection
```typescript
// Test MoMo API connection
const connected = await momoService.testConnection();
if (!connected) {
  console.error('MoMo API connection failed');
}
```

### Mock Payments (Development)
```typescript
// For testing, you can use sandbox credentials
// Sandbox phone numbers: 46733123450, 46733123451, etc.
const testPayment = await momoService.requestToPay(
  100,                    // Small amount for testing
  '46733123450',         // MTN sandbox test number
  'TEST-' + Date.now()   // Unique test reference
);
```

## Integration Guide

### Controller Integration
```typescript
// In your payment controller
import { paymentService } from '../services/payment.service';

export const processPayment = async (req: Request, res: Response) => {
  try {
    const result = await paymentService.processPayment(req.body);
    
    res.json({
      success: true,
      data: result,
      message: result.requiresConfirmation 
        ? 'Payment initiated, confirmation required'
        : 'Payment completed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

### Webhook Endpoint
```typescript
// MoMo webhook handler
export const momoWebhook = async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    await paymentService.processMoMoWebhook(referenceId, req.body);
    
    res.status(200).json({ status: 'processed' });
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
```

This documentation provides comprehensive guidance for implementing and using the payment services in your Vevurn POS system.
