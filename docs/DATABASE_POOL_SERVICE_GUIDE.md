# Enhanced Database Connection Pool Service - Implementation Guide

## Overview

The Enhanced Database Connection Pool Service provides enterprise-grade database connection management for your Vevurn POS system. It includes connection pooling, automatic retry logic, performance monitoring, and health checks.

## Key Features

### 🔄 **Connection Pool Management**
- Configurable connection limits (min/max connections)
- Automatic connection lifecycle management
- Connection timeout and idle timeout handling
- Connection warm-up on startup

### 📊 **Performance Monitoring**
- Real-time query performance metrics
- Slow query detection and logging
- Error rate tracking
- Connection utilization monitoring
- PostgreSQL-specific database statistics

### 🔧 **Reliability Features**
- Automatic retry logic with exponential backoff
- Health check monitoring every 30 seconds
- Automatic reconnection on connection loss
- Smart error handling (non-retryable errors)

### 🎯 **Advanced Operations**
- Transaction wrapper with retry logic
- Batch operations with optimization
- Connection warm-up for startup performance

## Environment Configuration

Add these variables to your `.env` file:

```env
# Database Pool Configuration
DB_MAX_CONNECTIONS=20          # Maximum connections in pool
DB_MIN_CONNECTIONS=5           # Minimum connections to maintain
DB_CONNECTION_TIMEOUT=10000    # Connection timeout in milliseconds
DB_IDLE_TIMEOUT=600000         # Idle connection timeout (10 minutes)
DB_MAX_LIFETIME=3600000        # Maximum connection lifetime (1 hour)
DB_RETRY_ATTEMPTS=3            # Number of retry attempts
DB_RETRY_DELAY=1000           # Initial retry delay in milliseconds

# Existing database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/vevurn_pos
```

## Basic Usage

### Getting the Service Instance

```typescript
import { DatabasePoolService } from '../services/DatabasePoolService';

// Get singleton instance
const dbPool = DatabasePoolService.getInstance();

// Get Prisma client
const prisma = dbPool.getClient();
```

### Using with Retry Logic

```typescript
// Execute operation with automatic retry
const result = await dbPool.executeWithRetry(async () => {
  return await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true }
  });
});
```

### Transaction Example

```typescript
// Transaction with retry logic
const saleResult = await dbPool.transaction(async (prisma) => {
  // Create sale
  const sale = await prisma.sale.create({
    data: {
      customerId: customerId,
      total: saleTotal,
      // ... other sale data
    }
  });

  // Create sale items
  const saleItems = await Promise.all(
    items.map(item => 
      prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      })
    )
  );

  return { sale, saleItems };
}, {
  timeout: 10000,
  maxWait: 5000
});
```

### Batch Operations

```typescript
// Execute multiple operations in batches
const operations = products.map(product => 
  () => dbPool.executeWithRetry(async () => 
    await prisma.product.update({
      where: { id: product.id },
      data: { lastUpdated: new Date() }
    })
  )
);

const results = await dbPool.batchExecute(operations, 10);
```

## Updating Existing Services

### ProductService Example

```typescript
// Before
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ProductService {
  async getProducts() {
    return await prisma.product.findMany();
  }
}

// After  
import { DatabasePoolService } from './DatabasePoolService';

export class ProductService {
  private dbPool: DatabasePoolService;

  constructor() {
    this.dbPool = DatabasePoolService.getInstance();
  }

  async getProducts() {
    return await this.dbPool.executeWithRetry(async () => {
      const prisma = this.dbPool.getClient();
      return await prisma.product.findMany({
        include: { category: true }
      });
    });
  }

  async createProduct(productData: any) {
    return await this.dbPool.transaction(async (prisma) => {
      // Create product with automatic inventory record
      const product = await prisma.product.create({
        data: productData
      });

      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: productData.initialQuantity || 0
        }
      });

      return product;
    });
  }
}
```

### SalesService Example

```typescript
import { DatabasePoolService } from './DatabasePoolService';

export class SalesService {
  private dbPool: DatabasePoolService;

  constructor() {
    this.dbPool = DatabasePoolService.getInstance();
  }

  async createSale(saleData: any) {
    return await this.dbPool.transaction(async (prisma) => {
      // Create sale
      const sale = await prisma.sale.create({
        data: {
          customerId: saleData.customerId,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          status: 'COMPLETED'
        }
      });

      // Create sale items and update inventory
      for (const item of saleData.items) {
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
          }
        });

        // Update inventory
        await prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return await prisma.sale.findUnique({
        where: { id: sale.id },
        include: {
          saleItems: {
            include: { product: true }
          },
          customer: true
        }
      });
    }, {
      timeout: 15000, // 15 second timeout for complex sale operations
      maxWait: 8000   // Wait up to 8 seconds for transaction to start
    });
  }

  async getSalesReport(dateRange: { start: Date; end: Date }) {
    return await this.dbPool.executeWithRetry(async () => {
      const prisma = this.dbPool.getClient();
      
      return await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        include: {
          saleItems: {
            include: { product: true }
          },
          customer: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  }
}
```

## Monitoring Endpoints

The service provides comprehensive monitoring endpoints:

### Basic Metrics
```bash
GET /api/database/metrics
```

### Detailed PostgreSQL Metrics
```bash
GET /api/database/detailed-metrics
```

### Health Check
```bash
GET /api/database/health
```

### Performance Analysis
```bash
GET /api/database/performance
```

### Live Metrics (for dashboards)
```bash
GET /api/database/live-metrics
```

### Database Warm-up
```bash
POST /api/database/warmup
```

## Performance Optimizations

### 1. Connection Pool Tuning

```env
# For high-traffic POS systems
DB_MAX_CONNECTIONS=30
DB_MIN_CONNECTIONS=10

# For low-traffic systems  
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=3
```

### 2. Query Optimization

The service automatically logs slow queries (>1 second). Monitor these logs to identify optimization opportunities:

```typescript
// Slow query example (avoid)
const products = await prisma.product.findMany({
  include: {
    category: true,
    inventory: true,
    saleItems: {
      include: { sale: true }
    }
  }
});

// Optimized query
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    category: { select: { name: true } },
    inventory: { select: { quantity: true } }
  },
  where: { isActive: true }
});
```

### 3. Batch Operations

Use batch operations for bulk updates:

```typescript
// Instead of individual updates
for (const product of products) {
  await prisma.product.update({
    where: { id: product.id },
    data: { lastChecked: new Date() }
  });
}

// Use batch operations
const updateOperations = products.map(product => 
  () => prisma.product.update({
    where: { id: product.id },
    data: { lastChecked: new Date() }
  })
);

await dbPool.batchExecute(updateOperations, 20);
```

## Error Handling

The service includes intelligent error handling:

```typescript
try {
  const result = await dbPool.executeWithRetry(async () => {
    return await prisma.product.create({
      data: productData
    });
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation - don't retry
    throw new Error('Product with this name already exists');
  } else {
    // Other errors were already retried
    throw new Error('Failed to create product after multiple attempts');
  }
}
```

## Health Monitoring

The service continuously monitors database health:

- **Health checks every 30 seconds**
- **Automatic reconnection on failure**
- **Performance metrics collection**
- **Slow query detection**
- **Error rate tracking**

Monitor the logs for health status:

```bash
# Check recent health status
tail -f logs/combined.log | grep "Database health check"

# Check slow queries
tail -f logs/combined.log | grep "Slow query detected"

# Check connection metrics
tail -f logs/combined.log | grep "Database pool metrics"
```

## Production Deployment

### 1. Environment Variables

```env
# Production database pool settings
DB_MAX_CONNECTIONS=50
DB_MIN_CONNECTIONS=15
DB_CONNECTION_TIMEOUT=15000
DB_IDLE_TIMEOUT=300000
DB_MAX_LIFETIME=1800000
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY=2000
```

### 2. Monitoring Setup

Set up monitoring alerts for:
- High error rates (>5%)
- Slow average query time (>500ms)
- High connection utilization (>80%)
- Health check failures

### 3. Database Optimization

Ensure your PostgreSQL instance is properly configured:

```sql
-- Recommended PostgreSQL settings for connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
SELECT pg_reload_conf();
```

## Troubleshooting

### Common Issues

1. **High Connection Utilization**
   - Increase `DB_MAX_CONNECTIONS`
   - Optimize long-running queries
   - Implement connection pooling at application level

2. **Slow Query Performance**
   - Add database indexes
   - Optimize queries with `EXPLAIN ANALYZE`
   - Use query result caching

3. **Connection Timeouts**
   - Increase `DB_CONNECTION_TIMEOUT`
   - Check network connectivity
   - Verify database server performance

4. **High Error Rates**
   - Check database constraints
   - Review application logic
   - Monitor database logs

## Integration Complete

Your Enhanced Database Connection Pool Service is now fully integrated and provides:

✅ **Enterprise-grade connection pooling**
✅ **Comprehensive performance monitoring** 
✅ **Automatic retry logic with exponential backoff**
✅ **Health checking and automatic reconnection**
✅ **Transaction support with timeouts**
✅ **Batch operation optimization**
✅ **Real-time monitoring endpoints**
✅ **PostgreSQL-specific metrics**

The service is production-ready and will significantly improve your database performance and reliability!
