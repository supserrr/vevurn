/**
 * Error Tracking Middleware
 * 
 * Global middleware for capturing and tracking application errors
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorTrackingService } from '../services/ErrorTrackingService';
import { logger } from '../utils/logger';

const errorTracker = ErrorTrackingService.getInstance();

/**
 * Global error handler middleware
 * Captures all unhandled errors in Express routes and middleware
 */
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip if response is already sent
  if (res.headersSent) {
    return next(error);
  }

  // Capture error with full context
  errorTracker.captureError(error, {
    component: 'express-middleware',
    operation: `${req.method} ${req.path}`,
    additionalData: {
      statusCode: error.name === 'ValidationError' ? 400 : 500,
      isOperational: error.name === 'AppError' || error.name === 'ValidationError',
      route: req.route?.path,
      originalUrl: req.originalUrl
    }
  }, req).catch(trackingError => {
    logger.error('Failed to track error', trackingError);
  });

  // Determine response status
  const status = getErrorStatus(error);
  
  // Log error for debugging
  logger.error('Unhandled error in Express', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  res.status(status).json({
    success: false,
    error: getPublicErrorMessage(error, status),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

/**
 * Performance monitoring middleware
 * Tracks slow requests and performance issues
 */
export const performanceTracker = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Override the end method to capture timing
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      // Track performance issues
      if (duration > threshold) {
        errorTracker.capturePerformanceIssue(
          `${req.method} ${req.path}`,
          duration,
          threshold,
          {
            component: 'performance-monitor',
            operation: 'slow-request',
            additionalData: {
              statusCode: res.statusCode,
              contentLength: res.get('Content-Length'),
              route: req.route?.path,
              query: req.query,
              params: req.params
            }
          }
        ).catch(trackingError => {
          logger.error('Failed to track performance issue', trackingError);
        });
      }

      // Log all requests for monitoring
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Call original end method
      return originalEnd.apply(this, args as any);
    };

    next();
  };
};

/**
 * Async error wrapper
 * Wraps async route handlers to automatically catch and forward errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Captures validation errors with structured information
 */
export const validationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.name === 'ValidationError' || error.type === 'validation') {
    errorTracker.captureError(error, {
      component: 'validation',
      operation: `${req.method} ${req.path}`,
      additionalData: {
        validationErrors: error.details || error.errors,
        requestBody: req.body,
        requestQuery: req.query
      }
    }, req).catch(trackingError => {
      logger.error('Failed to track validation error', trackingError);
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details || error.errors || error.message
    });
    return;
  }

  next(error);
};

/**
 * Database error handler
 * Captures database-specific errors
 */
export const databaseErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDatabaseError = 
    error.code?.startsWith('P') || // Prisma errors
    error.name === 'PrismaClientKnownRequestError' ||
    error.name === 'PrismaClientUnknownRequestError' ||
    error.name === 'DatabaseError';

  if (isDatabaseError) {
    const dbError = new Error('Database operation failed');
    dbError.name = 'DatabaseError';

    errorTracker.captureError(dbError, {
      component: 'database',
      operation: `${req.method} ${req.path}`,
      additionalData: {
        originalError: error.message,
        errorCode: error.code,
        prismaErrorCode: error.code,
        constraint: error.meta?.target,
        modelName: error.meta?.modelName
      }
    }, req).catch(trackingError => {
      logger.error('Failed to track database error', trackingError);
    });

    res.status(500).json({
      success: false,
      error: 'Database operation failed',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
    return;
  }

  next(error);
};

/**
 * Authentication error handler
 * Captures authentication and authorization errors
 */
export const authErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isAuthError = 
    error.name === 'UnauthorizedError' ||
    error.name === 'AuthenticationError' ||
    error.name === 'ForbiddenError' ||
    error.statusCode === 401 ||
    error.statusCode === 403;

  if (isAuthError) {
    const authError = new Error('Authentication failed');
    authError.name = 'SecurityError';

    errorTracker.captureError(authError, {
      component: 'authentication',
      operation: `${req.method} ${req.path}`,
      additionalData: {
        originalError: error.message,
        statusCode: error.statusCode,
        authHeader: req.get('Authorization') ? '[PRESENT]' : '[MISSING]',
        attemptedAccess: req.originalUrl
      }
    }, req).catch(trackingError => {
      logger.error('Failed to track auth error', trackingError);
    });

    const status = error.statusCode === 403 ? 403 : 401;
    res.status(status).json({
      success: false,
      error: status === 401 ? 'Authentication required' : 'Access denied'
    });
    return;
  }

  next(error);
};

/**
 * Rate limit error handler
 * Captures rate limiting violations
 */
export const rateLimitErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.name === 'RateLimitError' || error.statusCode === 429) {
    const rateLimitError = new Error('Rate limit exceeded');
    rateLimitError.name = 'SecurityError';

    errorTracker.captureError(rateLimitError, {
      component: 'rate-limiting',
      operation: `${req.method} ${req.path}`,
      additionalData: {
        limit: error.limit,
        remaining: error.remaining,
        resetTime: error.resetTime,
        clientId: req.ip
      }
    }, req).catch(trackingError => {
      logger.error('Failed to track rate limit error', trackingError);
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: error.resetTime
    });
    return;
  }

  next(error);
};

// Helper functions
function getErrorStatus(error: any): number {
  if (error.statusCode && typeof error.statusCode === 'number') {
    return error.statusCode;
  }

  switch (error.name) {
    case 'ValidationError':
    case 'CastError':
      return 400;
    case 'UnauthorizedError':
    case 'AuthenticationError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'RateLimitError':
      return 429;
    default:
      return 500;
  }
}

function getPublicErrorMessage(error: any, status: number): string {
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    switch (status) {
      case 400:
        return 'Bad request';
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 409:
        return 'Conflict';
      case 429:
        return 'Too many requests';
      default:
        return 'Internal server error';
    }
  }

  // In development, show actual error message
  return error.message || 'An error occurred';
}

/**
 * Setup comprehensive error tracking middleware
 * Apply all error handling middleware in the correct order
 */
export const setupErrorTracking = (app: any) => {
  // Performance monitoring (should be early in middleware chain)
  app.use(performanceTracker(1000)); // 1 second threshold

  // Specific error handlers (should be before global handler)
  app.use(validationErrorHandler);
  app.use(databaseErrorHandler);
  app.use(authErrorHandler);
  app.use(rateLimitErrorHandler);
  
  // Global error handler (should be last)
  app.use(globalErrorHandler);

  // Unhandled promise rejection handler
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = new Error(`Unhandled Promise Rejection: ${reason}`);
    error.name = 'UnhandledRejection';

    errorTracker.captureError(error, {
      component: 'process',
      operation: 'unhandled-promise-rejection',
      additionalData: {
        reason: reason?.toString(),
        promise: promise?.toString()
      }
    }).catch(trackingError => {
      logger.error('Failed to track unhandled rejection', trackingError);
    });

    logger.error('Unhandled Promise Rejection', { reason, promise });
  });

  // Uncaught exception handler
  process.on('uncaughtException', (error: Error) => {
    errorTracker.captureError(error, {
      component: 'process',
      operation: 'uncaught-exception',
      additionalData: {
        fatal: true,
        processWillExit: true
      }
    }).catch(trackingError => {
      logger.error('Failed to track uncaught exception', trackingError);
    });

    logger.error('Uncaught Exception', error);
    
    // Give some time for error tracking to complete, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  logger.info('Error tracking middleware setup completed');
};
