/**
 * Example: Rate Limit Aware Sign In Form
 * 
 * Demonstrates how to implement rate limiting awareness in authentication forms
 * following Better Auth patterns
 */

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/lib/auth-client'
import { useRateLimitStatus } from '@/hooks/useRateLimit'
import { useRateLimitedAuth } from '@/lib/rate-limit-utils'
import { toast } from 'sonner'

export default function RateLimitAwareSignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Track rate limit status for sign-in endpoint
  const { isRateLimited, retryAfter } = useRateLimitStatus('/sign-in/email')
  
  // Get rate limit utilities
  const { checkRateLimit, handleAuthError } = useRateLimitedAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check rate limit before making request
    if (!checkRateLimit('/sign-in/email')) {
      return // Rate limited, user already notified
    }
    
    setIsLoading(true)
    
    try {
      const result = await signIn.email(
        {
          email,
          password,
        },
        {
          // Per-request error handling with rate limit awareness
          onError: async (ctx) => {
            const handled = handleAuthError(ctx.error, '/sign-in/email')
            if (!handled) {
              // Handle non-rate-limit errors
              toast.error('Sign in failed. Please check your credentials.')
            }
          },
          onSuccess: () => {
            toast.success('Signed in successfully!')
            // Redirect or update UI state
          }
        }
      )
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Calculate if form should be disabled
  const isFormDisabled = isLoading || isRateLimited
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isFormDisabled}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isFormDisabled}
          required
        />
      </div>
      
      <Button
        type="submit"
        disabled={isFormDisabled}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Signing in...
          </>
        ) : isRateLimited ? (
          <>
            Rate limited - Try again in {retryAfter}s
          </>
        ) : (
          'Sign In'
        )}
      </Button>
      
      {/* Rate limit status indicator */}
      {isRateLimited && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Too many sign-in attempts. Please wait {retryAfter} seconds before trying again.
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">
        Rate limited to 3 attempts per 10 seconds for security.
      </div>
    </form>
  )
}

/**
 * Alternative: Simple rate limit handling with fetchOptions
 */
export function SimpleRateLimitSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await signIn.email(
        { email, password },
        {
          onError: async (ctx: any) => {
            if (ctx.response.status === 429) {
              const retryAfter = ctx.response.headers.get("X-Retry-After")
              const seconds = retryAfter ? parseInt(retryAfter, 10) : 60
              
              toast.error(`Too many attempts. Please wait ${seconds} seconds.`, {
                duration: seconds * 1000
              })
              return // Don't propagate rate limit errors
            }
            
            // Handle other errors
            toast.error('Sign in failed. Please try again.')
            throw ctx.error
          }
        }
      )
      
      toast.success('Signed in successfully!')
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}
