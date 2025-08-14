import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General rate limiting
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req: Request) => {
    return req.path === '/health' || req.path === '/api/health';
  },
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

// Stricter rate limiting for authentication endpoints
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 attempts per 15 minutes in production
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});
