# Enhanced Error Handler Middleware Documentation

## Overview

The Enhanced Error Handler Middleware provides sophisticated error classification, comprehensive error tracking integration, and standardized error responses for the Vevurn POS System. This enterprise-grade error handling system ensures consistent error responses, comprehensive logging, and seamless integration with the Error Tracking Service.

## Table of Contents

- [Features](#features)
- [Error Classification](#error-classification)
- [Error Types](#error-types)
- [Response Format](#response-format)
- [Integration](#integration)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Features

### Core Capabilities
- **Comprehensive Error Classification**: Handles all application error types with specific classification logic
- **Error Tracking Integration**: Seamless integration with ErrorTrackingService for monitoring and analytics
- **Standardized Responses**: Consistent error response format across the entire application
- **Request ID Generation**: Unique request tracking for debugging and correlation
- **Security Headers**: Automatic security headers in error responses
- **Context Sanitization**: Sensitive data removal from error logs and responses
- **Development/Production Modes**: Different error detail levels based on environment

### Error Handling Types
- Custom Application Errors (AppError hierarchy)
- Database Errors (Prisma-specific handling)
- Validation Errors (Zod schema validation)
- Authentication/Authorization Errors (JWT, session)
- File Upload Errors (Multer)
- Network/Connection Errors
- Timeout Errors
- Unknown/Unexpected Errors

### Security Features
- Sensitive data sanitization in logs
- Security headers in error responses
- Production vs development error details
- Request correlation tracking
- Rate limiting error handling

## Error Classification

### AppError Hierarchy

The middleware uses a custom AppError class hierarchy for application-specific errors:

```typescript
class AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
}

// Specific error types
class ValidationError extends AppError
class AuthenticationError extends AppError
class AuthorizationError extends AppError
class NotFoundError extends AppError
class ConflictError extends AppError
class RateLimitError extends AppError
class ServiceUnavailableError extends AppError
```

### Prisma Error Handling

Specific handling for Prisma database errors:

- **P2002**: Unique constraint failed → Conflict Error (409)
- **P2025**: Record not found → Not Found Error (404)
- **P2003**: Foreign key constraint failed → Validation Error (400)
- **P2019**: Input error → Validation Error (400)
- **P1008**: Timeout → Service Unavailable (503)
- **P1001**: Connection issues → Service Unavailable (503)

### JWT Error Handling

JWT-specific error classification:

- **TokenExpiredError**: Token expired → Authentication Error (401)
- **JsonWebTokenError**: Invalid token → Authentication Error (401)
- **NotBeforeError**: Token not active → Authentication Error (401)

### Multer Error Handling

File upload error classification:

- **LIMIT_FILE_SIZE**: File too large → Validation Error (400)
- **LIMIT_FILE_COUNT**: Too many files → Validation Error (400)
- **LIMIT_FIELD_KEY**: Field name too long → Validation Error (400)
- **LIMIT_FIELD_VALUE**: Field value too long → Validation Error (400)
- **LIMIT_FIELD_COUNT**: Too many fields → Validation Error (400)
- **LIMIT_UNEXPECTED_FILE**: Unexpected file → Validation Error (400)
- **MISSING_FILE**: Required file missing → Validation Error (400)

## Error Types

### Custom Application Errors

#### ValidationError
```typescript
// Usage
throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
// Response: 400 Bad Request
```

#### AuthenticationError
```typescript
// Usage
throw new AuthenticationError('Invalid credentials', 'INVALID_CREDENTIALS');
// Response: 401 Unauthorized
```

#### AuthorizationError
```typescript
// Usage
throw new AuthorizationError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
// Response: 403 Forbidden
```

#### NotFoundError
```typescript
// Usage
throw new NotFoundError('User not found', 'USER_NOT_FOUND');
// Response: 404 Not Found
```

#### ConflictError
```typescript
// Usage
throw new ConflictError('Resource already exists', 'RESOURCE_EXISTS');
// Response: 409 Conflict
```

#### RateLimitError
```typescript
// Usage
throw new RateLimitError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
// Response: 429 Too Many Requests
```

#### ServiceUnavailableError
```typescript
// Usage
throw new ServiceUnavailableError('Service temporarily unavailable', 'SERVICE_UNAVAILABLE');
// Response: 503 Service Unavailable
```

## Response Format

### Standard Error Response

All errors return a standardized JSON response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_abc123def456",
    "traceId": "trace_xyz789abc123"
  },
  "meta": {
    "statusCode": 400,
    "path": "/api/users",
    "method": "POST",
    "userAgent": "Mozilla/5.0...",
    "correlationId": "corr_123456789"
  }
}
```

### Development vs Production

**Development Mode** includes additional details:
```json
{
  "error": {
    "stack": "Error stack trace...",
    "details": {
      "originalError": "Original error details",
      "context": "Additional debugging context"
    }
  }
}
```

**Production Mode** excludes sensitive information:
- No stack traces
- Sanitized error messages
- Limited context information

## Integration

### Middleware Registration

```typescript
import { enhancedErrorHandler } from '../middleware/enhancedErrorHandler';

// Express app setup
app.use(enhancedErrorHandler);
```

### Error Tracking Service Integration

The middleware automatically integrates with ErrorTrackingService:

```typescript
// Automatic error tracking
if (errorTrackingService) {
  const traceId = await errorTrackingService.trackError(error, {
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    correlationId: req.correlationId
  });
}
```

### Database Pool Service Integration

Leverages DatabasePoolService for health checks and monitoring:

```typescript
// Health check integration
const poolService = DatabasePoolService.getInstance();
const isHealthy = await poolService.checkHealth();
```

## Configuration

### Environment Variables

```bash
# Error handling configuration
NODE_ENV=production                    # Environment mode
ERROR_TRACKING_ENABLED=true           # Enable error tracking
ERROR_TRACKING_BATCH_SIZE=100         # Batch size for error processing
ERROR_TRACKING_FLUSH_INTERVAL=30000   # Flush interval (ms)
ENABLE_ERROR_STACK_TRACE=false        # Stack traces in production
```

### Middleware Options

```typescript
// Advanced configuration
const errorHandlerOptions = {
  enableStackTrace: process.env.NODE_ENV === 'development',
  enableErrorTracking: process.env.ERROR_TRACKING_ENABLED === 'true',
  sanitizeContext: true,
  includeRequestDetails: true
};
```

## Usage Examples

### Controller Error Handling

```typescript
// UserController.ts
export class UserController {
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError('User ID is required', 'MISSING_USER_ID');
      }
      
      const user = await this.userService.findById(id);
      
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }
      
      res.json({ success: true, data: user });
    } catch (error) {
      next(error); // Handled by enhanced error handler
    }
  }
}
```

### Service Layer Error Handling

```typescript
// UserService.ts
export class UserService {
  async createUser(userData: CreateUserDto) {
    try {
      return await this.prisma.user.create({ data: userData });
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation - handled by enhanced error handler
        throw error;
      }
      throw error;
    }
  }
}
```

### Authentication Error Handling

```typescript
// AuthMiddleware.ts
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AuthenticationError('Access token required', 'MISSING_TOKEN');
    }
    
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = user;
    next();
  } catch (error) {
    next(error); // JWT errors automatically classified
  }
}
```

## Testing

### Running Tests

```bash
# Basic test execution
cd backend
node test-enhanced-error-handler.js

# With admin token for complete testing
ADMIN_TOKEN=your-admin-token node test-enhanced-error-handler.js

# With custom API URL
API_BASE_URL=http://localhost:3000 node test-enhanced-error-handler.js
```

### Test Categories

1. **Basic Error Handling**: 404, Authentication, Validation errors
2. **Response Structure**: Format consistency, Security headers
3. **Integration Features**: Error tracking, Performance, Health checks
4. **Advanced Features**: Admin endpoints, Request ID generation
5. **Stress Testing**: Concurrent error handling

### Expected Test Results

```
✅ 404 Error Format: Correct format: NOT_FOUND
✅ Request ID Generation: ID: req_abc123def456
✅ Auth Error Handling: Status: 401, Code: AUTHENTICATION_ERROR
✅ Error Tracking Integration: Trace ID: trace_xyz789abc123
✅ Security Headers: Security headers present
✅ Error Structure Consistency: All error responses have consistent structure
✅ Stress Test - Error Handling: 20/20 errors properly formatted (100.0%)
```

## Monitoring

### Error Tracking Dashboard

Access comprehensive error monitoring through the error tracking endpoints:

```bash
# Error statistics
GET /api/errors/stats

# Recent errors
GET /api/errors/recent

# Error health check
GET /api/errors/health

# Generate test errors (admin only)
POST /api/errors/test
```

### Key Metrics

- **Error Rate**: Percentage of requests resulting in errors
- **Error Types**: Distribution of error classifications
- **Response Times**: Error response performance metrics
- **Resolution Rate**: Error pattern recognition and resolution tracking
- **User Impact**: User-facing vs system errors

### Alerting

The Error Tracking Service provides multiple notification channels:

- **Slack Integration**: Real-time error notifications
- **Email Alerts**: Critical error summaries
- **Webhook Notifications**: Custom integrations
- **Dashboard Alerts**: Visual error trend indicators

## Troubleshooting

### Common Issues

#### High Error Rates
1. Check database connection health
2. Verify authentication service status
3. Review recent deployments
4. Check external service dependencies

#### Missing Error Details
1. Verify NODE_ENV configuration
2. Check Error Tracking Service status
3. Ensure proper middleware registration
4. Validate logging configuration

#### Inconsistent Error Responses
1. Confirm middleware order in application
2. Check for custom error handlers overriding
3. Verify error classification logic
4. Review controller error handling patterns

### Debugging

#### Request Tracing
```typescript
// Use request ID for correlation
const requestId = req.requestId; // Automatically generated
// Search logs using: grep "req_abc123def456" logs/combined.log
```

#### Error Context
```typescript
// Access error context in logs
{
  "error": "Detailed error information",
  "context": {
    "userId": 123,
    "action": "user_creation",
    "metadata": "Additional context"
  },
  "requestId": "req_abc123def456"
}
```

#### Performance Monitoring
```bash
# Check error response times
grep "Error handled" logs/combined.log | grep "duration:"

# Monitor error patterns
grep "Error tracked" logs/combined.log | awk '{print $5}' | sort | uniq -c
```

### Health Checks

#### Error Handler Health
```bash
# Check if error handler is working
curl -X GET http://localhost:3001/api/non-existent-endpoint
# Should return structured error response
```

#### Integration Health
```bash
# Verify error tracking integration
curl -X GET http://localhost:3001/api/errors/health
# Should return error tracking system status
```

## Best Practices

### Error Throwing
- Use specific AppError subclasses for application errors
- Include meaningful error codes and messages
- Avoid throwing generic Error objects
- Provide context for debugging without exposing sensitive data

### Controller Pattern
```typescript
try {
  // Business logic
} catch (error) {
  next(error); // Always pass to error handler
}
```

### Service Layer Pattern
```typescript
// Don't handle errors in services - let them bubble up
async serviceMethod() {
  return await this.repository.method(); // Errors handled at controller level
}
```

### Validation Pattern
```typescript
// Use Zod for validation - errors automatically handled
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = schema.parse(data); // ZodError handled automatically
```

## Security Considerations

- Sensitive data is automatically sanitized from error logs
- Stack traces are excluded in production
- User input in errors is escaped to prevent XSS
- Rate limiting errors don't expose system information
- Authentication errors don't reveal user existence

## Performance Impact

- **Minimal Overhead**: ~1-2ms per error response
- **Async Processing**: Error tracking doesn't block responses
- **Memory Efficient**: Context sanitization prevents memory leaks
- **Optimized Logging**: Structured logging for efficient parsing

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Author**: Enhanced Error Handler System  
**Contact**: Development Team
