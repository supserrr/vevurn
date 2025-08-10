# Enhanced Authentication Middleware System

This document describes the comprehensive enhanced authentication middleware system implemented for the Vevurn POS system.

## Overview

The enhanced authentication middleware provides enterprise-grade security features including:

- **JWT Token Authentication** with secure token management
- **Device Fingerprinting** for enhanced security
- **Session Management** with concurrent session limits
- **Token Blacklisting** to invalidate compromised tokens
- **Role-Based Authorization** with multiple permission levels
- **Audit Logging** for security monitoring
- **Session Management Endpoints** for user control

## Files

### Core Middleware
- **`/backend/src/middleware/enhancedAuth.ts`** - Main authentication middleware system

### Test Routes
- **`/backend/src/routes/enhanced-auth-test.ts`** - Demonstration routes showing all features

### Supporting Services
- **`/backend/src/services/JwtSecurityService.ts`** - JWT security service with enhanced features

## Middleware Functions

### Core Authentication

#### `enhancedAuthMiddleware`
Primary authentication middleware that:
- Validates JWT access tokens
- Performs device fingerprinting verification
- Manages session state
- Provides audit logging
- Sets security headers

#### `optionalEnhancedAuthMiddleware`
Similar to `enhancedAuthMiddleware` but continues without error if no token is provided. Useful for routes that work for both authenticated and anonymous users.

### Authorization

#### `enhancedAuthorize(...allowedRoles: string[])`
Role-based authorization middleware factory. Creates middleware that restricts access based on user roles.

#### Role-Based Convenience Functions
- `adminOnly` - Admin access only
- `managerOrAbove` - Manager and Admin access
- `supervisorOrAbove` - Supervisor, Manager, and Admin access
- `staffOrAbove` - Any authenticated user (Cashier, Supervisor, Manager, Admin)

### Session Management

#### `logoutMiddleware`
Handles user logout by:
- Invalidating current session
- Clearing refresh token cookies
- Creating audit log entry

#### `logoutAllMiddleware`
Logs user out from all devices by:
- Invalidating all user sessions
- Clearing refresh token cookies
- Creating audit log entry

#### `getActiveSessionsMiddleware`
Returns list of user's active sessions with masked sensitive information.

#### `revokeSessionMiddleware`
Allows users to revoke specific sessions (except their current session).

## Security Features

### Device Fingerprinting
Each token is bound to a specific device fingerprint generated from:
- User-Agent header
- IP address
- Request headers

### Session Management
- Maximum 5 concurrent sessions per user
- Automatic cleanup of oldest sessions when limit exceeded
- Session activity tracking

### Token Security
- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Token blacklisting for compromised tokens
- Token rotation on refresh

### Audit Logging
All authentication events are logged including:
- Login attempts
- Logout events
- Session revocations
- Authorization failures

### Security Headers
Automatic setting of security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## API Endpoints (Test Routes)

### Authentication
- **POST** `/enhanced-login` - Enhanced login with device fingerprinting
- **POST** `/refresh` - Refresh access tokens

### Protected Routes
- **GET** `/protected` - Basic protected route
- **GET** `/admin-only` - Admin-only access
- **GET** `/manager-plus` - Manager+ access
- **GET** `/supervisor-plus` - Supervisor+ access
- **GET** `/staff-plus` - Any authenticated user
- **GET** `/optional-auth` - Optional authentication

### Session Management
- **POST** `/logout` - Logout from current session
- **POST** `/logout-all` - Logout from all sessions
- **GET** `/sessions` - List active sessions
- **DELETE** `/sessions/:sessionId` - Revoke specific session

### Security Info
- **GET** `/security-info` - Get security information

## Usage Examples

### Basic Authentication
```typescript
import { enhancedAuthMiddleware } from '../middleware/enhancedAuth';

router.get('/protected-route', enhancedAuthMiddleware, (req, res) => {
  // Access req.user and req.sessionInfo
  res.json({ user: req.user });
});
```

### Role-Based Authorization
```typescript
import { enhancedAuthMiddleware, adminOnly } from '../middleware/enhancedAuth';

router.get('/admin-route', enhancedAuthMiddleware, adminOnly, (req, res) => {
  // Only admin users can access this route
  res.json({ message: 'Admin access granted' });
});
```

### Optional Authentication
```typescript
import { optionalEnhancedAuthMiddleware } from '../middleware/enhancedAuth';

router.get('/public-route', optionalEnhancedAuthMiddleware, (req, res) => {
  // Works for both authenticated and anonymous users
  const message = req.user ? 'Authenticated user' : 'Anonymous user';
  res.json({ message });
});
```

### Custom Role Authorization
```typescript
import { enhancedAuthMiddleware, enhancedAuthorize } from '../middleware/enhancedAuth';

router.get('/custom-role', 
  enhancedAuthMiddleware, 
  enhancedAuthorize('MANAGER', 'SUPERVISOR'), 
  (req, res) => {
    // Only managers and supervisors can access
    res.json({ message: 'Manager or supervisor access' });
  }
);
```

## Environment Variables

Ensure these environment variables are set:

```env
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
DEVICE_SALT=your-device-fingerprint-salt
NODE_ENV=production # for secure cookies in production
```

## Error Handling

The middleware provides structured error responses:

```json
{
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Common error codes:
- `AUTH_HEADER_MISSING` - No authorization header
- `TOKEN_MISSING` - No token in header
- `TOKEN_INVALID` - Invalid or malformed token
- `TOKEN_EXPIRED` - Token has expired
- `USER_NOT_FOUND` - User doesn't exist
- `ACCOUNT_DEACTIVATED` - User account is inactive
- `INSUFFICIENT_PERMISSIONS` - User lacks required role

## Integration with Existing System

The middleware integrates with:
- **Prisma ORM** for database operations
- **Redis** for session and token storage
- **Express.js** middleware system
- **Existing user authentication** (Better Auth)

## Testing

Use the test routes in `/backend/src/routes/enhanced-auth-test.ts` to verify all functionality:

1. **Login** with `/enhanced-login`
2. **Test protected routes** with different role requirements
3. **Manage sessions** with session endpoints
4. **Verify security** with `/security-info`

## Security Considerations

1. **Token Storage**: Access tokens should be stored in memory, refresh tokens in HTTP-only cookies
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your frontend domain
4. **Rate Limiting**: Implement rate limiting on authentication endpoints
5. **Monitoring**: Monitor audit logs for suspicious activity

## Production Deployment

Before deploying to production:

1. Set proper environment variables
2. Configure Redis for session storage
3. Set up audit log monitoring
4. Test all authentication flows
5. Verify role-based access controls
6. Test session management features

This enhanced authentication system provides enterprise-grade security while maintaining ease of use and integration with existing systems.
