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
    max: isProduction ? 200 : 1000, // Increased baseline: 200 in production, 1000 in development
    storage,
    modelName: 'rateLimit', // Matches our Prisma schema
    customRules: getCustomRules(isProduction)
  }
}

/**
 * Get custom rate limiting rules based on environment
 */
function getCustomRules(isProduction: boolean): Record<string, { window: number; max: number }> {
  // Much more generous multiplier for development vs production
  const multiplier = isProduction ? 1 : 5 // Increased from 3 to 5 for development
  
  return {
    // Authentication endpoints - MUCH more generous limits
    "/sign-in/email": {
      window: 60, // Changed from 10 seconds to 60 seconds
      max: 10 * multiplier, // 10 attempts per minute (was 3 per 10 seconds)
    },
    "/sign-up/email": {
      window: 300, // 5 minutes
      max: 10 * multiplier, // 10 attempts per 5 minutes (was 3 per hour)
    },
    "/reset-password": {
      window: 300, // 5 minutes  
      max: 5 * multiplier, // Increased from 3 to 5
    },
    "/forgot-password": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // Increased from 3 to 5
    },
    "/verify-email": {
      window: 300, // 5 minutes
      max: 10 * multiplier, // Increased from 5 to 10
    },
    
    // Two-factor authentication - more generous
    "/two-factor/verify": {
      window: 60, // Changed from 10 seconds to 60 seconds
      max: 10 * multiplier, // Increased from 3 to 10
    },
    "/two-factor/setup": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // Increased from 3 to 5
    },
    "/two-factor/disable": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // Increased from 2 to 5
    },
    
    // Social OAuth endpoints - VERY generous limits for OAuth debugging
    "/sign-in/social/*": {
      window: 60, // 1 minute
      max: 30 * multiplier, // 30 attempts per minute (was 10)
    },
    "/callback/*": {
      window: 60, // 1 minute  
      max: 50 * multiplier, // 50 attempts per minute (was 20 per 5 minutes)
    },
    "/oauth2callback": {
      window: 60, // Add specific OAuth2 callback rule
      max: 50 * multiplier, // 50 OAuth2 callbacks per minute
    },
    
    // Account management - more generous
    "/link-social": {
      window: 300, // 5 minutes
      max: 10 * multiplier, // Increased from 5 to 10
    },
    "/unlink-account": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // Increased from 3 to 5
    },
    
    // Password operations - more generous
    "/change-password": {
      window: 300, // 5 minutes
      max: 5 * multiplier, // Increased from 3 to 5
    },
    
    // Session management - very generous for POS operations
    "/sign-out": {
      window: 60,
      max: 50 * multiplier, // Increased from 20 to 50 (frequent staff changes)
    },
    "/session": {
      window: 60,
      max: isProduction ? 500 : 1000, // Increased from 300 to 500 in production
    },
    "/refresh": {
      window: 60,
      max: 200 * multiplier, // Increased from 100 to 200
    },
    
    // Account information - generous limits
    "/user": {
      window: 60,
      max: 100 * multiplier, // Increased from 50 to 100
    },
    "/list-sessions": {
      window: 300, // 5 minutes
      max: 20 * multiplier, // Increased from 10 to 20
    },
    
    // Admin endpoints - generous limits
    "/admin/*": {
      window: 60,
      max: 50 * multiplier, // Increased from 30 to 50
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
