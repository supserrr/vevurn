// Enhanced Error Handler Middleware
// File: backend/src/middleware/enhancedErrorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ErrorTrackingService } from '../services/ErrorTrackingService';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string = 'Service') {
    super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    stack?: string;
    timestamp: string;
    requestId?: string;
    traceId?: string;
  };
  meta?: {
    statusCode: number;
    path: string;
    method: string;
    userAgent?: string | undefined;
    ip?: string | undefined;
  };
}

/**
 * Enhanced error handler with comprehensive tracking and classification
 */
export const enhancedErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorTracker = ErrorTrackingService.getInstance();
  
  // Prevent duplicate error handling
  if (res.headersSent) {
    return next(error);
  }

  // Initialize error response
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;
  let shouldTrack = true;

  // Classify and handle different error types
  if (error instanceof AppError) {
    // Application-specific errors
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    details = error.details;
    shouldTrack = statusCode >= 500; // Only track server errors, not client errors

  } else if (error instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        ...(issue as any).expected && { expected: (issue as any).expected },
        ...(issue as any).received && { received: (issue as any).received }
      }))
    };
    shouldTrack = false; // Don't track validation errors

  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    code = prismaError.code;
    details = prismaError.details;

  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    // Unknown Prisma errors
    statusCode = 500;
    message = 'Database error occurred';
    code = 'DATABASE_UNKNOWN_ERROR';
    details = { prismaCode: 'UNKNOWN_REQUEST_ERROR' };

  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    // Prisma Rust panic errors
    statusCode = 500;
    message = 'Database connection error';
    code = 'DATABASE_CONNECTION_ERROR';
    details = { prismaCode: 'RUST_PANIC' };

  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    // Prisma initialization errors
    statusCode = 500;
    message = 'Database initialization error';
    code = 'DATABASE_INIT_ERROR';
    details = { prismaCode: 'INITIALIZATION_ERROR' };

  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    message = 'Database validation error';
    code = 'DATABASE_VALIDATION_ERROR';
    shouldTrack = false;

  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
    shouldTrack = false;

  } else if (error.name === 'TokenExpiredError') {
    // Expired JWT
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
    shouldTrack = false;

  } else if (error.name === 'NotBeforeError') {
    // JWT not active yet
    statusCode = 401;
    message = 'Authentication token not active';
    code = 'TOKEN_NOT_ACTIVE';
    shouldTrack = false;

  } else if (error.name === 'MulterError') {
    // File upload errors
    const multerError = handleMulterError(error as any);
    statusCode = multerError.statusCode;
    message = multerError.message;
    code = multerError.code;
    details = multerError.details;
    shouldTrack = false;

  } else if ((error as any).code === 'ECONNREFUSED') {
    // Database/Redis connection errors
    statusCode = 503;
    message = 'Service temporarily unavailable';
    code = 'CONNECTION_REFUSED';
    details = { service: 'database' };

  } else if ((error as any).code === 'ENOTFOUND') {
    // DNS/Network errors
    statusCode = 503;
    message = 'External service unavailable';
    code = 'SERVICE_NOT_FOUND';

  } else if ((error as any).code === 'ETIMEDOUT') {
    // Timeout errors
    statusCode = 504;
    message = 'Request timeout';
    code = 'TIMEOUT_ERROR';

  } else {
    // Unknown/unexpected errors
    statusCode = 500;
    message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'Unknown error occurred';
    code = 'UNKNOWN_ERROR';
  }

  // Generate unique request ID if not present
  const requestId = req.headers['x-request-id'] as string || generateRequestId();

  // Track error if needed
  let traceId: string | undefined;
  if (shouldTrack) {
    errorTracker.captureError(error, {
      component: determineComponent(req.path),
      operation: `${req.method} ${req.path}`,
      requestId,
      additionalData: {
        statusCode,
        code,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      }
    }, req).then(id => {
      traceId = id;
    }).catch(trackingError => {
      logger.error('Failed to track error', trackingError);
    });
  }

  // Enhanced logging with context
  const logContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: sanitizeHeaders(req.headers),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: (req as any).user ? {
      id: (req as any).user.id,
      email: (req as any).user.email,
      role: (req as any).user.role
    } : null,
    response: {
      statusCode,
      code
    },
    requestId,
    traceId
  };

  // Log with appropriate level
  if (statusCode >= 500) {
    logger.error('Server error occurred', logContext);
  } else if (statusCode >= 400) {
    logger.warn('Client error occurred', logContext);
  } else {
    logger.info('Error handled', logContext);
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      requestId,
      ...(traceId && { traceId })
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Add meta information
  errorResponse.meta = {
    statusCode,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Request-ID': requestId
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
  details?: any;
} {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'Resource already exists',
        code: 'DUPLICATE_ERROR',
        details: {
          constraint: error.meta?.target,
          fields: error.meta?.target
        }
      };

    case 'P2025':
      return {
        statusCode: 404,
        message: 'Resource not found',
        code: 'NOT_FOUND',
        details: { cause: error.meta?.cause }
      };

    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint failed',
        code: 'FOREIGN_KEY_ERROR',
        details: { field: error.meta?.field_name }
      };

    case 'P2014':
      return {
        statusCode: 400,
        message: 'Invalid relation',
        code: 'INVALID_RELATION',
        details: { relation: error.meta?.relation_name }
      };

    case 'P2004':
      return {
        statusCode: 400,
        message: 'Constraint violation',
        code: 'CONSTRAINT_VIOLATION',
        details: { constraint: error.meta?.constraint }
      };

    case 'P2021':
      return {
        statusCode: 500,
        message: 'Table does not exist',
        code: 'TABLE_NOT_EXISTS',
        details: { table: error.meta?.table }
      };

    case 'P2022':
      return {
        statusCode: 500,
        message: 'Column does not exist',
        code: 'COLUMN_NOT_EXISTS',
        details: { column: error.meta?.column }
      };

    default:
      return {
        statusCode: 500,
        message: 'Database error',
        code: 'DATABASE_ERROR',
        details: {
          prismaCode: error.code,
          meta: error.meta
        }
      };
  }
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(error: any): {
  statusCode: number;
  message: string;
  code: string;
  details?: any;
} {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        statusCode: 413,
        message: 'File too large',
        code: 'FILE_TOO_LARGE',
        details: { maxSize: error.limit }
      };

    case 'LIMIT_FILE_COUNT':
      return {
        statusCode: 400,
        message: 'Too many files',
        code: 'TOO_MANY_FILES',
        details: { maxFiles: error.limit }
      };

    case 'LIMIT_UNEXPECTED_FILE':
      return {
        statusCode: 400,
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FILE',
        details: { field: error.field }
      };

    default:
      return {
        statusCode: 400,
        message: 'File upload error',
        code: 'UPLOAD_ERROR',
        details: { multerCode: error.code }
      };
  }
}

/**
 * Determine component from request path
 */
function determineComponent(path: string): string {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length >= 2 && segments[0] === 'api') {
    return segments[1]; // Return the API module (users, products, etc.)
  }
  
  if (segments[0] === 'auth') return 'authentication';
  if (segments[0] === 'health') return 'health';
  
  return 'unknown';
}

/**
 * Sanitize headers for logging
 */
function sanitizeHeaders(headers: any): Record<string, string> {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-access-token'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';
      next(error);
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

/**
 * Request ID middleware
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.set('X-Request-ID', requestId);
  next();
};
