# Error Tracking Service Implementation Guide

## 🎯 Overview

The Error Tracking Service is a comprehensive, production-ready error monitoring and management system designed specifically for the Vevurn POS system. It provides enterprise-grade error capture, analysis, notification, and management capabilities.

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Usage Guide](#usage-guide)
6. [API Endpoints](#api-endpoints)
7. [Integration Examples](#integration-examples)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

## ✨ Features

### Core Error Tracking
- **Comprehensive Error Capture**: Automatically captures errors with full context including request details, user information, and environment data
- **Error Fingerprinting**: Groups similar errors together using sophisticated hashing algorithms
- **Performance Monitoring**: Tracks slow requests and performance issues automatically
- **Stack Trace Normalization**: Intelligently groups errors despite minor variations in stack traces

### Security & Privacy
- **Data Sanitization**: Automatically redacts sensitive information (passwords, tokens, API keys)
- **User Context**: Safely captures user information without exposing sensitive data
- **Request Context**: Includes relevant request details while protecting privacy

### Notifications & Alerting
- **Multi-Channel Notifications**: Supports Slack, email, and webhook notifications
- **Smart Alerting**: Frequency-based alerts to prevent notification spam
- **Critical Error Detection**: Immediate notifications for critical system errors
- **Configurable Thresholds**: Customizable alert thresholds and cooldown periods

### Analytics & Insights
- **Real-Time Metrics**: Live error statistics and performance metrics
- **Error Trends**: Track error patterns over time (hourly, daily, weekly)
- **Component Analysis**: Break down errors by application component
- **Performance Analytics**: Identify performance bottlenecks and slow operations

### Administration & Management
- **Admin Dashboard**: Comprehensive admin-only endpoints for monitoring
- **Error Statistics**: Detailed error analytics and reporting
- **Test Generation**: Built-in test error generation for validation
- **Cleanup Tools**: Data management and cleanup utilities

## 🏗️ Architecture

### Service Architecture
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Application       │    │   Error Tracking    │    │   Storage Layer     │
│   Components        │───▶│   Service           │───▶│                     │
│                     │    │                     │    │   • PostgreSQL     │
│ • Controllers       │    │ • Error Capture     │    │   • Redis Cache     │
│ • Middleware        │    │ • Fingerprinting    │    │   • Error Logs      │
│ • Services          │    │ • Notifications     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   Notification      │
                           │   Channels          │
                           │                     │
                           │ • Slack Webhooks    │
                           │ • Email Alerts      │
                           │ • Custom Webhooks   │
                           └─────────────────────┘
```

### Data Flow
1. **Error Occurs**: Application error is caught by middleware or manual capture
2. **Context Extraction**: Full request context, user info, and environment data collected
3. **Fingerprinting**: Error is hashed and grouped with similar errors
4. **Buffering**: Error added to batch processing buffer
5. **Critical Check**: Immediate notification sent if error is critical
6. **Metrics Update**: Real-time metrics updated in Redis
7. **Database Storage**: Error data persisted to PostgreSQL
8. **Notifications**: Alerts sent based on frequency and severity

## 🚀 Installation & Setup

### 1. Database Schema
The ErrorLog model is automatically added to your Prisma schema:

```prisma
model ErrorLog {
  id            String   @id @default(cuid())
  errorType     String   // Error class/type name
  errorMessage  String   // Error message
  errorStack    String?  @db.Text // Full stack trace
  errorCode     String   // Hash for grouping similar errors
  
  // Context information
  component     String   // Which component/service
  operation     String   // What operation was being performed
  
  // Request information
  ipAddress     String?
  userAgent     String?
  
  // Error metadata
  severity      String   @default("error") // info, warning, error, critical
  status        String   @default("new")   // new, investigating, resolved, ignored
  
  // Additional details stored as JSON
  details       Json?    // Context, user info, request data, etc.
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([errorCode])
  @@index([component])
  @@index([severity])
  @@index([status])
  @@index([createdAt])
  @@map("error_logs")
}
```

### 2. Apply Database Migration
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 3. Environment Configuration
Add these environment variables to your `.env` file:

```env
# Error Tracking Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ERROR_NOTIFICATION_EMAIL=admin@yourcompany.com

# Application Information
APP_VERSION=1.0.0
NODE_ENV=production
```

### 4. Service Integration
The service is automatically integrated into your application through `index.ts`.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SLACK_WEBHOOK_URL` | Slack webhook for error notifications | No | - |
| `ERROR_NOTIFICATION_EMAIL` | Email for critical error alerts | No | - |
| `APP_VERSION` | Application version for error context | No | 1.0.0 |
| `NODE_ENV` | Environment (development/production) | No | development |

### Notification Channels

#### Slack Configuration
1. Create a Slack webhook in your workspace
2. Set `SLACK_WEBHOOK_URL` environment variable
3. Errors will be sent to the configured channel

#### Email Configuration
1. Set `ERROR_NOTIFICATION_EMAIL` environment variable
2. Implement email service integration in the service
3. Currently logs email notifications (placeholder for your email service)

### Performance Thresholds
- **Default Request Threshold**: 1000ms (1 second)
- **Critical Error Types**: DatabaseError, SecurityError, Payment errors
- **Frequency Alert Threshold**: 10 occurrences per hour

## 📖 Usage Guide

### Basic Error Capture

#### Automatic Capture (Middleware)
Errors are automatically captured by the global error tracking middleware:

```typescript
// Errors thrown in any route handler are automatically captured
app.get('/api/example', async (req, res) => {
  throw new Error('Something went wrong'); // Automatically tracked
});
```

#### Manual Error Capture
```typescript
import { ErrorTrackingService } from '../services/ErrorTrackingService';

const errorTracker = ErrorTrackingService.getInstance();

try {
  // Your code here
  await riskyOperation();
} catch (error) {
  const errorId = await errorTracker.captureError(error, {
    component: 'payment-processing',
    operation: 'process-payment',
    additionalData: {
      paymentId: payment.id,
      amount: payment.amount
    }
  }, req);
  
  console.log(`Error captured with ID: ${errorId}`);
}
```

### Performance Monitoring
```typescript
// Manual performance tracking
const startTime = Date.now();
await slowOperation();
const duration = Date.now() - startTime;

await errorTracker.capturePerformanceIssue(
  'slow-database-query',
  duration,
  1000, // 1 second threshold
  {
    component: 'database',
    operation: 'complex-query',
    additionalData: { queryType: 'analytics' }
  }
);
```

### Custom Error Types
```typescript
// Create custom error types
class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

// This will be categorized as a PaymentError
throw new PaymentError('Payment processing failed');
```

## 🔌 API Endpoints

All error tracking endpoints require admin authentication.

### GET /api/errors/health
Get error tracking service health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "error-tracking",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "features": {
      "errorCapture": true,
      "performanceTracking": true,
      "notifications": true,
      "metrics": true
    }
  }
}
```

### GET /api/errors/config
Get current error tracking configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "config": {
      "environment": "production",
      "version": "1.0.0",
      "notifications": {
        "slack": true,
        "email": true
      },
      "features": {
        "bufferFlushInterval": 30000,
        "performanceThreshold": 1000,
        "criticalErrorTypes": ["DatabaseError", "SecurityError"],
        "sensitiveFields": ["password", "token", "secret", "key", "auth"]
      }
    }
  }
}
```

### GET /api/errors/stats
Get error statistics and metrics.

**Query Parameters:**
- `timeframe`: `hour` | `day` | `week` (default: `day`)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalErrors": 150,
      "uniqueErrors": 25,
      "errorRate": 6.25,
      "topErrors": [
        {
          "fingerprint": "abc123",
          "count": 45,
          "lastSeen": "2024-01-01T11:30:00.000Z",
          "message": "Database connection timeout"
        }
      ],
      "errorsByComponent": {
        "database": 75,
        "api": 45,
        "auth": 30
      },
      "errorsByType": {
        "DatabaseError": 75,
        "ValidationError": 45,
        "AuthError": 30
      },
      "recentErrors": 12
    },
    "timeframe": "day",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### POST /api/errors/test
Generate a test error for validation.

**Request Body:**
```json
{
  "errorType": "TestError",
  "message": "This is a test error",
  "component": "test-component"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Test error generated and captured",
    "errorId": "12345678-1234-1234-1234-123456789012",
    "errorType": "TestError",
    "component": "test-component"
  }
}
```

### POST /api/errors/test-performance
Test performance issue tracking.

**Request Body:**
```json
{
  "operation": "test-slow-operation",
  "duration": 2500,
  "threshold": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Performance issue test completed",
    "operation": "test-slow-operation",
    "duration": 2500,
    "threshold": 1000,
    "wasTriggered": true
  }
}
```

## 🔧 Integration Examples

### Express Route Integration
```typescript
import { asyncHandler } from '../middleware/errorTracking';
import { ErrorTrackingService } from '../services/ErrorTrackingService';

const errorTracker = ErrorTrackingService.getInstance();

// Using async handler wrapper
app.get('/api/products', asyncHandler(async (req, res) => {
  const products = await getProducts();
  res.json({ products });
}));

// Manual error handling
app.post('/api/payment', async (req, res) => {
  try {
    const payment = await processPayment(req.body);
    res.json({ success: true, payment });
  } catch (error) {
    await errorTracker.captureError(error, {
      component: 'payment',
      operation: 'process-payment',
      additionalData: {
        paymentMethod: req.body.method,
        amount: req.body.amount
      }
    }, req);
    
    res.status(500).json({
      success: false,
      error: 'Payment processing failed'
    });
  }
});
```

### Service Integration
```typescript
// In any service file
import { ErrorTrackingService } from '../services/ErrorTrackingService';

class PaymentService {
  private errorTracker = ErrorTrackingService.getInstance();

  async processPayment(paymentData: any): Promise<any> {
    try {
      const result = await this.chargePayment(paymentData);
      return result;
    } catch (error) {
      // Capture with service context
      await this.errorTracker.captureError(error, {
        component: 'payment-service',
        operation: 'charge-payment',
        additionalData: {
          paymentMethod: paymentData.method,
          merchantId: paymentData.merchantId,
          isRetry: paymentData.isRetry || false
        }
      });
      
      throw error; // Re-throw for caller handling
    }
  }
}
```

### Database Operation Integration
```typescript
import { DatabasePoolService } from '../services/DatabasePoolService';
import { ErrorTrackingService } from '../services/ErrorTrackingService';

class ProductService {
  private db = DatabasePoolService.getInstance();
  private errorTracker = ErrorTrackingService.getInstance();

  async getProduct(id: string): Promise<Product | null> {
    const startTime = Date.now();
    
    try {
      const product = await this.db.executeQuery(async (prisma) => {
        return await prisma.product.findUnique({ where: { id } });
      });
      
      const duration = Date.now() - startTime;
      
      // Track slow queries
      if (duration > 500) { // 500ms threshold
        await this.errorTracker.capturePerformanceIssue(
          'product-query',
          duration,
          500,
          {
            component: 'product-service',
            operation: 'get-product',
            additionalData: { productId: id }
          }
        );
      }
      
      return product;
    } catch (error) {
      await this.errorTracker.captureError(error, {
        component: 'product-service',
        operation: 'get-product',
        additionalData: { productId: id, queryDuration: Date.now() - startTime }
      });
      
      throw error;
    }
  }
}
```

## 🧪 Testing

### Automated Testing
```bash
# Install test dependencies
npm install axios colors

# Run comprehensive test suite
cd backend
ADMIN_TOKEN=your_admin_token node test-error-tracking.js

# Run without admin token (limited tests)
node test-error-tracking.js
```

### Manual Testing

#### Test Error Generation
```bash
curl -X POST http://localhost:3001/api/errors/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "errorType": "ManualTestError",
    "message": "Testing error capture manually",
    "component": "manual-test"
  }'
```

#### Test Performance Tracking
```bash
curl -X POST http://localhost:3001/api/errors/test-performance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "operation": "manual-slow-test",
    "duration": 1500,
    "threshold": 1000
  }'
```

### Verification Checklist
- [ ] Error capture working correctly
- [ ] Performance monitoring active
- [ ] Notifications configured and tested
- [ ] Admin endpoints accessible
- [ ] Database storage working
- [ ] Redis metrics updating
- [ ] Middleware integration active
- [ ] Sensitive data sanitization working

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] Database migration applied (`npx prisma db push`)
- [ ] Environment variables configured
- [ ] Notification channels tested
- [ ] Admin authentication setup
- [ ] Monitoring thresholds configured
- [ ] Sensitive data sanitization verified

### Deployment Steps
1. **Apply Database Changes**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Configure Environment**
   ```bash
   # Set production environment variables
   export SLACK_WEBHOOK_URL=your_slack_webhook
   export ERROR_NOTIFICATION_EMAIL=admin@yourcompany.com
   export NODE_ENV=production
   ```

3. **Test in Staging**
   ```bash
   # Run comprehensive test suite
   ADMIN_TOKEN=staging_token node test-error-tracking.js
   ```

4. **Deploy to Production**
   - Deploy application with error tracking service
   - Verify all services start correctly
   - Test critical error notifications
   - Monitor error capture and metrics

### Production Monitoring
- Monitor error tracking service health via `/api/errors/health`
- Set up alerts for service downtime
- Review error statistics regularly via `/api/errors/stats`
- Monitor notification channel delivery

### Performance Considerations
- Error buffer flushes every 30 seconds (configurable)
- Redis metrics provide real-time insights
- Database writes are batched for efficiency
- Sensitive data sanitization is lightweight

## 🔧 Troubleshooting

### Common Issues

#### Error Tracking Not Capturing Errors
**Symptoms:** No errors showing in logs or statistics
**Solutions:**
- Check if error tracking middleware is properly setup
- Verify database connectivity
- Check Redis connection
- Review error logs for service initialization issues

#### Notifications Not Sending
**Symptoms:** Errors captured but no notifications received
**Solutions:**
- Verify `SLACK_WEBHOOK_URL` or `ERROR_NOTIFICATION_EMAIL` environment variables
- Test webhook URLs manually
- Check notification channel configuration
- Review error logs for notification failures

#### Admin Endpoints Returning 403/401
**Symptoms:** Cannot access error tracking admin endpoints
**Solutions:**
- Ensure admin authentication is working
- Verify admin token is valid and not expired
- Check enhanced authentication middleware setup
- Confirm user has admin role

#### High Memory Usage
**Symptoms:** Application memory usage increasing over time
**Solutions:**
- Check error buffer size (flushes every 30 seconds)
- Monitor Redis memory usage
- Review error log retention policies
- Consider database cleanup for old error logs

#### Performance Impact
**Symptoms:** Application slowdown after enabling error tracking
**Solutions:**
- Error tracking is designed to be lightweight
- Check database performance for error log inserts
- Monitor Redis performance for metrics updates
- Review error tracking overhead in performance metrics

### Debug Mode
Enable debug logging by setting log level to debug in your logger configuration:

```typescript
// In your logger configuration
const logger = winston.createLogger({
  level: 'debug', // Enable debug logs
  // ... other configuration
});
```

### Health Monitoring
Regular health checks ensure the error tracking service is working:

```bash
# Check service health
curl http://localhost:3001/api/errors/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check application health
curl http://localhost:3001/health
```

## 📚 Additional Resources

### Related Documentation
- [Enhanced Authentication System](./ENHANCED_AUTH_COMPLETE.md)
- [Database Pool Service](./DATABASE_POOL_IMPLEMENTATION.md)
- [Redis Service Implementation](./REDIS_SERVICE_DOCS.md)

### External Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Documentation](https://redis.io/docs)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)

---

## 🎉 Conclusion

The Error Tracking Service provides enterprise-grade error monitoring and management for your Vevurn POS system. With comprehensive error capture, intelligent grouping, real-time notifications, and detailed analytics, you have full visibility into your application's health and performance.

The service is designed to be lightweight, secure, and highly configurable, making it suitable for both development and production environments. Regular monitoring and maintenance of the error tracking system will help ensure optimal application performance and user experience.

For questions or support, review the troubleshooting section or check the related documentation listed above.
