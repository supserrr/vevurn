/**
 * React Hook for Global Rate Limit Event Handling
 * 
 * Listens for rate limit events dispatched by the auth client
 * and provides application-wide rate limit notifications
 */

"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface RateLimitEventDetail {
  retryAfter: number
  endpoint?: string
}

/**
 * Hook to handle global rate limit notifications
 * Add this to your root layout or app component
 */
export function useGlobalRateLimitHandler() {
  useEffect(() => {
    const handleRateLimit = (event: CustomEvent<RateLimitEventDetail>) => {
      const { retryAfter } = event.detail
      
      const minutes = Math.ceil(retryAfter / 60)
      const message = retryAfter < 60 
        ? `Too many requests. Please wait ${retryAfter} seconds.`
        : `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''}.`
      
      toast.error(message, {
        duration: Math.min(retryAfter * 1000, 10000),
        description: "Rate limit will reset soon",
        action: {
          label: "Dismiss",
          onClick: () => toast.dismiss()
        }
      })
    }

    // Listen for rate limit events
    window.addEventListener('auth-rate-limited', handleRateLimit as EventListener)
    
    return () => {
      window.removeEventListener('auth-rate-limited', handleRateLimit as EventListener)
    }
  }, [])
}

/**
 * Hook for component-level rate limit handling
 * Use this in individual forms or components that make auth requests
 */
export function useRateLimitStatus(endpoint?: string) {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  
  useEffect(() => {
    const handleRateLimit = (event: CustomEvent<RateLimitEventDetail>) => {
      const { retryAfter: seconds, endpoint: limitedEndpoint } = event.detail
      
      // If endpoint matches or no specific endpoint, apply rate limit
      if (!endpoint || !limitedEndpoint || limitedEndpoint === endpoint) {
        setIsRateLimited(true)
        setRetryAfter(seconds)
        
        // Clear rate limit after the specified time
        setTimeout(() => {
          setIsRateLimited(false)
          setRetryAfter(null)
        }, seconds * 1000)
      }
    }

    window.addEventListener('auth-rate-limited', handleRateLimit as EventListener)
    
    return () => {
      window.removeEventListener('auth-rate-limited', handleRateLimit as EventListener)
    }
  }, [endpoint])
  
  return { isRateLimited, retryAfter }
}
