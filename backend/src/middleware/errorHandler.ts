import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Production-optimized logger
const logger = {
  error: (message: string, data?: any) => {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...data,
    };
    
    if (process.env.NODE_ENV === 'production') {
      // In production, log as JSON for better parsing by log aggregators
      console.error(JSON.stringify(logData));
    } else {
      console.error(`[ERROR] ${message}`, data);
    }
  }
};

export interface ApiError extends Error {
  statusCode?: number;
  code?: string | undefined;
  details?: any;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code?: string | undefined;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string, 
    statusCode: number = 500, 
    code?: string | undefined, 
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: any = null;

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error for monitoring with enhanced context
  logger.error('API Error occurred', {
    requestId,
    message: error.message,
    stack: isProduction ? undefined : error.stack, // Don't log stack traces in production logs
    url: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
    errorType: error.constructor.name,
    statusCode,
  });

  // Handle specific error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));
  } else if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ERROR';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        code = 'FOREIGN_KEY_ERROR';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
    }
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Production-optimized response headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Request-ID': requestId,
  });

  // Response payload - sanitized for production
  const errorResponse: any = {
    success: false,
    error: {
      message: isProduction && statusCode >= 500 ? 'Internal Server Error' : message,
      code,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Include additional details only in development or for client errors (4xx)
  if (!isProduction || statusCode < 500) {
    if (details) {
      errorResponse.error.details = details;
    }
  }

  // Include stack trace only in development
  if (!isProduction && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Log to monitoring service in production (placeholder for actual service integration)
  if (isProduction && statusCode >= 500) {
    // Here you would typically send to a monitoring service like Sentry, DataDog, etc.
    console.error(`[PRODUCTION_ERROR] ${requestId}: ${error.message}`);
  }

  return res.status(statusCode).json(errorResponse);
};
