import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/RedisService';
import { logger } from '../utils/logger';

const redis = new RedisService();

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: any;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  skipSuccessfulRequests?: boolean;
}

class RateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: (req: Request) => req.ip || 'unknown',
      skip: () => false,
      skipSuccessfulRequests: false,
      ...options
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip if condition is met
        if (this.options.skip && this.options.skip(req)) {
          return next();
        }

        const key = this.options.keyGenerator!(req);
        const windowMs = this.options.windowMs;
        const maxRequests = this.options.max;

        // Create Redis key with timestamp window
        const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
        const redisKey = `rate_limit:${key}:${windowStart}`;

        // Get current count
        const current = await redis.get(redisKey);
        const count = current ? parseInt(current) : 0;

        // Check if limit exceeded
        if (count >= maxRequests) {
          const retryAfter = Math.ceil(windowMs / 1000);
          
          // Set rate limit headers
          res.set({
            'RateLimit-Limit': maxRequests.toString(),
            'RateLimit-Remaining': '0',
            'RateLimit-Reset': (windowStart + windowMs).toString(),
            'Retry-After': retryAfter.toString()
          });

          logger.warn('Rate limit exceeded', {
            key,
            count,
            maxRequests,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.status(429).json(this.options.message);
          return;
        }

        // Increment counter
        const multi = redis.getClient().multi();
        multi.incr(redisKey);
        multi.expire(redisKey, Math.ceil(windowMs / 1000));
        await multi.exec();

        // Set rate limit headers
        res.set({
          'RateLimit-Limit': maxRequests.toString(),
          'RateLimit-Remaining': (maxRequests - count - 1).toString(),
          'RateLimit-Reset': (windowStart + windowMs).toString()
        });

        // Handle skipSuccessfulRequests
        if (this.options.skipSuccessfulRequests) {
          res.on('finish', async () => {
            if (res.statusCode < 400) {
              // Decrement counter for successful requests
              try {
                await redis.getClient().decr(redisKey);
              } catch (error) {
                logger.error('Error decrementing rate limit counter:', error);
              }
            }
          });
        }

        next();
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Continue without rate limiting if Redis fails
        next();
      }
    };
  }
}

// General API rate limiter
export const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    }
  },
  keyGenerator: (req: Request): string => {
    // Use user ID if authenticated, otherwise IP
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`;
  },
  skip: (req: Request): boolean => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ping';
  }
}).middleware();

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many attempts, please try again later.',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    }
  },
  keyGenerator: (req: Request): string => {
    const userId = (req as any).user?.id;
    return userId ? `strict:user:${userId}` : `strict:ip:${req.ip || 'unknown'}`;
  }
}).middleware();

// Auth rate limiter for login attempts
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many login attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    }
  },
  keyGenerator: (req: Request): string => {
    // Use email + IP for login attempts
    const email = req.body?.email || req.body?.username;
    return email ? `auth:${email}:${req.ip}` : `auth:ip:${req.ip || 'unknown'}`;
  },
  skipSuccessfulRequests: true // Don't count successful login attempts
}).middleware();

// Sales rate limiter to prevent rapid sales creation
export const salesRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 sales per minute per user
  message: {
    success: false,
    error: {
      message: 'Sales creation rate limit exceeded, please slow down.',
      code: 'SALES_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute'
    }
  },
  keyGenerator: (req: Request): string => {
    const userId = (req as any).user?.id || req.ip;
    return `sales:${userId}`;
  },
  skip: (req: Request): boolean => {
    // Only apply to POST requests (sale creation)
    return req.method !== 'POST';
  }
}).middleware();
