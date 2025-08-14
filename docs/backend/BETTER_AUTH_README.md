# Better Auth Integration for Vevurn POS

This document explains how to use the new Better Auth authentication system that has been integrated into the Vevurn POS backend.

## Overview

Better Auth has been configured with comprehensive features for the POS system:

- **Email & Password Authentication** with email verification
- **Role-based Access Control** (Admin, Manager, Cashier)
- **Password Reset** functionality
- **Session Management** with configurable expiration
- **Rate Limiting** for security
- **Audit Logging** via database hooks
- **User Management** (account deletion, email changes)
- **CORS** configuration for frontend integration

## Configuration Files

### 1. `src/auth.ts` 
Main Better Auth configuration with:
- Database adapter (Prisma)
- User schema customization with POS-specific fields
- Email service integration
- Admin plugin configuration
- Database hooks for audit logging

### 2. `src/services/email.service.ts`
Email service for sending authentication emails:
- Password reset emails
- Email verification 
- Account deletion confirmations
- Email change notifications

### 3. `src/middleware/better-auth.middleware.ts`
Express middleware utilities for:
- Session management
- Route protection
- Role-based authorization

## Environment Variables

Add these to your `.env` file:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-better-auth-key-change-this-in-production
BETTER_AUTH_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ADMIN_USER_IDS=

# Email Configuration (optional - for production)
EMAIL_PROVIDER=sendgrid  # or mailgun, ses, etc.
EMAIL_API_KEY=your-email-api-key
```

## Database Integration

The auth system is fully integrated with your existing Prisma schema:

- Uses existing `User`, `Account`, `Session`, and `Verification` models
- Automatically creates audit logs in `AuditLog` model
- Generates employee IDs for new users
- Tracks login activities and user changes

## API Endpoints

Better Auth automatically provides these endpoints:

```
POST /api/auth/sign-up          # User registration
POST /api/auth/sign-in          # User login  
POST /api/auth/sign-out         # User logout
POST /api/auth/reset-password   # Password reset request
POST /api/auth/verify-email     # Email verification
GET  /api/auth/session          # Get current session
POST /api/auth/change-email     # Change email address
POST /api/auth/delete-user      # Delete user account

# Admin endpoints (requires ADMIN role)
GET  /api/auth/admin/users      # List all users
POST /api/auth/admin/ban-user   # Ban a user
POST /api/auth/admin/unban-user # Unban a user
POST /api/auth/admin/impersonate # Impersonate a user
```

## Usage in Routes

### Protecting Routes

```typescript
import { requireAuth, requireAdmin, requireManagerOrAdmin } from './middleware/better-auth.middleware';

// Protected route (any authenticated user)
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// Admin only
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json({ message: 'Admin settings' });
});

// Manager or Admin (for POS operations)
app.get('/api/sales/reports', requireManagerOrAdmin, (req, res) => {
  res.json({ message: 'Sales reports' });
});
```

### Getting Current Session

```typescript
import { getSession } from './middleware/better-auth.middleware';

app.get('/api/dashboard', async (req, res) => {
  const session = await getSession(req);
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Session contains:
  // - session.user.id
  // - session.user.email  
  // - session.user.name
  // - session.user.role
  // - session.user.employeeId
  // - session.user.department
  // etc.
  
  res.json({ 
    welcome: \`Welcome \${session.user.name}\`,
    role: session.user.role 
  });
});
```

## User Roles

The system supports three user roles:

1. **ADMIN** - Full system access, user management
2. **MANAGER** - Sales operations, reporting, inventory management  
3. **CASHIER** - Basic sales operations, customer service

## Security Features

### Rate Limiting
- 10 requests per minute (general)
- 5 login attempts per 5 minutes
- 3 password reset attempts per 15 minutes

### Session Management
- 7-day session expiration
- Automatic session refresh
- Secure cookie configuration

### Audit Logging
Automatically logs:
- User creation/updates
- Login/logout activities
- Password changes
- Admin actions

## Email Templates

The system includes basic email templates for:
- Password reset
- Email verification
- Account deletion confirmation
- Email change notification

For production, integrate with a proper email service provider.

## Frontend Integration

For React/Next.js frontend integration, use the Better Auth client:

```bash
npm install @better-auth/react
```

```typescript
import { createClient } from '@better-auth/client'

export const authClient = createClient({
  baseURL: 'http://localhost:5000',  // Your backend URL
})
```

## Migration from JWT Auth

If you have existing JWT-based authentication:

1. The new system is independent and can run alongside existing auth
2. Users will need to re-register or migrate accounts
3. Update frontend to use Better Auth endpoints
4. Remove old JWT middleware once migration is complete

## Testing

The auth configuration has been tested and is ready to use. The system integrates with your existing database and includes comprehensive error handling.

## Support

For issues with Better Auth, refer to:
- [Better Auth Documentation](https://better-auth.com)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
