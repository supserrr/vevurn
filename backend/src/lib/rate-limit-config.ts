/**
 * Rate Limiting Configuration Manager
 * 
 * Provides flexible rate limiting configuration with support for:
 * - Redis (primary for production)
 * - Database (fallback for development or Redis unavailability)
 * - Memory (development only)
 */

import { config } from '../config/environment.js'

export interface RateLimitConfig {
  enabled: boolean
  window: number
  max: number
  storage: 'secondary-storage' | 'database' | 'memory'
  modelName?: string
  customRules: Record<string, { window: number; max: number }>
}

/**
 * Get rate limiting configuration based on environment and Redis availability
 */
export function getRateLimitConfig(): RateLimitConfig {
  const isProduction = config.NODE_ENV === 'production'
  const hasRedis = !!config.REDIS_URL
  
  // Determine storage backend
  let storage: 'secondary-storage' | 'database' | 'memory' = 'memory'
  
  if (isProduction) {
    // Production: Prefer Redis, fallback to database
    storage = hasRedis ? 'secondary-storage' : 'database'
  } else {
    // Development: Prefer Redis if available, otherwise use memory
    storage = hasRedis ? 'secondary-storage' : 'memory'
  }
  
  console.log(`🛡️ Rate Limiting: Using ${storage} storage (Redis available: ${hasRedis})`)
  
  return {
    enabled: true, // Always enabled (Better Auth handles dev/prod)
    window: 60, // 1 minute window (Better Auth default)
    max: isProduction ? 100 : 1000, // More generous in development
    storage,
    modelName: 'rateLimit', // Matches our Prisma schema
    customRules: getCustomRules(isProduction)
  }
}

/**
 * Get custom rate limiting rules based on environment
 */
function getCustomRules(isProduction: boolean): Record<string, { window: number; max: number }> {
  // Base multiplier for development vs production
  const multiplier = isProduction ? 1 : 3 // More generous in development
  
  return {
    // Authentication endpoints - strict limits following Better Auth patterns
    "/sign-in/email": {
      window: 10, // 10 seconds (aligned with Better Auth defaults)
      max: 3 * multiplier, // 3 login attempts per 10 seconds per IP
    },
    "/sign-up/email": {
      window: 300, // 5 minutes
      max: 3 * multiplier, // Only 3 signup attempts per 5 minutes
    },
    "/reset-password": {
      window: 300, // 5 minutes  
      max: 3 * multiplier, // Only 3 password reset requests per 5 minutes
    },
    "/forgot-password": {
      window: 300, // 5 minutes
      max: 3 * multiplier, // 3 forgot password requests per 5 minutes
    },
    "/verify-email": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // 5 verification attempts per 5 minutes
    },
    
    // Two-factor authentication (Better Auth plugin compatible)
    "/two-factor/verify": {
      window: 10, // 10 seconds (Better Auth plugin default)
      max: 3 * multiplier, // 3 verification attempts per 10 seconds
    },
    "/two-factor/setup": {
      window: 300, // 5 minutes
      max: 3 * multiplier, // 3 setup attempts per 5 minutes
    },
    "/two-factor/disable": {
      window: 300, // 5 minutes
      max: 2 * multiplier, // 2 disable attempts per 5 minutes (security)
    },
    
    // Social OAuth endpoints - moderate limits
    "/sign-in/social/*": {
      window: 60,
      max: 10 * multiplier, // 10 OAuth attempts per minute
    },
    "/callback/*": {
      window: 300, // 5 minutes
      max: 20 * multiplier, // Allow OAuth callbacks with retries
    },
    
    // Account management - careful limits
    "/link-social": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // 5 link attempts per 5 minutes
    },
    "/unlink-account": {
      window: 300, // 5 minutes
      max: 3 * multiplier, // 3 unlink attempts per 5 minutes (security sensitive)
    },
    
    // Password operations - security sensitive
    "/change-password": {
      window: 300, // 5 minutes
      max: 3 * multiplier, // Only 3 password changes per 5 minutes
    },
    
    // Session management - operational needs
    "/sign-out": {
      window: 60,
      max: 20 * multiplier, // Allow frequent sign-outs (shift changes in POS)
    },
    "/session": {
      window: 60,
      max: isProduction ? 300 : 1000, // Very high limit for POS operations
    },
    "/refresh": {
      window: 60,
      max: 100 * multiplier, // Allow frequent session refreshes
    },
    
    // Account information - moderate limits
    "/user": {
      window: 60,
      max: 50 * multiplier, // User info requests during POS operations
    },
    "/list-sessions": {
      window: 300, // 5 minutes
      max: 10 * multiplier, // 10 session list requests per 5 minutes
    },
    
    // Admin endpoints - controlled limits
    "/admin/*": {
      window: 60,
      max: 30 * multiplier, // Moderate limit for admin operations
    },
  }
}

/**
 * Validate rate limiting configuration
 */
export function validateRateLimitConfig(rateLimitConfig: RateLimitConfig): boolean {
  try {
    // Basic validation
    if (rateLimitConfig.window <= 0 || rateLimitConfig.max <= 0) {
      console.warn('⚠️ Invalid rate limit configuration: window and max must be positive')
      return false
    }
    
    // Storage validation
    if (rateLimitConfig.storage === 'secondary-storage' && !config.REDIS_URL) {
      console.warn('⚠️ Secondary storage requested but Redis not configured, falling back to database')
      return false
    }
    
    // Custom rules validation
    for (const [path, rule] of Object.entries(rateLimitConfig.customRules)) {
      if (rule.window <= 0 || rule.max <= 0) {
        console.warn(`⚠️ Invalid rate limit rule for ${path}: window and max must be positive`)
        return false
      }
    }
    
    console.log('✅ Rate limiting configuration validated successfully')
    return true
  } catch (error) {
    console.error('❌ Rate limiting configuration validation failed:', error)
    return false
  }
}

/**
 * Get Better Auth compatible rate limit configuration
 */
export function getBetterAuthRateLimitConfig() {
  const rateLimitConfig = getRateLimitConfig()
  
  if (!validateRateLimitConfig(rateLimitConfig)) {
    console.warn('⚠️ Using fallback rate limit configuration')
    return {
      enabled: true,
      window: 60,
      max: 100,
      storage: 'memory' as const
    }
  }
  
  return {
    enabled: rateLimitConfig.enabled,
    window: rateLimitConfig.window,
    max: rateLimitConfig.max,
    storage: rateLimitConfig.storage,
    ...(rateLimitConfig.storage === 'database' && { modelName: rateLimitConfig.modelName }),
    customRules: rateLimitConfig.customRules
  }
}
