import { Request, Response, NextFunction } from 'express';
import { CustomError, ValidationError } from '../utils/errors';
import { AuthenticatedRequest } from './better-auth.middleware';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Global error handler', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Handle custom errors
  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.errorCode,
    });
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'VALIDATION_ERROR',
      details: error.validationErrors,
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(error as any, res);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: (error as any).errors,
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED',
    });
  }

  // Handle multer errors (file upload)
  if (error.name === 'MulterError') {
    return handleMulterError(error as any, res);
  }

  // Handle syntax errors
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      error: 'INVALID_JSON',
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
};

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: any, res: Response) {
  const { code, meta } = error;

  switch (code) {
    case 'P2002': // Unique constraint violation
      const field = meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        error: 'DUPLICATE_ENTRY',
      });

    case 'P2025': // Record not found
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        error: 'NOT_FOUND',
      });

    case 'P2003': // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to related record',
        error: 'FOREIGN_KEY_CONSTRAINT',
      });

    case 'P2014': // Required relation violation
      return res.status(400).json({
        success: false,
        message: 'Required related record is missing',
        error: 'REQUIRED_RELATION_MISSING',
      });

    default:
      logger.error('Unhandled Prisma error', { code, meta });
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: 'DATABASE_ERROR',
      });
  }
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(error: any, res: Response) {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        error: 'FILE_TOO_LARGE',
      });

    case 'LIMIT_FILE_COUNT':
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: 'TOO_MANY_FILES',
      });

    case 'LIMIT_FIELD_KEY':
      return res.status(400).json({
        success: false,
        message: 'Field name too long',
        error: 'FIELD_NAME_TOO_LONG',
      });

    case 'LIMIT_FIELD_VALUE':
      return res.status(400).json({
        success: false,
        message: 'Field value too long',
        error: 'FIELD_VALUE_TOO_LONG',
      });

    case 'LIMIT_FIELD_COUNT':
      return res.status(400).json({
        success: false,
        message: 'Too many fields',
        error: 'TOO_MANY_FIELDS',
      });

    case 'LIMIT_UNEXPECTED_FILE':
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
        error: 'UNEXPECTED_FILE_FIELD',
      });

    default:
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: 'UPLOAD_ERROR',
      });
  }
}

/**
 * Handle async errors in routes
 */
export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
