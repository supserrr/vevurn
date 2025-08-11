/**
 * Rate Limiting Utilities for Better Auth
 * 
 * Handles rate limiting errors and provides user feedback
 * following Better Auth patterns
 */

import { toast } from "sonner"

export interface RateLimitError {
  retryAfter: number // seconds until next attempt allowed
  endpoint?: string // which endpoint was rate limited
  message?: string // custom error message
}

/**
 * Handle rate limit errors with user-friendly feedback
 */
export function handleRateLimit(error: RateLimitError) {
  const { retryAfter, endpoint, message } = error
  
  const minutes = Math.ceil(retryAfter / 60)
  const endpointName = endpoint ? getEndpointDisplayName(endpoint) : 'this action'
  
  let toastMessage = message
  if (!toastMessage) {
    if (retryAfter < 60) {
      toastMessage = `Too many attempts. Please wait ${retryAfter} seconds before trying ${endpointName} again.`
    } else {
      toastMessage = `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying ${endpointName} again.`
    }
  }
  
  toast.error(toastMessage, {
    duration: Math.min(retryAfter * 1000, 10000), // Show for retry duration or max 10s
    description: `Rate limit will reset in ${formatDuration(retryAfter)}`
  })
}

/**
 * Extract rate limit information from Better Auth response
 */
export function extractRateLimitInfo(response: Response, endpoint?: string): RateLimitError | null {
  if (response.status !== 429) return null
  
  const retryAfter = response.headers.get("X-Retry-After")
  if (!retryAfter) return null
  
  return {
    retryAfter: parseInt(retryAfter, 10),
    endpoint,
  }
}

/**
 * Create a rate-limit aware fetch wrapper for individual requests
 */
export function createRateLimitAwareFetch(endpoint?: string) {
  return {
    onError: async (context: any) => {
      const { response } = context;
      
      if (response.status === 429) {
        const rateLimitInfo = extractRateLimitInfo(response, endpoint)
        if (rateLimitInfo) {
          handleRateLimit(rateLimitInfo)
        }
        return // Don't propagate rate limit errors to default error handler
      }
      
      // Let other errors bubble up
      throw context.error
    }
  }
}

/**
 * Get user-friendly display name for endpoints
 */
function getEndpointDisplayName(endpoint: string): string {
  const endpointMap: Record<string, string> = {
    '/sign-in/email': 'signing in',
    '/sign-up/email': 'signing up',
    '/reset-password': 'password reset',
    '/verify-email': 'email verification',
    '/change-password': 'password change',
    '/two-factor/verify': '2FA verification',
    '/two-factor/setup': '2FA setup',
    '/link-social': 'account linking',
    '/unlink-account': 'account unlinking',
    '/forgot-password': 'password recovery',
  }
  
  return endpointMap[endpoint] || 'this action'
}

/**
 * Format duration in a human-readable way
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }
  
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
  
  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours > 1 ? 's' : ''}`
}

/**
 * Rate limit status tracker for UI components
 */
export class RateLimitTracker {
  private limits: Map<string, { resetAt: number; retryAfter: number }> = new Map()
  
  /**
   * Set rate limit for an endpoint
   */
  setLimit(endpoint: string, retryAfter: number) {
    const resetAt = Date.now() + (retryAfter * 1000)
    this.limits.set(endpoint, { resetAt, retryAfter })
  }
  
  /**
   * Check if endpoint is currently rate limited
   */
  isLimited(endpoint: string): boolean {
    const limit = this.limits.get(endpoint)
    if (!limit) return false
    
    if (Date.now() >= limit.resetAt) {
      this.limits.delete(endpoint)
      return false
    }
    
    return true
  }
  
  /**
   * Get remaining seconds until endpoint is available
   */
  getRetryAfter(endpoint: string): number | null {
    const limit = this.limits.get(endpoint)
    if (!limit) return null
    
    const remaining = Math.ceil((limit.resetAt - Date.now()) / 1000)
    return remaining > 0 ? remaining : null
  }
  
  /**
   * Clear all rate limits (for testing or manual reset)
   */
  clear() {
    this.limits.clear()
  }
}

// Global rate limit tracker instance
export const rateLimitTracker = new RateLimitTracker()

/**
 * React hook for rate limit aware authentication operations
 */
export function useRateLimitedAuth() {
  const checkRateLimit = (endpoint: string): boolean => {
    const isLimited = rateLimitTracker.isLimited(endpoint)
    
    if (isLimited) {
      const retryAfter = rateLimitTracker.getRetryAfter(endpoint)
      if (retryAfter) {
        handleRateLimit({ retryAfter, endpoint })
      }
    }
    
    return !isLimited
  }
  
  const handleAuthError = (error: any, endpoint?: string) => {
    if (error?.response?.status === 429 && endpoint) {
      const rateLimitInfo = extractRateLimitInfo(error.response, endpoint)
      if (rateLimitInfo) {
        rateLimitTracker.setLimit(endpoint, rateLimitInfo.retryAfter)
        handleRateLimit(rateLimitInfo)
        return true // Error was handled
      }
    }
    return false // Error was not handled
  }
  
  return { checkRateLimit, handleAuthError }
}
