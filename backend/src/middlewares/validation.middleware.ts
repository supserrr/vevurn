import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/response';

export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }
      
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json(
          ApiResponse.error('Validation failed', validationErrors)
        );
      }
      
      next(error);
    }
  };
};

// Simplified validation middleware for easier usage
export const validateBody = (schema: ZodSchema) => {
  return validateRequest({ body: schema });
};

export const validateQuery = (schema: ZodSchema) => {
  return validateRequest({ query: schema });
};

export const validateParams = (schema: ZodSchema) => {
  return validateRequest({ params: schema });
};
