# Better Auth Database Configuration - Updated

This document outlines the updates made to bring the Vevurn POS system's Better Auth implementation up to the latest standards.

## Changes Made

### 1. Schema Updates

#### Session Model
- **Field Changes**: 
  - `sessionToken` → `token` (with `@map` for backward compatibility)
  - `expires` → `expiresAt` (with `@map` for backward compatibility)
- **New Fields**: Added `ipAddress` and `userAgent` for enhanced security tracking

#### Account Model
- **Field Changes**:
  - `provider` → `providerId` (with `@map` for backward compatibility)
  - `providerAccountId` → `accountId` (with `@map` for backward compatibility)
  - `expires_at` changed from `Int?` to `DateTime?` as `accessTokenExpiresAt`
- **New Fields**: 
  - `refreshTokenExpiresAt` for refresh token management
  - `password` field for email/password authentication
  - `createdAt` and `updatedAt` timestamps

#### Verification Model
- **Renamed**: `VerificationToken` → `Verification`
- **Field Changes**:
  - `token` → `value` (with `@map` for backward compatibility)  
  - `expires` → `expiresAt` (with `@map` for backward compatibility)
- **New Fields**: Added `id`, `createdAt`, and `updatedAt`

### 2. Better Auth Configuration Updates

#### Additional Fields
- Configured all POS-specific user fields as `additionalFields`:
  - `role`, `employeeId`, `firstName`, `lastName`
  - `isActive`, `maxDiscountAllowed`, `canSellBelowMin`
- Set appropriate `input: false` for admin-controlled fields

#### Secondary Storage (Redis)
- Implemented Redis as secondary storage for session management and rate limiting
- Added proper error handling and connection management
- Uses key prefixing (`better-auth:`) for organization

#### Database Hooks
- **User Creation Hooks**:
  - Auto-generates employee IDs in format `EMP-XXXX`
  - Validates employee ID format
  - Ensures required fields are present
  - Sets default values for POS-specific fields
- **User Update Hooks**:
  - Prevents self-role modification
  - Validates employee ID updates
  - Creates audit logs
- **Session Hooks**:
  - Logs session creation for security monitoring

### 3. Environment Variables

Added `BETTER_AUTH_URL` for proper base URL configuration.

### 4. Migration Strategy

The schema changes use `@map` directives to maintain backward compatibility with existing database columns while conforming to Better Auth field naming conventions.

## Benefits of These Updates

### 1. **Standards Compliance**
- Fully compliant with Better Auth v1.3+ requirements
- Future-proofs the authentication system

### 2. **Enhanced Security**
- Session tracking with IP and User Agent
- Improved token management with separate expiration times
- Audit logging for user modifications

### 3. **Better Performance**
- Redis secondary storage offloads session management from PostgreSQL
- Faster session lookups and rate limiting

### 4. **Type Safety**
- Proper TypeScript inference for additional fields
- Better development experience with autocomplete

### 5. **Business Logic Integration**
- Database hooks ensure POS-specific business rules
- Employee ID auto-generation and validation
- Role-based access control enforcement

## Usage Examples

### Creating a User with Additional Fields

```typescript
const user = await auth.api.signUpEmail({
  email: "john.doe@example.com",
  password: "secure-password",
  firstName: "John",
  lastName: "Doe",
})

// Additional fields are automatically set:
// - role: "cashier" (default)
// - employeeId: "EMP-1234" (auto-generated)
// - isActive: true (default)
// - maxDiscountAllowed: 0 (default)
// - canSellBelowMin: false (default)
```

### Accessing User Data

```typescript
// Type-safe access to additional fields
const session = await auth.api.getSession()
if (session.user) {
  console.log(session.user.role)           // "cashier" | "manager" | "admin"
  console.log(session.user.employeeId)    // "EMP-1234"
  console.log(session.user.firstName)     // "John"
  console.log(session.user.maxDiscountAllowed) // 0
}
```

## Next Steps

1. **Testing**: Thoroughly test user creation, session management, and role-based access
2. **Frontend Updates**: Update frontend types to match the new schema
3. **Migration**: Plan production migration strategy if needed
4. **Monitoring**: Set up monitoring for Redis connections and session metrics

## Troubleshooting

### Redis Connection Issues
- Check `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` environment variables
- Verify Redis instance is running and accessible
- Check firewall/network connectivity

### Schema Issues
- Run `npx prisma generate` after schema changes
- Use `npx prisma migrate dev` for development migrations
- Use `npx prisma db push` for quick schema updates during development
