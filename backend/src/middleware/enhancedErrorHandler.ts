import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Enhanced error handling middleware with monitoring integration
 */
export const enhancedErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error properties
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const isOperational = err.isOperational || false;

  // Log error details
  const errorDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
    message,
    stack: err.stack,
    isOperational,
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server Error:', errorDetails);
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', errorDetails);
  } else {
    logger.info('Request Error:', errorDetails);
  }

  // Determine response format based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: {
      message,
      code: err.code || 'UNKNOWN_ERROR',
      statusCode,
      timestamp: new Date().toISOString()
    },
    // Only include stack trace in development
    ...(isDevelopment && { stack: err.stack }),
    // Include request ID if available
    ...(req.headers['x-request-id'] && { requestId: req.headers['x-request-id'] })
  };

  res.status(statusCode).json(response);
};

/**
 * Create an operational error (expected errors)
 */
export const createOperationalError = (message: string, statusCode = 400, code?: string): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  if (code) {
    error.code = code;
  }
  return error;
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch Promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const error = createOperationalError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );

  logger.warn('Route not found:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: 404,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Global unhandled promise rejection handler
 */
export const setupGlobalErrorHandlers = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    });
    
    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled Promise Rejection - shutting down gracefully');
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack
    });
    
    // Always exit on uncaught exception
    console.error('Uncaught Exception - shutting down');
    process.exit(1);
  });
};

/**
 * Rate limiting error handler
 */
export const rateLimitErrorHandler = (req: Request, res: Response): void => {
  const error = {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: res.get('Retry-After') || '15 minutes'
    }
  };

  logger.warn('Rate limit exceeded:', {
    ip: req.ip,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(429).json(error);
};
