# Better Auth Database Implementation Guide

## Overview

This implementation follows the [Better Auth Database Documentation](https://better-auth.com/docs/concepts/database) patterns to create a comprehensive, production-ready authentication system with enhanced POS-specific business logic.

## Key Features Implemented

### ✅ 1. Database Adapters
- **Prisma Adapter**: Using PostgreSQL with Better Auth-compliant schema
- **CLI Integration**: Schema generated via `npx @better-auth/cli generate`
- **Custom Field Mappings**: Proper mapping between Prisma schema and Better Auth expectations

### ✅ 2. Secondary Storage (Redis)
- **Enhanced Redis Implementation**: Following Better Auth `SecondaryStorage` interface
- **Key Prefixing**: `vevurn-auth:` prefix for organized caching
- **Error Handling**: Graceful fallbacks when Redis is unavailable
- **Monitoring**: Built-in health checks and statistics

### ✅ 3. Custom Schema Extensions
- **Additional Fields**: POS-specific fields (role, employeeId, permissions)
- **Business Logic Integration**: Custom validation and defaults
- **Type Safety**: Full TypeScript inference for additional fields

### ✅ 4. Database Hooks
- **Comprehensive Hooks**: User, Session, and Account lifecycle hooks
- **Business Logic**: POS-specific validation and workflows
- **Security Rules**: Role-based permissions and validation
- **Audit Logging**: Comprehensive tracking of sensitive operations

### ✅ 5. Enhanced Configuration
- **Custom Cookie Names**: `vevurn_session` for branded experience
- **Security Settings**: Production-ready cookie configuration
- **Rate Limiting**: Custom rules for different authentication endpoints
- **Custom Table Names**: Proper mapping for existing database schema

## File Structure

```
backend/src/lib/
├── auth.ts                    # Main Better Auth configuration
├── database-config.ts         # Database configuration and utilities
├── database-hooks.ts          # Enhanced database hooks with business logic
├── database-utils.ts          # Extended database operations
├── redis-storage.ts           # Enhanced Redis secondary storage
└── health-check.ts           # Comprehensive health monitoring
```

## Database Schema

### Core Tables (Better Auth Required)

1. **users** - User accounts with POS extensions
   - Better Auth fields: `id`, `name`, `email`, `emailVerified`, `image`
   - POS fields: `role`, `employeeId`, `firstName`, `lastName`, `isActive`

2. **sessions** - User sessions with device tracking
   - Better Auth fields: `id`, `userId`, `token`, `expiresAt`
   - Extensions: `ipAddress`, `userAgent` for POS security

3. **accounts** - OAuth and credential accounts
   - Better Auth fields: `id`, `userId`, `accountId`, `providerId`
   - OAuth support: `accessToken`, `refreshToken`, `scope`

4. **verification_tokens** - Email verification and password reset
   - Better Auth fields: `id`, `identifier`, `value`, `expiresAt`

## Key Implementation Details

### 1. Custom Field Mappings

```typescript
// Better Auth expects 'token' but Prisma uses 'sessionToken'
Session {
  token String @unique @map("sessionToken")
}

// Better Auth expects 'accountId' but Prisma uses 'providerAccountId'
Account {
  accountId String @map("providerAccountId")
}
```

### 2. Additional Fields Configuration

```typescript
user: {
  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "cashier",
      input: false, // Admin-controlled
    },
    employeeId: {
      type: "string",
      required: false,
    },
    // ... more POS-specific fields
  }
}
```

### 3. Database Hooks Implementation

```typescript
databaseHooks: {
  user: {
    create: {
      before: async (user, ctx) => {
        // Validation and business logic
        // Returns modified user data
      },
      after: async (user, ctx) => {
        // Post-creation actions (audit logs, notifications)
      }
    }
  }
}
```

### 4. Redis Secondary Storage

```typescript
secondaryStorage: {
  get: async (key) => await redis.get(`vevurn-auth:${key}`),
  set: async (key, value, ttl) => {
    if (ttl) await redis.setex(`vevurn-auth:${key}`, ttl, value)
    else await redis.set(`vevurn-auth:${key}`, value)
  },
  delete: async (key) => await redis.del(`vevurn-auth:${key}`)
}
```

## Business Logic Integration

### POS-Specific Validation
- **Employee ID Format**: `EMP-XXXX` pattern validation
- **Role-based Permissions**: Admin-only sensitive field updates
- **Discount Limits**: Maximum 50% discount validation
- **Account Security**: Corporate email domain validation for admin accounts

### OAuth Integration
- **Profile Mapping**: Automatic firstName/lastName extraction
- **Provider Restrictions**: Admin accounts limited to specific OAuth providers
- **Account Linking**: Enhanced security logging for OAuth connections

### Session Management
- **Active User Check**: Inactive users cannot create sessions
- **Device Tracking**: IP address and user agent logging
- **POS-Optimized Duration**: 12-hour sessions for shift-based work

## Health Monitoring

### Comprehensive Health Checks
- **Database Connectivity**: PostgreSQL connection status
- **Redis Availability**: Secondary storage health
- **Auth Endpoints**: Better Auth API availability
- **Environment Config**: Required environment variables

### Maintenance Operations
- **Expired Record Cleanup**: Automatic cleanup of expired sessions/verifications
- **Cache Management**: Redis auth cache maintenance
- **Statistics Tracking**: Usage and performance metrics

## Usage Examples

### Health Check
```typescript
import healthCheck from './health-check'

// Comprehensive system health check
const health = await healthCheck.performHealthCheck()
console.log('System Status:', health.status)

// Generate detailed report
const report = await healthCheck.generateHealthReport()
console.log(report)
```

### Database Operations
```typescript
import { DatabaseManager } from './database-config'

const db = new DatabaseManager()

// Get system statistics
const stats = await db.getStatistics()

// Cleanup expired records
const cleanup = await db.cleanupExpiredRecords()
```

### Redis Management
```typescript
import { RedisManager } from './redis-storage'

const redis = new RedisManager()

// Check Redis status
const health = await redis.healthCheck()

// Clear auth cache
const cleared = await redis.clearAuthCache()
```

## Best Practices Implemented

1. **Error Handling**: Graceful fallbacks for Redis failures
2. **Security**: Role-based access control and audit logging
3. **Performance**: Redis caching for session data and rate limiting
4. **Monitoring**: Comprehensive health checks and statistics
5. **Maintainability**: Proper separation of concerns and modular design
6. **Type Safety**: Full TypeScript support with Better Auth type inference

## Environment Configuration

Required environment variables:
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:8000"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## Migration and Schema Updates

To update the database schema:

```bash
# Generate new Better Auth schema
npx @better-auth/cli generate

# Apply Prisma migrations
npx prisma db push

# Or create and apply migrations
npx prisma migrate dev --name "better-auth-updates"
```

This implementation provides a robust, scalable authentication system that follows Better Auth best practices while integrating seamlessly with your POS business requirements.
