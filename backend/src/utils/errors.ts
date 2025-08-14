/**
 * Custom error classes for the Vevurn POS system
 * Provides structured error handling with specific error codes and status codes
 */

export class CustomError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  public validationErrors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(
    message: string = 'Validation failed',
    validationErrors: Array<{ field: string; message: string; code: string }> = []
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class BusinessLogicError extends CustomError {
  constructor(message: string, errorCode: string = 'BUSINESS_LOGIC_ERROR') {
    super(message, 422, errorCode);
  }
}

export class PaymentError extends CustomError {
  public paymentErrorCode?: string;
  
  constructor(message: string, paymentErrorCode?: string) {
    super(message, 402, 'PAYMENT_ERROR');
    this.paymentErrorCode = paymentErrorCode;
  }
}

export class ExternalServiceError extends CustomError {
  public service: string;
  public originalError?: Error;

  constructor(message: string, service: string, originalError?: Error) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Error helper functions
export const isOperationalError = (error: Error): error is CustomError => {
  return error instanceof CustomError && error.isOperational;
};

export const formatErrorResponse = (error: CustomError) => {
  const response: any = {
    success: false,
    error: error.errorCode,
    message: error.message,
  };

  if (error instanceof ValidationError && error.validationErrors.length > 0) {
    response.details = error.validationErrors;
  }

  if (error instanceof PaymentError && error.paymentErrorCode) {
    response.paymentErrorCode = error.paymentErrorCode;
  }

  if (error instanceof ExternalServiceError) {
    response.service = error.service;
  }

  return response;
};

export default {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  PaymentError,
  ExternalServiceError,
  DatabaseError,
  RateLimitError,
  isOperationalError,
  formatErrorResponse,
};
