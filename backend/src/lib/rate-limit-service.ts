import { redis } from './redis-storage'

/**
 * Rate Limiting Service for Vevurn POS
 * 
 * Provides utilities for custom rate limiting beyond Better Auth's built-in limits.
 * Useful for POS-specific operations like transaction processing, inventory updates, etc.
 */

export interface RateLimitConfig {
  key: string
  window: number // seconds
  max: number
  identifier?: string // IP, user ID, etc.
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  total?: number
}

export class RateLimitService {
  private keyPrefix = 'vevurn:rate-limit:'

  /**
   * Check and increment rate limit for a given key
   */
  async checkRateLimit(config: RateLimitConfig): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    if (!redis) {
      // If Redis is not available, allow all requests
      console.warn('Redis not available, skipping rate limiting')
      return {
        allowed: true,
        remaining: config.max,
        resetTime: Date.now() + (config.window * 1000)
      }
    }

    const { key, window, max, identifier } = config
    const rateLimitKey = identifier ? `${key}:${identifier}` : key
    
    try {
      if (!redis) {
        // If Redis is not available, allow all requests
        console.warn('Redis not available, skipping rate limiting')
        return {
          allowed: true,
          remaining: max,
          resetTime: Date.now() + (window * 1000)
        }
      }
      
      const current = Date.now()
      const windowStart = current - (window * 1000)
      
      // Use Redis sorted set to track requests in time window
      const pipe = redis.pipeline()
      
      // Remove old entries outside the window
      pipe.zremrangebyscore(rateLimitKey, 0, windowStart)
      
      // Count current entries in window
      pipe.zcard(rateLimitKey)
      
      // Add current request
      pipe.zadd(rateLimitKey, current, `${current}-${Math.random()}`)
      
      // Set expiration for cleanup
      pipe.expire(rateLimitKey, window + 1)
      
      const results = await pipe.exec()
      
      if (!results) {
        throw new Error('Redis pipeline failed')
      }
      
      const currentCount = (results[1][1] as number) + 1 // +1 for the request we just added
      const allowed = currentCount <= max
      const remaining = Math.max(0, max - currentCount)
      const resetTime = current + (window * 1000)
      
            // If not allowed, remove the request we just added
      if (!allowed && redis) {
        await redis.zremrangebyrank(rateLimitKey, -1, -1)
      }
      
      return {
        allowed,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open - allow the request if rate limiting fails
      return {
        allowed: true,
        remaining: max - 1,
        resetTime: Date.now() + (window * 1000)
      }
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(config: Omit<RateLimitConfig, 'max'> & { max: number }): Promise<RateLimitResult> {
    const { key, window, max, identifier } = config
    const rateLimitKey = this.buildKey(key, identifier)
    
    try {
      if (!redis) {
        return {
          allowed: true,
          remaining: max,
          resetTime: Date.now() + (window * 1000)
        }
      }
      
      const current = Date.now()
      const windowStart = current - (window * 1000)
      
      // Clean old entries and count current
      await redis.zremrangebyscore(rateLimitKey, 0, windowStart)
      const currentCount = await redis.zcard(rateLimitKey)
      
      const allowed = currentCount < max
      const remaining = Math.max(0, max - currentCount)
      const resetTime = current + (window * 1000)
      
      return {
        allowed,
        remaining,
        resetTime,
        total: max
      }
    } catch (error) {
      console.error('Rate limit status check failed:', error)
      return {
        allowed: true,
        remaining: max,
        resetTime: Date.now() + (window * 1000),
        total: max
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(key: string, identifier?: string): Promise<void> {
    const rateLimitKey = this.buildKey(key, identifier)
    try {
      if (!redis) {
        return
      }
      await redis.del(rateLimitKey)
    } catch (error) {
      console.error('Rate limit reset failed:', error)
    }
  }

  /**
   * Get rate limit info for monitoring/debugging
   */
  async getRateLimitInfo(key: string, identifier?: string): Promise<{
    key: string
    requestCount: number
    oldestRequest: number | null
    newestRequest: number | null
  }> {
    const rateLimitKey = this.buildKey(key, identifier)
    
    try {
      if (!redis) {
        return {
          key: rateLimitKey,
          requestCount: 0,
          oldestRequest: null,
          newestRequest: null
        }
      }
      
      const requestCount = await redis.zcard(rateLimitKey)
      let oldestRequest = null
      let newestRequest = null
      
      if (requestCount > 0) {
        const oldest = await redis.zrange(rateLimitKey, 0, 0, 'WITHSCORES')
        const newest = await redis.zrange(rateLimitKey, -1, -1, 'WITHSCORES')
        
        oldestRequest = oldest.length > 1 ? parseInt(oldest[1]) : null
        newestRequest = newest.length > 1 ? parseInt(newest[1]) : null
      }
      
      return {
        key: rateLimitKey,
        requestCount,
        oldestRequest,
        newestRequest
      }
    } catch (error) {
      console.error('Rate limit info fetch failed:', error)
      return {
        key: rateLimitKey,
        requestCount: 0,
        oldestRequest: null,
        newestRequest: null
      }
    }
  }

  private buildKey(key: string, identifier?: string): string {
    return `${this.keyPrefix}${key}${identifier ? `:${identifier}` : ''}`
  }
}

// Pre-configured rate limits for common POS operations
export const POSRateLimits = {
  // Transaction processing
  PROCESS_SALE: { window: 60, max: 30 }, // 30 transactions per minute per user
  REFUND_TRANSACTION: { window: 300, max: 5 }, // 5 refunds per 5 minutes per user
  VOID_TRANSACTION: { window: 300, max: 3 }, // 3 voids per 5 minutes per user
  
  // Inventory operations
  UPDATE_INVENTORY: { window: 60, max: 50 }, // 50 inventory updates per minute
  BULK_INVENTORY_IMPORT: { window: 3600, max: 3 }, // 3 bulk imports per hour
  
  // Report generation
  GENERATE_REPORT: { window: 300, max: 10 }, // 10 reports per 5 minutes
  EXPORT_DATA: { window: 3600, max: 5 }, // 5 data exports per hour
  
  // User management
  CREATE_USER: { window: 3600, max: 10 }, // 10 user creations per hour
  UPDATE_USER_PERMISSIONS: { window: 300, max: 20 }, // 20 permission updates per 5 minutes
  
  // System operations
  BACKUP_OPERATION: { window: 3600, max: 2 }, // 2 backups per hour
  SYNC_OPERATION: { window: 60, max: 10 }, // 10 sync operations per minute
} as const

// Export singleton instance
export const rateLimitService = new RateLimitService()

// Express middleware for custom rate limiting
export const createRateLimitMiddleware = (
  rateLimitKey: string,
  config: { window: number; max: number },
  getIdentifier?: (req: any) => string
) => {
  return async (req: any, res: any, next: any) => {
    const identifier = getIdentifier ? getIdentifier(req) : req.ip
    
    const result = await rateLimitService.checkRateLimit({
      key: rateLimitKey,
      window: config.window,
      max: config.max,
      identifier
    })
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      'X-RateLimit-Window': config.window.toString(),
    })
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      res.set('X-Retry-After', retryAfter.toString())
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      })
    }
    
    next()
  }
}
