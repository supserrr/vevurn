/**
 * MTN Rwanda Mobile Money API Error Codes and Handling
 * Complete reference for production deployment
 */

interface MTNErrorInfo {
  code: string;
  message: string;
  httpStatus: number;
  description: string;
  action: string;
  retry: boolean;
  customerMessage: string;
}

interface MTNErrorContext {
  referenceId?: string;
  phoneNumber?: string;
  amount?: number;
  [key: string]: any;
}

interface MTNError extends MTNErrorInfo {
  context?: MTNErrorContext;
  timestamp?: string;
}

interface RetryConfig {
  attempts: number;
  delay: number;
}

interface ErrorReport {
  timestamp: string;
  summary: {
    totalErrors: number;
    retryableErrors: number;
    criticalErrors: number;
  };
  errorBreakdown: Record<string, number>;
}

export const MTN_ERROR_CODES: Record<string, MTNErrorInfo> = {
  // Authentication Errors
  'INVALID_API_USER': {
    code: 'INVALID_API_USER',
    message: 'Invalid API User',
    httpStatus: 401,
    description: 'The API user is not valid or has been disabled',
    action: 'Check API user credentials and ensure account is active',
    retry: false,
    customerMessage: 'Payment service temporarily unavailable. Please try again later.'
  },
  
  'INVALID_SUBSCRIPTION_KEY': {
    code: 'INVALID_SUBSCRIPTION_KEY',
    message: 'Invalid subscription key',
    httpStatus: 401,
    description: 'The subscription key is invalid or expired',
    action: 'Verify subscription key in MTN developer portal',
    retry: false,
    customerMessage: 'Payment service configuration error. Please contact support.'
  },

  // Account Errors
  'ACCOUNT_NOT_FOUND': {
    code: 'ACCOUNT_NOT_FOUND',
    message: 'Account not found',
    httpStatus: 404,
    description: 'The specified phone number is not registered with MTN Mobile Money',
    action: 'Ask customer to verify phone number or register for Mobile Money',
    retry: false,
    customerMessage: 'Phone number not registered for Mobile Money. Please check your number or register for the service.'
  },

  'ACCOUNT_NOT_ACTIVE': {
    code: 'ACCOUNT_NOT_ACTIVE',
    message: 'Account not active',
    httpStatus: 400,
    description: 'The Mobile Money account is suspended or inactive',
    action: 'Ask customer to contact MTN to activate their account',
    retry: false,
    customerMessage: 'Your Mobile Money account is not active. Please contact MTN customer service.'
  },

  'INSUFFICIENT_FUNDS': {
    code: 'INSUFFICIENT_FUNDS',
    message: 'Insufficient funds',
    httpStatus: 400,
    description: 'Customer does not have sufficient balance for the transaction',
    action: 'Ask customer to top up their account',
    retry: true,
    customerMessage: 'Insufficient funds in your Mobile Money account. Please top up and try again.'
  },

  // Transaction Errors
  'TRANSACTION_LIMIT_EXCEEDED': {
    code: 'TRANSACTION_LIMIT_EXCEEDED',
    message: 'Transaction limit exceeded',
    httpStatus: 400,
    description: 'Transaction amount exceeds daily or monthly limits',
    action: 'Suggest splitting transaction or trying next day',
    retry: false,
    customerMessage: 'Transaction amount exceeds your daily limit. Please try a smaller amount or contact MTN to increase your limit.'
  },

  'DUPLICATE_REFERENCE_ID': {
    code: 'DUPLICATE_REFERENCE_ID',
    message: 'Duplicate reference ID',
    httpStatus: 409,
    description: 'The reference ID has already been used',
    action: 'Generate new reference ID and retry',
    retry: true,
    customerMessage: 'Transaction reference error. Please try again.'
  },

  'TRANSACTION_EXPIRED': {
    code: 'TRANSACTION_EXPIRED',
    message: 'Transaction expired',
    httpStatus: 400,
    description: 'Customer did not complete transaction within time limit',
    action: 'Create new payment request',
    retry: true,
    customerMessage: 'Transaction timed out. Please try again and complete the payment within the time limit.'
  },

  'TRANSACTION_CANCELLED': {
    code: 'TRANSACTION_CANCELLED',
    message: 'Transaction cancelled',
    httpStatus: 400,
    description: 'Customer cancelled the transaction on their mobile device',
    action: 'No action needed, customer chose to cancel',
    retry: true,
    customerMessage: 'Transaction was cancelled. You can try again if needed.'
  },

  'TRANSACTION_FAILED': {
    code: 'TRANSACTION_FAILED',
    message: 'Transaction failed',
    httpStatus: 400,
    description: 'General transaction failure',
    action: 'Check transaction details and try again',
    retry: true,
    customerMessage: 'Transaction failed. Please try again or contact support if the problem persists.'
  },

  // Network/Service Errors
  'SERVICE_UNAVAILABLE': {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    httpStatus: 503,
    description: 'MTN Mobile Money service is temporarily down',
    action: 'Retry after some time',
    retry: true,
    customerMessage: 'Mobile Money service is temporarily unavailable. Please try again in a few minutes.'
  },

  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    message: 'Network error',
    httpStatus: 500,
    description: 'Network connectivity issues',
    action: 'Check network connection and retry',
    retry: true,
    customerMessage: 'Network connection error. Please check your connection and try again.'
  },

  'TIMEOUT': {
    code: 'TIMEOUT',
    message: 'Request timeout',
    httpStatus: 408,
    description: 'Request to MTN API timed out',
    action: 'Retry with longer timeout',
    retry: true,
    customerMessage: 'Request timed out. Please try again.'
  },

  // Validation Errors
  'INVALID_PHONE_NUMBER': {
    code: 'INVALID_PHONE_NUMBER',
    message: 'Invalid phone number format',
    httpStatus: 400,
    description: 'Phone number does not match Rwanda format',
    action: 'Validate phone number format',
    retry: false,
    customerMessage: 'Invalid phone number format. Please enter a valid Rwanda Mobile Money number (078xxxxxxx or 079xxxxxxx).'
  },

  'INVALID_AMOUNT': {
    code: 'INVALID_AMOUNT',
    message: 'Invalid amount',
    httpStatus: 400,
    description: 'Amount is outside acceptable range',
    action: 'Check minimum and maximum transaction limits',
    retry: false,
    customerMessage: 'Invalid amount. Please enter an amount between 100 and 1,000,000 RWF.'
  },

  'INVALID_CURRENCY': {
    code: 'INVALID_CURRENCY',
    message: 'Invalid currency',
    httpStatus: 400,
    description: 'Currency is not RWF',
    action: 'Use RWF currency only',
    retry: false,
    customerMessage: 'Invalid currency. Only Rwandan Francs (RWF) are supported.'
  }
};

/**
 * Rwanda-specific phone number validation
 */
export const validateRwandaPhoneNumber = (phoneNumber: string): boolean => {
  // Remove spaces and special characters except +
  const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
  
  // Rwanda MTN formats
  const patterns = [
    /^\+25078\d{7}$/, // +250 78X XXXXXX
    /^\+25079\d{7}$/, // +250 79X XXXXXX
    /^078\d{7}$/,     // 078X XXXXXX
    /^079\d{7}$/,     // 079X XXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleanNumber));
};

/**
 * Format phone number for MTN API
 */
export const formatPhoneNumberForMTN = (phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
  
  // If local format, add country code
  if (cleanNumber.match(/^07[89]\d{7}$/)) {
    return `+250${cleanNumber}`;
  }
  
  // If already international format
  if (cleanNumber.match(/^\+25007[89]\d{7}$/)) {
    return cleanNumber;
  }
  
  throw new Error('Invalid Rwanda phone number format');
};

/**
 * Error handler for MTN API responses
 */
export const handleMTNError = (error: any, context: MTNErrorContext = {}): MTNErrorInfo & { context: MTNErrorContext; timestamp: string } => {
  let mtnError = MTN_ERROR_CODES.TRANSACTION_FAILED; // Default
  
  if (error.response) {
    const { status, data } = error.response;
    
    // Map HTTP status codes to MTN errors
    switch (status) {
      case 401:
        mtnError = data?.code === 'INVALID_API_USER' 
          ? MTN_ERROR_CODES.INVALID_API_USER 
          : MTN_ERROR_CODES.INVALID_SUBSCRIPTION_KEY;
        break;
        
      case 404:
        mtnError = MTN_ERROR_CODES.ACCOUNT_NOT_FOUND;
        break;
        
      case 409:
        mtnError = MTN_ERROR_CODES.DUPLICATE_REFERENCE_ID;
        break;
        
      case 408:
        mtnError = MTN_ERROR_CODES.TIMEOUT;
        break;
        
      case 503:
        mtnError = MTN_ERROR_CODES.SERVICE_UNAVAILABLE;
        break;
        
      case 400:
        // Parse specific error from response
        if (data?.code && MTN_ERROR_CODES[data.code]) {
          mtnError = MTN_ERROR_CODES[data.code];
        } else if (data?.message) {
          // Try to match message patterns
          const message = data.message.toLowerCase();
          if (message.includes('insufficient')) {
            mtnError = MTN_ERROR_CODES.INSUFFICIENT_FUNDS;
          } else if (message.includes('limit')) {
            mtnError = MTN_ERROR_CODES.TRANSACTION_LIMIT_EXCEEDED;
          } else if (message.includes('expired')) {
            mtnError = MTN_ERROR_CODES.TRANSACTION_EXPIRED;
          } else if (message.includes('cancelled')) {
            mtnError = MTN_ERROR_CODES.TRANSACTION_CANCELLED;
          }
        }
        break;
        
      default:
        mtnError = MTN_ERROR_CODES.NETWORK_ERROR;
    }
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    mtnError = MTN_ERROR_CODES.NETWORK_ERROR;
  } else if (error.code === 'ETIMEDOUT') {
    mtnError = MTN_ERROR_CODES.TIMEOUT;
  }
  
  // Log error with context
  console.error('MTN API Error:', {
    error: mtnError.code,
    message: mtnError.message,
    context,
    originalError: error.message
  });
  
  return {
    ...mtnError,
    context,
    timestamp: new Date().toISOString()
  };
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (errorCode: string): boolean => {
  const error = MTN_ERROR_CODES[errorCode];
  return error ? error.retry : false;
};

/**
 * Get customer-friendly error message
 */
export const getCustomerErrorMessage = (errorCode: string): string => {
  const error = MTN_ERROR_CODES[errorCode];
  return error ? error.customerMessage : 'An unexpected error occurred. Please try again or contact support.';
};

/**
 * Retry configuration for different error types
 */
export const getRetryConfig = (errorCode: string): { attempts: number; delay: number } => {
  const retryConfigs: Record<string, { attempts: number; delay: number }> = {
    'TIMEOUT': { attempts: 3, delay: 5000 },
    'SERVICE_UNAVAILABLE': { attempts: 3, delay: 10000 },
    'NETWORK_ERROR': { attempts: 2, delay: 3000 },
    'TRANSACTION_FAILED': { attempts: 1, delay: 5000 },
    'INSUFFICIENT_FUNDS': { attempts: 0, delay: 0 },
    'DUPLICATE_REFERENCE_ID': { attempts: 1, delay: 1000 }
  };
  
  return retryConfigs[errorCode] || { attempts: 0, delay: 0 };
};

/**
 * Generate error report for monitoring
 */
export const generateErrorReport = (errors: Array<{ code: string }>): ErrorReport => {
  const report: ErrorReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      retryableErrors: errors.filter((e: { code: string }) => isRetryableError(e.code)).length,
      criticalErrors: errors.filter((e: { code: string }) => ['INVALID_API_USER', 'INVALID_SUBSCRIPTION_KEY'].includes(e.code)).length
    },
    errorBreakdown: {}
  };
  
  // Count errors by type
  errors.forEach((error: { code: string }) => {
    if (!report.errorBreakdown[error.code]) {
      report.errorBreakdown[error.code] = 0;
    }
    report.errorBreakdown[error.code]++;
  });
  
  return report;
};
