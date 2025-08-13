# Backend Monitoring & Performance

This document describes the comprehensive monitoring and performance tracking system implemented in the Vevurn POS backend.

## Overview

The backend now includes advanced monitoring capabilities to track system health, performance metrics, and provide detailed diagnostics for production deployments.

## Monitoring Endpoints

### Health Check Endpoints

#### Basic Health Check
- **Endpoint**: `GET /api/health`
- **Purpose**: Simple health check for load balancers
- **Response**: Basic server status and uptime

#### Detailed Health Check
- **Endpoint**: `GET /api/health/detailed`
- **Purpose**: Comprehensive system health report
- **Features**:
  - Redis connection status (both rate limiting and Better Auth storage)
  - Better Auth system health
  - Database connectivity status
  - System resource usage
  - Overall health status (healthy/degraded/unhealthy)

#### Production Readiness Check
- **Endpoint**: `GET /api/health/ready`
- **Purpose**: Kubernetes/Docker readiness probe
- **Features**:
  - Environment variable validation
  - Critical service availability
  - Production deployment verification

#### Live Check
- **Endpoint**: `GET /api/health/live`
- **Purpose**: Kubernetes/Docker liveness probe
- **Features**: Minimal response for keep-alive checks

### Performance Monitoring Endpoints

#### Performance Statistics
- **Endpoint**: `GET /api/monitoring/performance`
- **Purpose**: Overall API performance metrics
- **Features**:
  - Average response times
  - Request count statistics
  - Error rates
  - Response time percentiles (P50, P95, P99)
  - Memory usage statistics

#### Recent Metrics
- **Endpoint**: `GET /api/monitoring/performance/recent?limit=50`
- **Purpose**: Recent request performance data
- **Features**:
  - Last N requests with response times
  - Request details (method, URL, status code)
  - Memory usage per request

#### Endpoint Statistics
- **Endpoint**: `GET /api/monitoring/endpoints`
- **Purpose**: Per-endpoint performance analysis
- **Features**:
  - Average response time per endpoint
  - Request count per endpoint
  - Error rate per endpoint
  - Sorted by performance (slowest first)

### Redis Monitoring

#### Redis Status
- **Endpoint**: `GET /api/monitoring/redis`
- **Purpose**: Redis connection and performance status
- **Features**:
  - Connection health status
  - Fallback mechanism status
  - Redis availability for both rate limiting and auth storage

## System Architecture

### Redis Integration

The backend uses two Redis integrations:

1. **Rate Limiting Redis** (`redis` package)
   - Primary: Redis-based distributed rate limiting
   - Fallback: In-memory rate limiting when Redis unavailable
   - Automatic reconnection and error handling

2. **Better Auth Secondary Storage** (`ioredis` package)
   - Primary: Redis-based session and cache storage
   - Fallback: Database-only storage when Redis unavailable
   - Enhanced connection handling and retry logic

### Performance Monitoring

The system includes automatic performance tracking:

- **Request Timing**: Every request is timed automatically
- **Memory Monitoring**: Tracks memory usage per request
- **Slow Request Detection**: Logs requests >1s as warnings, >5s as errors
- **In-Memory Metrics Storage**: Keeps last 1000 requests for analysis
- **Automatic Cleanup**: Prevents memory leaks with circular buffer

### Error Handling

Enhanced error handling includes:

- **Structured Error Logging**: Detailed error context and request information
- **Operational vs System Errors**: Distinguishes between expected and unexpected errors
- **Development vs Production**: Different error detail levels
- **Global Error Handlers**: Catches unhandled promises and exceptions

## Configuration

### Environment Variables

Required for full monitoring functionality:

```bash
# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Database (required)
DATABASE_URL=postgresql://...

# Better Auth (required)
BETTER_AUTH_SECRET=your-secret-key

# Environment
NODE_ENV=production|development|test
```

### Rate Limiting Configuration

The system includes multiple rate limiting tiers:

1. **General API**: 100 requests/15 minutes per IP
2. **Authentication**: 5 attempts/15 minutes per email+IP
3. **Strict Endpoints**: 5 requests/15 minutes per IP
4. **Sales Creation**: 30 requests/minute per user

### Memory Store Fallback

When Redis is unavailable:
- Rate limiting uses in-memory storage
- Automatic cleanup every 5 minutes
- No data persistence (resets on restart)
- Graceful degradation without service interruption

## Production Deployment

### Health Check Integration

For Kubernetes deployments:

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 8001
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Monitoring Integration

For monitoring systems (Prometheus, DataDog, etc.):

- Use `/api/health/detailed` for comprehensive health status
- Use `/api/monitoring/performance` for performance metrics
- Use `/api/monitoring/endpoints` for endpoint-specific analysis

### Logging

The system provides structured logging:

- **Info Level**: Normal operations, performance metrics
- **Warn Level**: Slow requests, Redis fallbacks, client errors
- **Error Level**: System errors, very slow requests, server errors

## Development

### Local Development

```bash
# Start development server
npm run dev

# Check health endpoints
curl http://localhost:8001/api/health/detailed | jq

# Monitor performance
curl http://localhost:8001/api/monitoring/performance | jq
```

### Testing

The monitoring system includes utilities for testing:

- Performance metrics can be cleared for testing
- Mock Redis failures to test fallback mechanisms
- Simulate slow requests to test alerting

## Troubleshooting

### Redis Connection Issues

If Redis connection fails:
1. Check `REDIS_URL` environment variable
2. Verify Redis server accessibility
3. Review logs for connection errors
4. System automatically falls back to memory storage

### Performance Issues

To diagnose performance problems:
1. Check `/api/monitoring/performance` for overall metrics
2. Review `/api/monitoring/endpoints` for slow endpoints
3. Monitor memory usage trends
4. Check logs for slow request warnings

### Health Check Failures

If health checks fail:
1. Review `/api/health/detailed` for specific service issues
2. Check environment variable configuration
3. Verify database connectivity
4. Review Redis connection status

## Security Considerations

- Health endpoints are public (no authentication required)
- Performance metrics don't expose sensitive data
- Error logs may contain request details (review in production)
- Rate limiting protects against abuse of monitoring endpoints
