# Backend Middleware Documentation

This document describes all the middleware components available in the backend API, designed for a comprehensive Point of Sale (POS) system with enterprise-grade security and auditing features.

## Overview

The middleware stack provides:
- **Security**: CORS, rate limiting, authentication, authorization
- **Error Handling**: Comprehensive error processing with logging
- **Validation**: Request validation using Zod schemas
- **Auditing**: API request logging for compliance
- **Response Formatting**: Consistent API response structure

## Middleware Components

### 1. Error Middleware (`error.middleware.ts`)

Comprehensive error handling middleware that processes different types of errors and returns consistent error responses.

```typescript
import { errorMiddleware, createError, asyncHandler } from './middlewares';
```

**Features:**
- Zod validation error handling
- Custom application error processing
- Generic error handling with development/production modes
- Error logging with request context
- Structured error responses

**Usage:**
```typescript
app.use(errorMiddleware);

// Create custom errors
throw createError('Resource not found', 404, 'NOT_FOUND');
```

### 2. CORS Middleware (`cors.middleware.ts`)

Cross-Origin Resource Sharing configuration for frontend integration.

```typescript
import { corsMiddleware } from './middlewares';
```

**Features:**
- Environment-based allowed origins
- Credential support for authentication
- Comprehensive headers and methods
- Exposed headers for pagination
- 24-hour preflight cache

**Configuration:**
```typescript
app.use(corsMiddleware);
```

### 3. Rate Limiting (`rate-limit.middleware.ts`)

Prevents API abuse with configurable rate limiting.

```typescript
import { rateLimitMiddleware, authRateLimitMiddleware } from './middlewares';
```

**Two Types:**
- **General Rate Limiting**: 100 requests per 15 minutes (production)
- **Auth Rate Limiting**: 5 requests per 15 minutes (production)

**Features:**
- IP-based rate limiting
- Custom rate limit messages
- Health check exclusion
- Rate limit hit logging

**Usage:**
```typescript
app.use('/api', rateLimitMiddleware);
app.use('/api/auth', authRateLimitMiddleware);
```

### 4. Authentication Middleware (`auth.middleware.ts`)

Better Auth integration for session-based authentication with role-based authorization.

```typescript
import { 
  authMiddleware, 
  requireRole, 
  requireAdmin, 
  requireManager,
  type AuthenticatedRequest 
} from './middlewares';
```

**Features:**
- Session validation using Better Auth
- User active status checking
- Role-based authorization
- Request enhancement with user data

**Usage:**
```typescript
// Require authentication
app.use('/api/protected', authMiddleware);

// Role-based access
app.get('/api/admin', requireAdmin, controller);
app.get('/api/manager', requireManager, controller);
app.get('/api/custom', requireRole(['ADMIN', 'MANAGER']), controller);

// In controllers
function handler(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  const userRole = req.user?.role;
}
```

### 5. Audit Middleware (`audit.middleware.ts`)

Comprehensive API request logging for compliance and monitoring.

```typescript
import { auditMiddleware } from './middlewares';
```

**Features:**
- User action tracking
- Request/response logging
- IP address and user agent capture
- Sensitive data sanitization
- Automatic database logging

**Configuration:**
```typescript
app.use('/api', auditMiddleware);
```

**Logged Information:**
- User ID (if authenticated)
- Action type (derived from HTTP method and path)
- Request path and method
- Sanitized request body (passwords removed)
- Client IP address and user agent
- Timestamp

### 6. Validation Middleware (`validation.middleware.ts`)

Zod schema validation for request parameters, query strings, and body.

```typescript
import { validateRequest } from './middlewares';
import { z } from 'zod';
```

**Features:**
- Body, query, and params validation
- Zod schema integration
- Detailed validation error responses
- Type-safe request handling

**Usage:**
```typescript
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE'])
});

app.post('/api/users', 
  validateRequest({ body: createUserSchema }), 
  controller
);
```

## API Response Utility (`utils/response.ts`)

Consistent response formatting across all endpoints.

```typescript
import { ApiResponse } from './middlewares';
```

**Methods:**
- `ApiResponse.success(message, data?, pagination?)` - Success responses
- `ApiResponse.error(message, error?)` - Error responses  
- `ApiResponse.paginated(message, data, page, limit, total)` - Paginated responses

**Usage:**
```typescript
// Success response
res.json(ApiResponse.success('User created', user));

// Error response
res.status(400).json(ApiResponse.error('Invalid input', validationErrors));

// Paginated response
res.json(ApiResponse.paginated('Users retrieved', users, 1, 10, 100));
```

## Integration Example

Complete middleware stack setup:

```typescript
import express from 'express';
import {
  corsMiddleware,
  rateLimitMiddleware,
  authRateLimitMiddleware,
  auditMiddleware,
  authMiddleware,
  requireAdmin,
  validateRequest,
  errorMiddleware
} from './middlewares';

const app = express();

// Basic middleware
app.use(express.json());
app.use(corsMiddleware);

// Rate limiting
app.use('/api', rateLimitMiddleware);
app.use('/api/auth', authRateLimitMiddleware);

// Auditing (before authentication for complete logging)
app.use('/api', auditMiddleware);

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/protected', authMiddleware);
app.use('/api/admin', authMiddleware, requireAdmin);

// Error handling (must be last)
app.use(errorMiddleware);
```

## Environment Variables

Required environment variables for middleware configuration:

```env
# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window

# Environment
NODE_ENV=development                 # or 'production'
```

## Security Features

### 1. Authentication Security
- Session-based authentication using Better Auth
- Automatic session validation
- User active status verification
- Role-based access control

### 2. Request Security
- CORS protection with configurable origins
- Rate limiting to prevent abuse
- Request validation to prevent injection
- Comprehensive input sanitization

### 3. Audit & Compliance
- Complete API request logging
- User action tracking
- Sensitive data protection
- IP address and user agent logging

### 4. Error Security
- Production error message sanitization
- Stack trace protection in production
- Structured error logging
- No sensitive data in error responses

## Best Practices

### 1. Middleware Order
1. CORS middleware (first)
2. Rate limiting
3. Audit logging
4. Authentication
5. Authorization
6. Route handlers
7. Error handling (last)

### 2. Error Handling
- Always use the asyncHandler wrapper for async functions
- Create custom errors with appropriate status codes
- Log errors with sufficient context
- Return user-friendly error messages

### 3. Authentication
- Use AuthenticatedRequest type for protected routes
- Always check user active status
- Implement role-based access control
- Validate session tokens properly

### 4. Validation
- Validate all input data
- Use Zod schemas for type safety
- Provide clear validation error messages
- Sanitize data before processing

This middleware stack provides enterprise-grade security, comprehensive logging, and consistent error handling for your POS system API.
