// =============================================
// RATE LIMITING SERVICE
// =============================================

import { db } from '../database/database.js';
import { ErrorService } from '../monitoring/errorService.js';

export class RateLimitService {
  constructor() {
    this.redis = db.redis;
    this.limits = {
      momo_payment: { requests: 10, window: 60, blockDuration: 300 },
      api_general: { requests: 100, window: 60, blockDuration: 60 },
      auth_attempts: { requests: 5, window: 300, blockDuration: 900 },
      search_queries: { requests: 50, window: 60, blockDuration: 60 }
    };
  }

  async checkRateLimit(identifier, resource, context = {}) {
    try {
      const config = this.limits[resource];
      if (!config) return { allowed: true };

      const key = `rate_limit:${resource}:${identifier}`;
      const blockKey = `blocked:${resource}:${identifier}`;

      // Check if currently blocked
      const blocked = await this.redis.get(blockKey);
      if (blocked) {
        await this.logRateLimitViolation(identifier, resource, 'blocked', context);
        return {
          allowed: false,
          blocked: true,
          blockedUntil: new Date(parseInt(blocked)),
          reason: 'Rate limit exceeded - currently blocked'
        };
      }

      // Get current count
      const current = await this.redis.get(key);
      const count = parseInt(current) || 0;

      if (count >= config.requests) {
        // Rate limit exceeded
        const blockUntil = Date.now() + (config.blockDuration * 1000);
        await this.redis.setex(blockKey, config.blockDuration, blockUntil.toString());

        await this.logRateLimitViolation(identifier, resource, 'exceeded', context);
        await this.updateRateLimitRecord(identifier, resource, config, count + 1, blockUntil);

        return {
          allowed: false,
          blocked: true,
          blockedUntil: new Date(blockUntil),
          reason: 'Rate limit exceeded'
        };
      }

      // Increment counter
      if (count === 0) {
        await this.redis.setex(key, config.window, '1');
      } else {
        await this.redis.incr(key);
      }

      await this.updateRateLimitRecord(identifier, resource, config, count + 1);

      return {
        allowed: true,
        remaining: config.requests - count - 1,
        resetAt: new Date(Date.now() + (config.window * 1000))
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      await ErrorService.logError(error, {
        component: 'rate_limiting',
        operation: 'check_limit',
        context: { identifier, resource, ...context }
      });
      
      return { allowed: true, error: true };
    }
  }

  async updateRateLimitRecord(identifier, resource, config, currentCount, blockedUntil = null) {
    try {
      const identifierType = this.getIdentifierType(identifier);
      
      await db.prisma.rateLimits.upsert({
        where: {
          identifier_type_identifier_value_resource: {
            identifier_type: identifierType,
            identifier_value: identifier,
            resource: resource
          }
        },
        create: {
          identifier_type: identifierType,
          identifier_value: identifier,
          resource: resource,
          limit_type: 'requests_per_minute',
          max_requests: config.requests,
          window_seconds: config.window,
          current_count: currentCount,
          window_start: new Date(),
          blocked_until: blockedUntil ? new Date(blockedUntil) : null,
          violation_count: blockedUntil ? 1 : 0
        },
        update: {
          current_count: currentCount,
          blocked_until: blockedUntil ? new Date(blockedUntil) : null,
          violation_count: blockedUntil ? { increment: 1 } : undefined,
          updated_at: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update rate limit record:', error);
    }
  }

  async logRateLimitViolation(identifier, resource, violationType, context) {
    try {
      await db.prisma.securityEvents.create({
        data: {
          event_type: 'rate_limit_exceeded',
          severity: violationType === 'blocked' ? 'high' : 'medium',
          staff_id: context.userId,
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
          session_id: context.sessionId,
          endpoint: context.endpoint,
          method: context.method,
          detection_method: 'rate_limiting',
          confidence_score: 1.0,
          action_taken: violationType === 'blocked' ? 'blocked' : 'logged',
          auto_resolved: false
        }
      });
    } catch (error) {
      console.error('Failed to log rate limit violation:', error);
    }
  }

  getIdentifierType(identifier) {
    if (identifier.includes('@')) return 'email';
    if (/^\+?\d+$/.test(identifier)) return 'phone';
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(identifier)) return 'ip';
    return 'user_id';
  }

  // Express middleware
  createMiddleware(resource) {
    return async (req, res, next) => {
      try {
        const identifier = this.getRequestIdentifier(req);
        const context = {
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          endpoint: req.path,
          method: req.method
        };

        const result = await this.checkRateLimit(identifier, resource, context);

        if (!result.allowed) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: result.reason,
            blockedUntil: result.blockedUntil?.toISOString(),
            retryAfter: result.blockedUntil ? Math.ceil((result.blockedUntil.getTime() - Date.now()) / 1000) : null
          });
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.limits[resource].requests,
          'X-RateLimit-Remaining': result.remaining || 0,
          'X-RateLimit-Reset': result.resetAt?.toISOString() || ''
        });

        next();
      } catch (error) {
        console.error('Rate limiting middleware error:', error);
        next();
      }
    };
  }

  getRequestIdentifier(req) {
    return req.user?.id || req.ip || 'anonymous';
  }
}

export const rateLimitService = new RateLimitService();
