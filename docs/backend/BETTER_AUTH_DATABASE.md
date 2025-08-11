# Better Auth Database Implementation - Vevurn POS

This document outlines how your Vevurn POS system implements Better Auth database concepts with POS-specific enhancements.

## 🗄️ Database Architecture Overview

### Core Better Auth Schema ✅
Your implementation perfectly follows Better Auth database requirements:

#### **User Table** (`users`)
```prisma
model User {
  // Better Auth Core Fields
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // POS Extension Fields (Additional Fields Pattern)
  role              String   @default("cashier")
  employeeId        String?  @unique
  firstName         String
  lastName          String
  isActive          Boolean  @default(true)
  maxDiscountAllowed Int?    @default(0)
  canSellBelowMin   Boolean? @default(false)
  
  // Relations
  accounts Account[]
  sessions Session[]
  // POS-specific relations...
}
```

#### **Session Table** (`sessions`)
```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique @map("sessionToken") // Better Auth mapping
  userId    String
  expiresAt DateTime @map("expires")             // Better Auth mapping
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### **Account Table** (`accounts`)
```prisma
model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String    @map("providerAccountId") // Better Auth mapping
  providerId            String    @map("provider")          // Better Auth mapping
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?   @db.Text
  password              String?   // For email/password auth
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

#### **Verification Table** (`verification_tokens`)
```prisma
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String   @map("token")   // Better Auth mapping
  expiresAt  DateTime @map("expires") // Better Auth mapping
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## 🔧 Database Adapters

### Primary Database: PostgreSQL + Prisma ✅
```typescript
// In auth.ts
database: prismaAdapter(prisma, {
  provider: "postgresql",
}),
```

### Secondary Storage: Redis ✅
```typescript
// Redis implementation following Better Auth SecondaryStorage interface
export const redisStorage: SecondaryStorage = {
  async get(key: string): Promise<string | null> {
    const value = await redis.get(`better-auth:${key}`)
    return value
  },
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const redisKey = `better-auth:${key}`
    if (ttl) {
      await redis.setex(redisKey, ttl, value)
    } else {
      await redis.set(redisKey, value)
    }
  },
  async delete(key: string): Promise<void> {
    await redis.del(`better-auth:${key}`)
  }
}
```

## 🔗 Database Hooks Implementation

Your database hooks implement comprehensive POS business logic:

### User Creation Hooks
```typescript
user: {
  create: {
    before: async (user, ctx) => {
      // ✅ OAuth vs Email/Password detection
      // ✅ Employee ID validation (EMP-XXXX format)
      // ✅ Business rule: Only admins create admins
      // ✅ Name parsing for OAuth users
      // ✅ Auto-generate employee IDs
      // ✅ Discount limit validation (max 50%)
      // ✅ Set POS-specific defaults
    },
    after: async (user) => {
      // ✅ Audit logging
      // ✅ Welcome email integration
    }
  }
}
```

### User Update Hooks
```typescript
user: {
  update: {
    before: async (data, ctx) => {
      // ✅ Permission validation via session context
      // ✅ Role change authorization
      // ✅ Self-deactivation prevention
      // ✅ Business rule enforcement
    },
    after: async (user, ctx) => {
      // ✅ Change logging
      // ✅ Session invalidation for deactivated users
    }
  }
}
```

### Session & Account Hooks
```typescript
session: {
  create: {
    before: // Security monitoring
    after:  // Session tracking
  }
},
account: {
  create: {
    before: // OAuth account logging
    after:  // Account linking confirmation
  }
}
```

## 📊 Extended Database Operations

### POS-Specific User Operations
```typescript
// Get employees by role
Users.getUsersByRole('cashier', includeInactive = false)

// Employee lookup by ID
Users.getEmployeeById('EMP-1001')

// Permission management
Users.updateUserPermissions(userId, { maxDiscountAllowed: 25 }, adminUserId)

// Safe user deactivation (with session cleanup)
Users.deactivateUser(userId, adminUserId)
```

### Session Management
```typescript
// Active session monitoring
Sessions.getActiveSessions(userId)

// Maintenance operations
Sessions.cleanupExpiredSessions()

// Admin dashboard statistics
Sessions.getSessionStats()
```

### OAuth Account Management
```typescript
// Link additional providers
Accounts.linkOAuthAccount(userId, { providerId: 'google', ... })

// View user's connected accounts
Accounts.getUserOAuthProviders(userId)

// Unlink OAuth providers
Accounts.unlinkOAuthAccount(userId, 'google')
```

### Database Maintenance
```typescript
// Health monitoring
Maintenance.healthCheck()

// Automated cleanup
Maintenance.performMaintenance()
```

## 🚀 CLI Integration

### Schema Generation ✅
```bash
npx @better-auth/cli generate --config src/lib/auth.ts
```
- ✅ Automatically detects your auth configuration
- ✅ Generates proper Prisma models
- ✅ Preserves your custom POS fields

### Database Migration ✅
```bash
npx prisma db push
```
- ✅ Applies Better Auth schema changes
- ✅ Maintains existing POS data
- ✅ Updates table structures

## 🛡️ Security Features

### Data Protection
- ✅ **Field Mapping**: Prisma field names mapped to Better Auth expectations
- ✅ **Cascade Deletes**: Proper relationship cleanup on user deletion
- ✅ **Index Optimization**: Unique constraints on critical fields
- ✅ **TTL Support**: Automatic cleanup of expired tokens

### Business Logic Enforcement
- ✅ **Employee ID Format**: Enforced EMP-XXXX pattern
- ✅ **Role-Based Access**: Admin-only operations protected
- ✅ **Discount Limits**: Maximum 50% discount validation
- ✅ **Self-Protection**: Users can't deactivate themselves

### Audit Trail
- ✅ **Creation Logging**: All user creations logged with context
- ✅ **Update Tracking**: Role and permission changes monitored
- ✅ **Session Monitoring**: Login attempts and IP tracking
- ✅ **OAuth Integration**: Provider linking/unlinking logged

## 📈 Performance Optimizations

### Redis Secondary Storage
- ✅ **Session Caching**: Fast session lookups
- ✅ **Rate Limiting**: Distributed rate limit counters
- ✅ **Key Prefixing**: Organized Redis namespace (`better-auth:`)
- ✅ **TTL Management**: Automatic expiration handling

### Database Indexing
- ✅ **Primary Keys**: CUID-based unique identifiers
- ✅ **Unique Constraints**: Email, employee ID, session tokens
- ✅ **Foreign Key Optimization**: Proper relationship indexing
- ✅ **Composite Indexes**: Provider + account ID combinations

## 🔄 Migration & Updates

### Adding New Fields
1. Update your auth configuration with `additionalFields`
2. Run `npx @better-auth/cli generate`
3. Apply with `npx prisma db push`
4. Better Auth automatically handles type inference

### Plugin Integration
- Schema changes detected automatically
- CLI generates required tables/columns
- Database hooks integrate seamlessly with plugins

## 🎯 Best Practices Implemented

✅ **Following Better Auth Patterns**: Core schema compliance
✅ **POS Business Logic**: Domain-specific validation and defaults  
✅ **Security First**: Proper authorization and audit trails
✅ **Performance Optimized**: Redis caching and efficient queries
✅ **Maintainable**: Clear separation of concerns and utilities
✅ **Type Safe**: Full TypeScript integration throughout

Your database implementation is production-ready and follows Better Auth best practices while adding comprehensive POS-specific functionality! 🎉
