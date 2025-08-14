import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error as AppError;

  // Log error
  logger.error('Error occurred:', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Prisma errors
  if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate entry found';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong!';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default AppError;
