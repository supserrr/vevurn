import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// Global error handling middleware
export const errorMiddleware = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error, res);
  }

  // Handle custom app errors
  if ('statusCode' in error && error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.code || 'APP_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Handle generic errors
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    }),
  });
};

// Handle Prisma database errors
function handlePrismaError(error: PrismaClientKnownRequestError, res: Response) {
  let statusCode = 500;
  let message = 'Database error occurred';
  let errorCode = 'DATABASE_ERROR';

  switch (error.code) {
    case 'P2002':
      statusCode = 409;
      message = `Duplicate value for ${error.meta?.target || 'field'}`;
      errorCode = 'DUPLICATE_ERROR';
      break;
    case 'P2014':
      statusCode = 400;
      message = 'Invalid ID provided';
      errorCode = 'INVALID_ID';
      break;
    case 'P2003':
      statusCode = 400;
      message = 'Foreign key constraint failed';
      errorCode = 'FOREIGN_KEY_ERROR';
      break;
    case 'P2025':
      statusCode = 404;
      message = 'Record not found';
      errorCode = 'NOT_FOUND';
      break;
    default:
      if (process.env.NODE_ENV === 'development') {
        message = error.message;
      }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: errorCode,
    ...(process.env.NODE_ENV === 'development' && { 
      prismaCode: error.code,
      meta: error.meta 
    }),
  });
}

// Handle Zod validation errors
function handleZodError(error: ZodError, res: Response) {
  const validationErrors = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation error',
    error: 'VALIDATION_ERROR',
    details: validationErrors,
  });
}

// Custom error creator
export function createError(
  message: string,
  statusCode: number = 500,
  code: string = 'APP_ERROR'
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}

// Async error handler wrapper
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
