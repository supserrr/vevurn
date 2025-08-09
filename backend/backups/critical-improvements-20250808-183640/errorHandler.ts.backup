import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { 
  PrismaClientKnownRequestError, 
  PrismaClientUnknownRequestError, 
  PrismaClientRustPanicError, 
  PrismaClientInitializationError, 
  PrismaClientValidationError 
} from '@prisma/client/runtime/library';
// import logger from '../config/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (code) this.code = code;
    this.details = details;

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

    // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different error types
  if (error.name === 'ApiError' && 'statusCode' in error) {
    // Custom API errors
    const apiError = error as any;
    statusCode = apiError.statusCode;
    message = apiError.message;
    code = apiError.code;
    details = apiError.details;
    
  } else if (error instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));
    
  } else if (error instanceof PrismaClientKnownRequestError) {
    // Prisma database errors
    const prismaError = error as PrismaClientKnownRequestError;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ERROR';
        details = {
          constraint: prismaError.meta?.target,
          fields: prismaError.meta?.target
        };
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
        details = {
          field: prismaError.meta?.field_name
        };
        break;
        
      case 'P2014':
        statusCode = 400;
        message = 'Invalid relation';
        code = 'INVALID_RELATION';
        break;
        
      default:
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
        details = {
          code: prismaError.code,
          meta: prismaError.meta
        };
    }
    
  } else if (error instanceof PrismaClientUnknownRequestError) {
    // Unknown Prisma errors
    statusCode = 500;
    message = 'Unknown database error';
    code = 'DATABASE_UNKNOWN_ERROR';
    
  } else if (error instanceof PrismaClientRustPanicError) {
    // Prisma Rust panic errors
    statusCode = 500;
    message = 'Database connection error';
    code = 'DATABASE_CONNECTION_ERROR';
    
  } else if (error instanceof PrismaClientInitializationError) {
    // Prisma initialization errors
    statusCode = 500;
    message = 'Database initialization error';
    code = 'DATABASE_INIT_ERROR';
    
  } else if (error instanceof PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    message = 'Database validation error';
    code = 'DATABASE_VALIDATION_ERROR';
    
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
    
  } else if (error.name === 'TokenExpiredError') {
    // Expired JWT
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
    
  } else if (error.name === 'NotBeforeError') {
    // JWT not active yet
    statusCode = 401;
    message = 'Authentication token not active';
    code = 'TOKEN_NOT_ACTIVE';
    
  } else if (error.message.includes('ECONNREFUSED')) {
    // Database connection errors
    statusCode = 503;
    message = 'Database connection failed';
    code = 'DATABASE_CONNECTION_FAILED';
    
  } else if (error.message.includes('ENOTFOUND')) {
    // DNS/Network errors
    statusCode = 503;
    message = 'Service unavailable';
    code = 'SERVICE_UNAVAILABLE';
    
  } else if (error.name === 'ValidationError') {
    // Mongoose/other validation errors
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_FAILED';
    details = error.message;
    
  } else if (error.name === 'CastError') {
    // Type casting errors
    statusCode = 400;
    message = 'Invalid data format';
    code = 'INVALID_FORMAT';
    
  } else if ((error as ApiError).statusCode) {
    // Any error with statusCode property
    statusCode = (error as ApiError).statusCode!;
    message = error.message;
    code = (error as ApiError).code || 'CUSTOM_ERROR';
    details = (error as ApiError).details;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = null;
  }

  // Error response format
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalMessage: error.message
      })
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  return res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};
