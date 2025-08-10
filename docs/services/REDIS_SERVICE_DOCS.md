# Redis Service Documentation

This document provides comprehensive information about the `RedisService` class used in the Vevurn POS system.

## Overview

The `RedisService` class provides a comprehensive Redis client wrapper with:
- Connection management
- Basic key-value operations
- JSON data handling
- Hash operations
- Session management
- Rate limiting utilities
- Cache management with TTL support
- Error handling and logging

## Installation & Setup

### Dependencies
```bash
pnpm add redis
```

### Environment Variables
```env
REDIS_URL=redis://localhost:6379
# For production with authentication:
# REDIS_URL=redis://username:password@hostname:port
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

## Basic Usage

### Initialization
```typescript
import { redisService } from './services/RedisService';

// Connect to Redis
await redisService.connect();

// Check connection health
const isHealthy = await redisService.healthCheck();
```

### Basic Operations

#### Set and Get Values
```typescript
// Set a simple string value
await redisService.set('user:123', 'John Doe');

// Set with TTL (time to live)
await redisService.set('session:abc', 'active', { ttl: 3600 }); // 1 hour

// Set only if key doesn't exist (NX)
await redisService.set('counter', '0', { nx: true });

// Set only if key exists (XX)
await redisService.set('existing_key', 'new_value', { xx: true });

// Get values
const user = await redisService.get('user:123');
const session = await redisService.get('session:abc');
```

#### JSON Operations
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const userData: User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};

// Store JSON data with TTL
await redisService.setJSON('user:123', userData, 3600);

// Retrieve JSON data
const user = await redisService.getJSON<User>('user:123');
console.log(user?.name); // John Doe
```

#### Key Management
```typescript
// Check if key exists
const exists = await redisService.exists('user:123');

// Set expiration
await redisService.expire('user:123', 7200); // 2 hours

// Get time to live
const ttl = await redisService.ttl('user:123');

// Delete key
await redisService.del('user:123');
```

## Advanced Features

### Session Management
```typescript
import { SessionData } from './services/RedisService';

const sessionData: SessionData = {
  userId: '123',
  email: 'user@example.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
};

// Create session (1 hour TTL)
await redisService.createSession('user123', sessionData, 3600);

// Get session
const session = await redisService.getSession('user123');

// Update last activity
await redisService.updateSessionActivity('user123');

// Destroy session
await redisService.destroySession('user123');
```

### Rate Limiting
```typescript
// Check rate limit: 10 requests per 60 seconds
const result = await redisService.checkRateLimit('user:123', 60, 10);

if (!result.allowed) {
  console.log(`Rate limited. Reset at: ${result.resetTime}`);
  console.log(`Remaining requests: ${result.remaining}`);
} else {
  console.log(`Request allowed. ${result.remaining} remaining`);
}
```

### Cache Management
```typescript
// Cache with automatic fallback
const expensiveData = await redisService.cache(
  'expensive:operation:123',
  async () => {
    // This function runs only if cache miss
    return await performExpensiveOperation();
  },
  1800 // 30 minutes TTL
);

// Invalidate cache patterns
const deletedCount = await redisService.invalidatePattern('user:*');
console.log(`Deleted ${deletedCount} keys`);
```

### Hash Operations
```typescript
// Set hash fields
await redisService.hSet('user:123', 'name', 'John Doe');
await redisService.hSet('user:123', 'email', 'john@example.com');

// Get hash field
const name = await redisService.hGet('user:123', 'name');

// Get all hash fields
const userData = await redisService.hGetAll('user:123');
// Returns: { name: 'John Doe', email: 'john@example.com' }

// Delete hash field
await redisService.hDel('user:123', 'email');
```

## Integration Examples

### Express Middleware Rate Limiting
```typescript
import { redisService } from '../services/RedisService';

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const identifier = req.ip || 'anonymous';
  const result = await redisService.checkRateLimit(identifier, 60, 100);
  
  res.set({
    'RateLimit-Limit': '100',
    'RateLimit-Remaining': result.remaining.toString(),
    'RateLimit-Reset': result.resetTime.toString()
  });
  
  if (!result.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
};
```

### Caching Database Queries
```typescript
export class ProductService {
  static async getPopularProducts(): Promise<Product[]> {
    return await redisService.cache(
      'products:popular',
      async () => {
        return await prisma.product.findMany({
          where: { isPopular: true },
          orderBy: { views: 'desc' },
          take: 20
        });
      },
      900 // 15 minutes
    );
  }

  static async invalidateProductCache(): Promise<void> {
    await redisService.invalidatePattern('products:*');
  }
}
```

### Session Storage with Better-Auth
```typescript
import { betterAuth } from 'better-auth';
import { redisService } from './RedisService';

export const auth = betterAuth({
  // ... other config
  session: {
    async get(sessionId: string) {
      return await redisService.getSession(sessionId);
    },
    async set(sessionId: string, data: any) {
      return await redisService.createSession(sessionId, data, 86400); // 24 hours
    },
    async delete(sessionId: string) {
      return await redisService.destroySession(sessionId);
    }
  }
});
```

## Error Handling

The RedisService includes comprehensive error handling:

```typescript
// All methods return appropriate fallback values on error:
// - get() returns null
// - set(), del(), exists() return false/0
// - JSON methods return null for get, false for set
// - Cache method falls back to direct data fetching

// Check connection before operations
if (!redisService.isRedisConnected()) {
  console.warn('Redis not connected, operation may fail');
}

// Health check for monitoring
const healthCheck = await redisService.healthCheck();
if (!healthCheck) {
  logger.error('Redis health check failed');
}
```

## Production Considerations

### Connection Management
```typescript
// Proper startup/shutdown in your application
async function startApp() {
  await redisService.connect();
  // ... start your app
}

async function shutdownApp() {
  await redisService.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdownApp);
process.on('SIGINT', shutdownApp);
```

### Monitoring and Metrics
```typescript
// Get Redis information for monitoring
const info = await redisService.getInfo();
console.log('Redis Info:', info);

// Log connection status
setInterval(async () => {
  const connected = redisService.isRedisConnected();
  const healthy = await redisService.healthCheck();
  
  if (!connected || !healthy) {
    logger.error('Redis connection issues detected');
  }
}, 30000); // Check every 30 seconds
```

### Memory Management
```typescript
// Use appropriate TTLs to prevent memory bloat
await redisService.set('temp:data', value, { ttl: 300 }); // 5 minutes

// Clean up patterns periodically
await redisService.invalidatePattern('temp:*');

// For development only - flush all data
if (process.env.NODE_ENV === 'development') {
  await redisService.flushAll(); // ⚠️ Deletes all data!
}
```

## Best Practices

1. **Always use TTL for temporary data**
2. **Use consistent key naming patterns** (e.g., `user:123`, `session:abc`)
3. **Handle connection failures gracefully**
4. **Monitor Redis memory usage**
5. **Use appropriate data types** (strings, hashes, etc.)
6. **Implement proper error handling**
7. **Use connection pooling in production**
8. **Regular health checks and monitoring**

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```typescript
   // Increase timeout in constructor if needed
   socket: { connectTimeout: 20000 }
   ```

2. **Memory Issues**
   - Monitor Redis memory usage
   - Use appropriate TTL values
   - Clean up old keys regularly

3. **Performance Issues**
   - Use pipelining for bulk operations
   - Implement connection pooling
   - Monitor slow queries

For more information, see the Redis documentation: https://redis.io/documentation
