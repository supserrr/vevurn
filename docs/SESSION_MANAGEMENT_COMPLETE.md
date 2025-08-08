# Session Management Implementation

## Overview

The Vevurn POS system now includes comprehensive session management capabilities built on top of Better Auth's session management features. This implementation is specifically tailored for POS environments with features like shift management, session monitoring, and administrative controls.

## Features Implemented

### ✅ Core Session Management
- **Session Configuration**: 12-hour sessions for staff shifts
- **Cookie Caching**: 5-minute cache for performance optimization
- **Fresh Session Checks**: 30-minute freshness requirement for sensitive operations
- **Automatic Session Refresh**: Sessions update every 2 hours when active

### ✅ Better Auth Integration
- **Database Sessions**: Traditional cookie-based sessions stored in PostgreSQL
- **Redis Secondary Storage**: High-performance session caching
- **IP Address Tracking**: Session security with IP validation
- **User Agent Tracking**: Device identification for security

### ✅ POS-Specific Features
- **Shift Management**: Force logout for shift changes
- **Employee Session Tracking**: Find sessions by employee ID
- **Role-Based Analytics**: Session statistics by user role
- **Bulk Session Management**: Revoke sessions for administrative control

### ✅ Administrative Tools
- **Session Statistics Dashboard**: Real-time session monitoring
- **Expired Session Cleanup**: Maintenance tasks for performance
- **Session Activity Logging**: Audit trail for security compliance
- **Multi-Device Management**: Handle multiple POS terminals per user

## Configuration

### Session Settings in `auth.ts`
```typescript
session: {
  // 12-hour sessions for POS shifts
  expiresIn: 60 * 60 * 12, // 12 hours
  updateAge: 60 * 60 * 2,  // Update every 2 hours
  freshAge: 60 * 30,       // 30 minutes for sensitive operations
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60         // 5-minute cache
  },
  disableSessionRefresh: false
}
```

## API Reference

### SessionService Class

#### Core Methods

**`getSessionDetails(sessionId: string)`**
- Retrieves detailed session information including user data and freshness status
- Returns: `SessionInfo | null`

**`getUserActiveSessions(userId: string)`**
- Gets all active sessions for a specific user
- Useful for multi-device POS terminals
- Returns: `SessionInfo[]`

**`revokeSession(sessionId: string)`**
- Revokes a specific session by ID
- Returns: `boolean`

**`revokeOtherSessions(userId: string, currentSessionId: string)`**
- Revokes all other sessions except the current one
- Useful for "logout from other devices"
- Returns: `number` (count of revoked sessions)

**`revokeAllSessions(userId: string)`**
- Revokes all sessions for a user
- Returns: `number` (count of revoked sessions)

#### Administrative Methods

**`getSessionStats()`**
- Comprehensive session statistics for admin dashboard
- Returns object with:
  - `totalActiveSessions`: Total active session count
  - `totalUsers`: Number of users with active sessions
  - `sessionsByRole`: Breakdown by user role (cashier, manager, admin)
  - `recentSessions`: Array of most recent sessions

**`cleanupExpiredSessions()`**
- Removes expired sessions from database
- Should be run periodically for maintenance
- Returns: `number` (count of cleaned sessions)

#### POS-Specific Methods

**`getSessionsByEmployeeId(employeeId: string)`**
- Find active sessions by employee ID
- Useful for HR and administrative oversight
- Returns: `SessionInfo[]`

**`forceShiftLogout(userId: string)`**
- Forcibly logout user for shift changes
- Ensures clean handover between employees
- Returns: `boolean`

**`isSessionFresh(sessionId: string)`**
- Check if session is fresh for sensitive operations
- Used for password changes, account linking, etc.
- Returns: `boolean`

## Usage Examples

### Basic Session Management
```typescript
import { SessionService } from '@/lib/session-management'

// Get session details
const session = await SessionService.getSessionDetails(sessionId)
if (session?.isActive) {
  console.log(`Active session for ${session.user?.name}`)
}

// Check if session is fresh for sensitive operation
const isFresh = await SessionService.isSessionFresh(sessionId)
if (!isFresh) {
  // Require re-authentication
  return redirectToLogin()
}
```

### POS Shift Management
```typescript
// End of shift - force logout current user
await SessionService.forceShiftLogout(currentUserId)

// New shift - get sessions by employee ID
const employeeSessions = await SessionService.getSessionsByEmployeeId('EMP001')
if (employeeSessions.length > 0) {
  console.log('Employee already has active sessions')
}
```

### Administrative Dashboard
```typescript
// Get comprehensive session statistics
const stats = await SessionService.getSessionStats()

console.log(`Total active sessions: ${stats.totalActiveSessions}`)
console.log('Sessions by role:', stats.sessionsByRole)
stats.recentSessions.forEach(session => {
  console.log(`${session.user?.name}: ${session.isActive ? 'Active' : 'Expired'}`)
})
```

### Session Security
```typescript
// Revoke sessions on password change
const revokedCount = await SessionService.revokeOtherSessions(
  userId, 
  currentSessionId
)
console.log(`Password changed, revoked ${revokedCount} other sessions`)

// Clean up expired sessions (maintenance task)
const cleanedCount = await SessionService.cleanupExpiredSessions()
console.log(`Maintenance: cleaned ${cleanedCount} expired sessions`)
```

## Database Schema

### Session Table
```sql
-- Sessions table with Better Auth compatibility
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("token")
  userId       String
  expiresAt    DateTime @map("expires")
  ipAddress    String?  -- IP tracking for security
  userAgent    String?  -- Device identification
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

## Performance Considerations

### Cookie Caching
- **Enabled**: 5-minute cache reduces database queries
- **Signed Cookies**: Prevents tampering
- **Automatic Refresh**: Cache updates on session changes

### Redis Secondary Storage
- **Rate Limiting**: Uses Redis for distributed rate limiting
- **Session Caching**: Optional Redis session storage
- **Performance**: Reduces database load for frequent session checks

### Database Optimization
- **Indexed Fields**: `userId`, `expiresAt`, `sessionToken`
- **Automatic Cleanup**: Expired session removal
- **Efficient Queries**: Optimized for POS usage patterns

## Security Features

### Session Security
- **IP Address Validation**: Track and validate session IP
- **User Agent Tracking**: Device fingerprinting
- **Expiration Management**: Automatic session timeout
- **Fresh Session Checks**: Require recent authentication for sensitive operations

### POS-Specific Security
- **Shift Isolation**: Clean session handover between employees
- **Role-Based Access**: Session management by user role
- **Audit Logging**: Session activity tracking
- **Force Logout**: Administrative session control

## Testing

### Test Script
```bash
# Run session management tests
npm run test:session
```

### Test Coverage
- ✅ Session creation and retrieval
- ✅ Session expiration handling
- ✅ User session management
- ✅ POS shift management
- ✅ Administrative statistics
- ✅ Performance benchmarking

## Deployment Notes

### Environment Variables
Required for full functionality:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection (optional but recommended)
- `BETTER_AUTH_SECRET`: Session signing key

### Production Recommendations
1. **Regular Cleanup**: Schedule expired session cleanup
2. **Monitoring**: Monitor session statistics for anomalies
3. **Redis**: Use Redis for better performance in production
4. **Logging**: Enable session activity logging for compliance

## Maintenance

### Regular Tasks
```bash
# Clean expired sessions (can be automated)
await SessionService.cleanupExpiredSessions()

# Monitor session statistics
const stats = await SessionService.getSessionStats()
```

### Monitoring Alerts
- High number of active sessions
- Unusual session patterns
- Failed session operations
- Performance degradation

## Integration Points

### Better Auth Client
- Session management works seamlessly with Better Auth client
- Cookie caching reduces client-side session checks
- Fresh session requirements integrate with auth flows

### POS Application
- Shift management integration
- Employee session monitoring
- Administrative controls
- Real-time session status

## Status: ✅ COMPLETE

The session management implementation is complete and production-ready with:
- ✅ Core session management functionality
- ✅ POS-specific features for shift management
- ✅ Administrative tools and monitoring
- ✅ Security features and audit logging
- ✅ Performance optimization with caching
- ✅ Comprehensive testing suite
- ✅ Full documentation and examples

Your Vevurn POS system now has enterprise-grade session management with all the features needed for a production POS environment!
