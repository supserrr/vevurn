import type { Request, Response, NextFunction } from 'express'

/**
 * Rate Limit Error Handler Middleware
 * 
 * Provides standardized rate limit error responses and logging for the POS system
 */

export interface RateLimitErrorContext {
  endpoint: string
  ip: string
  userAgent?: string
  userId?: string
  timestamp: number
  retryAfter: number
}

export const rateLimitErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if this is a rate limit error
  if (err.status === 429 || res.statusCode === 429) {
    const retryAfter = res.get('X-Retry-After') || '60'
    const endpoint = req.originalUrl || req.url
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const userAgent = req.get('User-Agent') || undefined
    const userId = (req as any).user?.id || undefined

    const context: RateLimitErrorContext = {
      endpoint,
      ip,
      userAgent,
      userId,
      timestamp: Date.now(),
      retryAfter: parseInt(retryAfter),
    }

    // Log rate limit violations for monitoring
    console.warn('Rate limit exceeded:', {
      ...context,
      message: 'Request blocked due to rate limiting',
      severity: 'WARNING',
    })

    // Return user-friendly error response
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: getRateLimitMessage(endpoint, parseInt(retryAfter)),
      details: {
        endpoint,
        retryAfter: parseInt(retryAfter),
        limit: res.get('X-RateLimit-Limit'),
        remaining: res.get('X-RateLimit-Remaining'),
        resetTime: res.get('X-RateLimit-Reset'),
      },
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Pass non-rate-limit errors to the next handler
  next(err)
}

/**
 * Get user-friendly rate limit message based on endpoint
 */
const getRateLimitMessage = (endpoint: string, retryAfter: number): string => {
  const minutes = Math.ceil(retryAfter / 60)
  const timeString = retryAfter < 60 ? `${retryAfter} seconds` : `${minutes} minute${minutes > 1 ? 's' : ''}`

  // Authentication endpoints
  if (endpoint.includes('sign-in')) {
    return `Too many login attempts. Please wait ${timeString} before trying again. This helps protect your account security.`
  }
  
  if (endpoint.includes('sign-up')) {
    return `Too many registration attempts. Please wait ${timeString} before creating another account.`
  }
  
  if (endpoint.includes('reset-password')) {
    return `Too many password reset requests. Please wait ${timeString} before requesting another reset.`
  }
  
  if (endpoint.includes('verify-email')) {
    return `Too many verification attempts. Please wait ${timeString} before requesting another verification email.`
  }

  // POS-specific endpoints
  if (endpoint.includes('transaction') || endpoint.includes('sale')) {
    return `Transaction rate limit reached. Please wait ${timeString} before processing more transactions.`
  }
  
  if (endpoint.includes('inventory')) {
    return `Inventory update limit reached. Please wait ${timeString} before making more inventory changes.`
  }
  
  if (endpoint.includes('report')) {
    return `Report generation limit reached. Please wait ${timeString} before generating more reports.`
  }

  // Generic message
  return `Rate limit exceeded. Please wait ${timeString} before making more requests.`
}

/**
 * Client-side rate limit handler utility
 * Use this in your frontend to handle rate limit errors gracefully
 */
export const handleRateLimitError = (error: any) => {
  if (error.response?.status === 429) {
    const data = error.response.data
    const retryAfter = data.details?.retryAfter || 60
    
    return {
      isRateLimit: true,
      message: data.message || 'Rate limit exceeded',
      retryAfter,
      canRetry: true,
      retryAt: new Date(Date.now() + (retryAfter * 1000)),
    }
  }
  
  return {
    isRateLimit: false,
    message: error.message || 'An error occurred',
    canRetry: false,
  }
}

/**
 * Rate limit monitoring utilities
 */
export class RateLimitMonitor {
  private static violations: Map<string, number> = new Map()
  private static resetInterval: NodeJS.Timeout

  static init() {
    // Reset violation counters every hour
    this.resetInterval = setInterval(() => {
      this.violations.clear()
    }, 3600000) // 1 hour
  }

  static recordViolation(ip: string, endpoint: string) {
    const key = `${ip}:${endpoint}`
    const current = this.violations.get(key) || 0
    this.violations.set(key, current + 1)

    // Log excessive violations (possible attack)
    if (current + 1 >= 10) {
      console.error('Excessive rate limit violations detected:', {
        ip,
        endpoint,
        violationCount: current + 1,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL',
        action: 'POSSIBLE_ATTACK_DETECTED',
      })
    }
  }

  static getViolations(): { ip: string; endpoint: string; count: number }[] {
    const result: { ip: string; endpoint: string; count: number }[] = []
    
    this.violations.forEach((count, key) => {
      const [ip, endpoint] = key.split(':')
      result.push({ ip, endpoint, count })
    })
    
    return result.sort((a, b) => b.count - a.count)
  }

  static cleanup() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval)
    }
  }
}

// Initialize monitoring
RateLimitMonitor.init()

/**
 * Express middleware to add rate limit headers to all responses
 */
export const addRateLimitHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Add informational headers about rate limiting
  res.set({
    'X-RateLimit-Policy': 'Per-IP and Per-User limits apply',
    'X-RateLimit-Documentation': 'https://docs.vevurn.com/rate-limits',
  })
  
  next()
}

export default {
  rateLimitErrorHandler,
  handleRateLimitError,
  RateLimitMonitor,
  addRateLimitHeaders,
}
