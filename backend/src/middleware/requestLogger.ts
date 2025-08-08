import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Simple request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent');
  const userId = (req as any).user?.id || 'anonymous';

  // Log request start
  logger.http(`${method} ${url} - Started`, {
    method,
    url,
    ip,
    userAgent,
    userId,
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length') || '0';

    // Log response
    logger.http(`${method} ${url} - ${statusCode} ${duration}ms`, {
      method,
      url,
      statusCode,
      duration,
      contentLength,
      ip,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// Correlation ID middleware
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || 
                       req.headers['x-request-id'] as string || 
                       `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

// Request timing middleware
export const timingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) { // Log requests taking more than 1 second
      logger.warn(`Slow request detected: ${req.method} ${req.url} - ${duration}ms`, {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id
      });
    }
  });
  
  next();
};

// Request size limit middleware
export const requestSizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      error: {
        message: 'Request entity too large',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: `${maxSize / (1024 * 1024)}MB`
      }
    });
    return;
  }
  
  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};
