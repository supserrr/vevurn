# Better Auth Hooks Implementation

## Overview

This document describes our enhanced Better Auth Hooks implementation following the official Better Auth documentation patterns. Hooks provide a powerful way to customize Better Auth's behavior without writing full plugins.

Reference: [Better Auth Hooks Documentation](https://better-auth.com/docs/concepts/hooks)

## Implementation Structure

### Core Hook Types

Following the Better Auth documentation, we've implemented both **Before Hooks** and **After Hooks**:

#### Before Hooks
- Run *before* endpoint execution
- Used for request validation, data modification, and early returns
- Can throw `APIError` to prevent execution

#### After Hooks  
- Run *after* endpoint execution
- Used for response modification, notifications, and side effects
- Access to `newSession` and other context data

## Key Features Implemented

### 1. **Enhanced Validation Hooks** 
Following documentation patterns for request validation:

```typescript
// Email domain restriction for admin accounts
if (ctx.path === "/sign-up/email") {
  const body = ctx.body as any
  const role = body?.role || 'cashier'
  
  // Corporate email validation for admin accounts
  if (role === 'admin') {
    const corporateDomains = ['vevurn.com', 'company.internal']
    const emailDomain = email?.split('@')[1]?.toLowerCase()
    
    if (!corporateDomains.includes(emailDomain)) {
      throw new APIError("BAD_REQUEST", {
        message: `Admin accounts must use corporate email domains`,
      })
    }
  }
}
```

### 2. **POS-Specific Business Logic**
Custom validation for Point of Sale system requirements:

- **Employee ID Format**: Enforces `EMP-XXXX` format
- **Name Requirements**: First and last name mandatory
- **Password Strength**: Minimum 8 characters for security
- **Role-Based Restrictions**: Different rules per user role

### 3. **Enhanced Session Management**
Following documentation patterns for session handling:

```typescript
// User registration success handling
if (ctx.path.startsWith("/sign-up")) {
  const newSession = ctx.context.newSession
  
  if (newSession) {
    const user = newSession.user
    console.log(`✅ New user registered: ${user.name} (${user.email})`)
    
    // Enhanced welcome process for POS system
    console.log(`📊 Audit Log: User registered - ID: ${user.id}`)
  }
}
```

### 4. **Cookie Management**
Implementation following documentation patterns for cookie handling:

```typescript
// Set custom cookies for POS system context
ctx.setCookie("pos-user-role", userRole, {
  maxAge: 60 * 60 * 12, // 12 hours
  httpOnly: false, // Allow frontend access
  sameSite: "strict",
})
```

### 5. **Comprehensive Audit Logging**
Track all authentication events for POS compliance:

- User registration events
- Sign-in/sign-out tracking  
- Password change auditing
- OAuth account linking
- Session refresh monitoring

## Context Utilities

Following the documentation's `ctx` object patterns:

### Available Context Properties

```typescript
const utilities = {
  generateId: (model: string) => ctx.context.generateId({ model }),
  hashPassword: (password: string) => ctx.context.password.hash(password),
  verifyPassword: (data: { password: string, hash: string }) => ctx.context.password.verify(data),
  secret: ctx.context.secret,
  cookies: ctx.context.authCookies,
}
```

### Request/Response Utilities

- **JSON Responses**: `ctx.json()` for structured responses
- **Redirects**: `ctx.redirect()` for flow control
- **Cookie Management**: `ctx.setCookie()` and `ctx.getCookie()`
- **Error Handling**: Throw `APIError` with proper status codes

## Advanced Features

### 1. **Role-Based Onboarding Redirects**
Following documentation patterns for conditional redirects:

```typescript
// Redirect new users to onboarding based on role
if (userRole === 'admin') {
  return ctx.redirect("/admin/onboarding")
} else if (userRole === 'supervisor') {
  return ctx.redirect("/supervisor/onboarding")  
} else {
  return ctx.redirect("/cashier/onboarding")
}
```

### 2. **Enhanced Error Handling**
Custom error messages for better user experience:

```typescript
if (ctx.path === "/sign-in/email" && returned.message.includes("Invalid")) {
  return ctx.json({
    error: "INVALID_CREDENTIALS",
    message: "Invalid email or password. Please check your credentials or contact your supervisor.",
  }, { status: 401 })
}
```

### 3. **OAuth Integration Tracking**
Monitor social authentication flows:

- Provider-specific logging
- Account linking auditing
- Security monitoring for admin accounts

## Configuration Integration

### Auth Configuration
```typescript
// In src/lib/auth.ts
import { authHooks } from "./auth-hooks"

export const auth = betterAuth({
  // ... other configuration
  hooks: authHooks,
})
```

### Hook Structure
```typescript
export const authHooks = {
  before: createAuthMiddleware(async (ctx) => {
    // Before hook logic
  }),
  after: createAuthMiddleware(async (ctx) => {
    // After hook logic  
  }),
}
```

## Benefits

### 1. **Better Auth Documentation Compliance**
- ✅ Follows official patterns exactly
- ✅ Uses recommended `createAuthMiddleware`
- ✅ Proper context object usage
- ✅ Correct error handling patterns

### 2. **POS System Integration**
- ✅ Employee ID validation
- ✅ Role-based business rules  
- ✅ Audit trail compliance
- ✅ Custom cookie management

### 3. **Enhanced Security**
- ✅ Corporate email validation
- ✅ Strong password requirements
- ✅ Admin account monitoring
- ✅ Session tracking

### 4. **Improved User Experience**
- ✅ Clear error messages
- ✅ Role-based onboarding
- ✅ Automatic context setup
- ✅ Seamless OAuth integration

## Testing

The hooks are integrated with the main Better Auth configuration and will be tested with:

1. **User Registration Flow** - Validation and welcome processes
2. **Sign-in Flow** - Authentication and session setup  
3. **Password Management** - Change validation and auditing
4. **OAuth Integration** - Provider validation and linking
5. **Error Scenarios** - Enhanced error handling

## Future Enhancements

Following Better Auth documentation patterns, these hooks can be extended for:

- **Multi-factor Authentication**: Pre and post MFA validation
- **Advanced Rate Limiting**: Per-user and per-role limits
- **Integration Webhooks**: External system notifications
- **Advanced Analytics**: Enhanced tracking and metrics

This implementation demonstrates the power of Better Auth hooks for customizing authentication behavior while maintaining compliance with official documentation patterns.
