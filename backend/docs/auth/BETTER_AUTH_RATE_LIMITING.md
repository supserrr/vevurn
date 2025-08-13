# Enhanced Rate Limiting - Better Auth Implementation

## Overview
This document covers our comprehensive rate limiting implementation using Better Auth patterns, including backend configuration, frontend error handling, and user experience enhancements.

## Backend Implementation

### Enhanced Rate Limiting Configuration
**File**: `/backend/src/lib/auth.ts`

Our rate limiting follows Better Auth best practices with custom rules for different endpoint types:

```typescript
rateLimit: {
  enabled: true, // Always enabled (Better Auth handles dev/prod)
  window: 60, // 1 minute default window
  max: 100, // 100 requests per minute baseline
  storage: "secondary-storage", // Redis for distributed rate limiting
  customRules: {
    // Authentication - strict limits
    "/sign-in/email": { window: 10, max: 3 },
    "/sign-up/email": { window: 300, max: 3 },
    
    // Two-factor authentication
    "/two-factor/verify": { window: 10, max: 3 },
    
    // Social OAuth - moderate limits  
    "/sign-in/social/*": { window: 60, max: 10 },
    
    // Session management - operational needs
    "/session": { window: 60, max: 300 },
    "/sign-out": { window: 60, max: 20 },
  }
}
```

### IP Address Detection
Enhanced IP address detection for accurate rate limiting across different deployment environments:

```typescript
advanced: {
  ipAddress: {
    ipAddressHeaders: [
      "cf-connecting-ip", // Cloudflare
      "x-forwarded-for", // Standard proxy (Better Auth default)
      "x-real-ip", // Nginx
      "x-client-ip", // Alternative header
      "forwarded-for", // RFC 7239
      "forwarded" // RFC 7239 standard
    ],
  },
}
```

### Rate Limit Categories

#### 🔐 **Authentication Endpoints** (Strict)
- Sign-in: 3 attempts per 10 seconds
- Sign-up: 3 attempts per 5 minutes  
- Password reset: 3 attempts per 5 minutes
- Email verification: 5 attempts per 5 minutes

#### 🛡️ **Security Operations** (Very Strict)
- Two-factor verification: 3 attempts per 10 seconds
- Password changes: 3 attempts per 5 minutes
- Account unlinking: 3 attempts per 5 minutes

#### 🌐 **OAuth Operations** (Moderate)
- OAuth sign-in: 10 attempts per minute
- OAuth callbacks: 20 attempts per 5 minutes
- Account linking: 5 attempts per 5 minutes

#### 💼 **POS Operations** (Generous)
- Session checks: 300 requests per minute
- User info: 50 requests per minute
- Sign-out: 20 requests per minute

#### 👨‍💼 **Admin Operations** (Controlled)
- Admin endpoints: 30 requests per minute

## Frontend Implementation

### Global Error Handling
**File**: `/frontend/lib/auth-client.ts`

Enhanced auth client with automatic rate limit detection:

```typescript
fetchOptions: {
  onError: async (ctx) => {
    // Handle rate limiting errors (429 status code)
    if (ctx.response && ctx.response.status === 429) {
      const retryAfter = ctx.response.headers.get("X-Retry-After");
      const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
      
      // Dispatch global rate limit event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auth-rate-limited', { 
          detail: { retryAfter: retrySeconds } 
        });
        window.dispatchEvent(event);
      }
      
      return; // Prevent default error handling
    }
    
    // Handle other errors normally
  },
}
```

### Rate Limit Utilities
**File**: `/frontend/lib/rate-limit-utils.ts`

Comprehensive rate limiting utilities:

#### Rate Limit Error Handling
```typescript
handleRateLimit(error: RateLimitError) // User-friendly notifications
extractRateLimitInfo(response: Response) // Extract retry info
createRateLimitAwareFetch(endpoint) // Per-request handling
```

#### Rate Limit Tracker
```typescript
const rateLimitTracker = new RateLimitTracker()

rateLimitTracker.setLimit(endpoint, retryAfter)
rateLimitTracker.isLimited(endpoint)
rateLimitTracker.getRetryAfter(endpoint)
```

#### React Hook for Auth Operations
```typescript
const { checkRateLimit, handleAuthError } = useRateLimitedAuth()

// Check before making request
if (!checkRateLimit('/sign-in/email')) return

// Handle errors after request
const handled = handleAuthError(error, '/sign-in/email')
```

### Global Rate Limit Handling
**File**: `/frontend/hooks/useRateLimit.ts`

#### Global Event Handler
```typescript
useGlobalRateLimitHandler() // Add to root layout
```

#### Component-Level Handling  
```typescript
const { isRateLimited, retryAfter } = useRateLimitStatus('/sign-in/email')
```

## User Experience

### Rate Limit Notifications
- **Friendly Messages**: "Too many attempts. Please wait 30 seconds."
- **Duration-Based**: Shows retry time in seconds/minutes
- **Endpoint-Specific**: "Please wait before trying to sign in again"
- **Action Buttons**: Dismiss option for better UX

### UI State Management
- **Button Disabling**: Automatic disabling during rate limit
- **Progress Indicators**: Countdown timers for retry
- **Visual Feedback**: Clear indication of rate limit status

## Security Features

### Rate Limit Storage
- **Redis Storage**: Distributed rate limiting across server instances
- **Persistence**: Rate limits survive server restarts
- **Scalability**: Handles high-traffic POS environments

### IP Detection
- **Multi-Header Support**: Works with various proxy configurations
- **Cloudflare Support**: Detects real IP behind Cloudflare
- **Nginx Support**: Handles Nginx proxy headers
- **Fallback Headers**: Multiple backup IP detection methods

### Attack Prevention
- **Brute Force Protection**: Strict limits on authentication attempts
- **Account Enumeration**: Limited sign-up and password reset attempts
- **Session Hijacking**: High limits for operational needs, strict for security

## Monitoring and Debugging

### Rate Limit Headers
Better Auth automatically returns these headers on rate limit:
- `X-Retry-After`: Seconds until next attempt allowed

### Logging
Rate limit events are logged for monitoring:
```typescript
console.warn(`Rate limit exceeded. Retry after ${retrySeconds} seconds`);
```

### Health Monitoring
Rate limiting status is included in health checks and monitoring.

## Configuration Examples

### Development Configuration
```typescript
rateLimit: {
  enabled: false, // Disabled for development convenience
  // OR enable with generous limits
  enabled: true,
  window: 60,
  max: 1000, // Very high limit for development
}
```

### Production Configuration
```typescript
rateLimit: {
  enabled: true,
  window: 60,
  max: 100,
  storage: "secondary-storage", // Redis required
  customRules: {
    // Strict production limits
    "/sign-in/email": { window: 10, max: 3 },
  }
}
```

### High-Traffic POS Configuration
```typescript
rateLimit: {
  enabled: true,
  window: 60,
  max: 500, // Higher baseline for busy POS
  storage: "secondary-storage",
  customRules: {
    "/session": { window: 60, max: 1000 }, // Very high for POS operations
    "/sign-in/email": { window: 10, max: 5 }, // Slightly more lenient
  }
}
```

## Deployment Considerations

### Environment Variables
No additional environment variables needed - rate limiting uses existing Redis configuration.

### Redis Requirements
- Redis instance required for distributed rate limiting
- Connection configured via existing `REDIS_URL`

### Proxy Configuration
Ensure proper IP forwarding headers are configured:
- **Cloudflare**: `cf-connecting-ip` header
- **Nginx**: `x-real-ip` and `x-forwarded-for` headers  
- **Load Balancers**: `x-forwarded-for` header

## Testing

### Rate Limit Testing
Test rate limiting in different scenarios:

```bash
# Test sign-in rate limiting (3 attempts per 10 seconds)
curl -X POST http://localhost:8000/api/auth/sign-in/email \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -H "Content-Type: application/json"

# Check for 429 status and X-Retry-After header
```

### Frontend Testing
```typescript
// Simulate rate limit in component
const testRateLimit = async () => {
  try {
    await signIn.email({ email: 'test@example.com', password: 'wrong' })
  } catch (error) {
    // Should trigger rate limit handling
  }
}
```

## Troubleshooting

### Common Issues

**1. Rate Limits Not Working**
- Check Redis connection
- Verify `storage: "secondary-storage"` is configured
- Ensure IP headers are properly configured

**2. Too Strict Rate Limits**
- Adjust `max` values for specific endpoints
- Consider different limits for development vs production
- Monitor actual usage patterns

**3. Rate Limits Too Lenient**  
- Review security requirements
- Implement stricter custom rules
- Monitor for abuse patterns

**4. IP Detection Issues**
- Verify proxy headers are forwarded correctly
- Check `ipAddressHeaders` configuration
- Test with different deployment environments

### Debug Logging
Enable debug logging to troubleshoot rate limiting:

```typescript
// Add to auth client for debugging
fetchOptions: {
  onError: async (ctx) => {
    console.log('Rate limit headers:', ctx.response.headers.get('X-Retry-After'))
    console.log('Request IP:', ctx.request.headers.get('x-forwarded-for'))
  }
}
```

## Best Practices

1. **Security First**: Strict limits for authentication and security operations
2. **Operational Needs**: Generous limits for POS operational endpoints  
3. **User Experience**: Clear feedback and graceful degradation
4. **Monitoring**: Log and monitor rate limit violations
5. **Testing**: Test rate limits in staging environments
6. **Documentation**: Keep rate limit policies documented and updated

## Implementation Status

### ✅ Completed
- Enhanced backend rate limiting configuration
- Multi-header IP detection for various deployment environments
- Comprehensive frontend error handling and user feedback
- Rate limit utilities and tracking system
- React hooks for component integration
- Global event system for rate limit notifications

### 🚀 Production Ready
- Redis-based distributed rate limiting
- Security-focused endpoint protection
- POS-optimized operational limits
- Comprehensive error handling and user experience

This rate limiting implementation provides enterprise-grade protection while maintaining excellent user experience for POS operations.
