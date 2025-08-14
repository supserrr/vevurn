import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware using Zod schemas
 */
export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      const customError = new Error('Validation failed') as any;
      customError.statusCode = 400;
      customError.isValidationError = true;
      customError.validationErrors = validationErrors;
      
      throw customError;
    }
    throw error;
  }
}

/**
 * Express middleware for request body validation
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validateRequest(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Express middleware for query parameters validation
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = validateRequest(schema, req.query) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Express middleware for URL parameters validation
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = validateRequest(schema, req.params) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}
