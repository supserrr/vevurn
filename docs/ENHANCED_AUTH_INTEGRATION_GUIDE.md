# Enhanced Authentication Integration Guide

## Overview

The Enhanced Authentication system provides enterprise-grade security features on top of your existing Better Auth implementation. It creates enhanced JWT tokens specifically for POS operations with additional security features.

## Architecture

```
Better Auth (Web Sessions) → Enhanced Auth (POS JWT Tokens)
                              ↓
                         Enhanced Security Features:
                         • Device Fingerprinting
                         • Session Management
                         • Token Blacklisting  
                         • Audit Logging
                         • Role-based Authorization
```

## Integration Steps

### 1. Install Required Dependencies

```bash
npm install express-rate-limit zod bcryptjs
npm install --save-dev @types/bcryptjs
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# JWT Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
DEVICE_SALT=your-device-fingerprint-salt

# Enhanced Auth Settings
ENHANCED_AUTH_ENABLED=true
MAX_SESSIONS_PER_USER=5
```

### 3. Mount the Routes

In your main application file:

```typescript
// app.ts or index.ts
import enhancedAuthRoutes from './routes/enhancedAuth';

// Mount enhanced auth routes
app.use('/api/enhanced-auth', enhancedAuthRoutes);
```

### 4. Frontend Integration Flow

#### Step 1: Regular Better Auth Login
```typescript
// Frontend login with Better Auth
const authResult = await signIn.email({
  email: 'user@example.com',
  password: 'password123'
});

if (authResult.data?.session) {
  // Step 2: Create enhanced JWT for POS operations
  const enhancedAuth = await fetch('/api/enhanced-auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      accessToken: authResult.data.session.token, // Better Auth token
      rememberMe: true
    })
  });

  const result = await enhancedAuth.json();
  
  if (result.success) {
    // Store enhanced JWT for POS operations
    localStorage.setItem('posToken', result.data.accessToken);
    
    // Now ready for POS operations with enhanced security
    console.log('Enhanced authentication successful!');
    console.log('User:', result.data.user);
    console.log('Security Info:', result.data.sessionInfo);
  }
}
```

#### Step 2: Using Enhanced JWT for POS Operations
```typescript
// Use enhanced JWT for authenticated POS requests
const response = await fetch('/api/sales/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('posToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(saleData)
});
```

### 5. Protect Existing Routes

```typescript
// Protect existing POS routes with enhanced auth
import { enhancedAuthMiddleware, managerOrAbove } from './middleware/enhancedAuth';

// Protect sales routes
app.use('/api/sales', enhancedAuthMiddleware);

// Protect admin routes  
app.use('/api/admin', enhancedAuthMiddleware, managerOrAbove);

// Protect reports
app.use('/api/reports', enhancedAuthMiddleware);
```

## API Endpoints

### Authentication
- **POST** `/api/enhanced-auth/login` - Create enhanced JWT from Better Auth session
- **POST** `/api/enhanced-auth/refresh` - Refresh enhanced tokens
- **GET** `/api/enhanced-auth/validate` - Validate current enhanced session

### Session Management
- **POST** `/api/enhanced-auth/logout` - Logout from current device
- **POST** `/api/enhanced-auth/logout-all` - Logout from all devices
- **GET** `/api/enhanced-auth/sessions` - List active sessions
- **DELETE** `/api/enhanced-auth/sessions/:sessionId` - Revoke specific session

### User & Security
- **GET** `/api/enhanced-auth/profile` - Get user profile with security info
- **GET** `/api/enhanced-auth/security-events` - Get user's security events

## Security Features

### Device Fingerprinting
- Each token is bound to device characteristics
- Automatic detection of suspicious device changes
- Session invalidation on device mismatch

### Rate Limiting
- Login attempts: 10 per 15 minutes per IP
- Token refresh: 15 per 5 minutes per IP
- Prevents brute force attacks

### Session Management
- Maximum 5 concurrent sessions per user
- Real-time session monitoring
- Individual session revocation capability

### Audit Logging
All security events are logged:
- Enhanced login attempts (success/failure)
- Token refresh events
- Session management actions
- Device fingerprint mismatches

## Example Frontend Components

### Login Component
```typescript
// components/EnhancedLogin.tsx
import { useState } from 'react';
import { signIn } from '@/lib/auth-client';

export function EnhancedLogin() {
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    setLoading(true);
    
    try {
      // Step 1: Better Auth login
      const authResult = await signIn.email({ email, password });
      
      if (authResult.data?.session) {
        // Step 2: Enhanced authentication
        const response = await fetch('/api/enhanced-auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            accessToken: authResult.data.session.token,
            rememberMe
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Store enhanced JWT
          localStorage.setItem('posToken', result.data.accessToken);
          
          // Redirect to POS dashboard
          window.location.href = '/dashboard';
        } else {
          throw new Error(result.error.message);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  
  // Render login form...
}
```

### Session Manager Component
```typescript
// components/SessionManager.tsx
import { useEffect, useState } from 'react';

interface Session {
  sessionId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  isCurrentSession: boolean;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  
  useEffect(() => {
    fetchSessions();
  }, []);
  
  const fetchSessions = async () => {
    const response = await fetch('/api/enhanced-auth/sessions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('posToken')}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      setSessions(result.sessions);
    }
  };
  
  const revokeSession = async (sessionId: string) => {
    await fetch(`/api/enhanced-auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('posToken')}`
      }
    });
    
    fetchSessions(); // Refresh list
  };
  
  return (
    <div className="session-manager">
      <h3>Active Sessions</h3>
      {sessions.map(session => (
        <div key={session.sessionId} className="session-item">
          <div>
            <strong>{session.isCurrentSession ? 'Current Device' : 'Other Device'}</strong>
            <p>IP: {session.ipAddress}</p>
            <p>Last Active: {new Date(session.lastActivity).toLocaleString()}</p>
          </div>
          {!session.isCurrentSession && (
            <button onClick={() => revokeSession(session.sessionId)}>
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

The enhanced auth system returns structured errors:

```typescript
// Error response format
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "ERROR_CODE",
    timestamp: "2024-01-15T10:30:00.000Z"
  }
}

// Common error codes:
// AUTH_RATE_LIMIT_EXCEEDED
// USER_NOT_FOUND  
// ACCOUNT_DEACTIVATED
// REFRESH_TOKEN_REQUIRED
// INVALID_REFRESH_TOKEN
// AUTH_REQUIRED
```

## Monitoring & Maintenance

### View Security Events
```bash
# Check recent security events
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/enhanced-auth/security-events

# Check user profile with security info
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/enhanced-auth/profile
```

### Database Queries
```sql
-- View recent authentication events
SELECT * FROM "AuditLog" 
WHERE action IN ('enhanced_login_success', 'enhanced_login_failed', 'LOGOUT')
ORDER BY "createdAt" DESC
LIMIT 50;

-- View active sessions by user
SELECT "newValues"->>'deviceFingerprint' as device,
       "newValues"->>'ipAddress' as ip,
       "createdAt"
FROM "AuditLog"
WHERE action = 'enhanced_login_success' 
  AND "userId" = 'user-id-here'
ORDER BY "createdAt" DESC;
```

## Production Deployment

1. **Set secure environment variables**
2. **Enable HTTPS** for secure cookies
3. **Configure rate limiting** based on your traffic
4. **Set up monitoring** for failed authentication attempts
5. **Review audit logs** regularly for suspicious activity

The enhanced authentication system is now ready to provide enterprise-grade security for your Vevurn POS system!
