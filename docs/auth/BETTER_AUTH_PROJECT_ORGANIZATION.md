# Better Auth Project Structure & Organization

## Overview

This document outlines the complete, organized structure for Better Auth integration in the Vevurn POS system, ensuring all files are properly connected and organized.

## 📁 Project Structure

```
vevurn/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── index.ts                    # Main auth exports
│   │   │   ├── auth.ts                     # Better Auth configuration
│   │   │   ├── auth-types.ts              # Type definitions
│   │   │   ├── user-service.ts            # User management functions
│   │   │   ├── database-hooks.ts          # Database lifecycle hooks
│   │   │   ├── redis-storage.ts           # Redis session storage
│   │   │   └── email-service.ts           # Email templates & sending
│   │   ├── middleware/
│   │   │   ├── index.ts                   # Middleware exports
│   │   │   ├── betterAuth.ts              # Better Auth middleware (RECOMMENDED)
│   │   │   ├── auth.ts                    # Legacy auth middleware
│   │   │   ├── errorHandler.ts            # Error handling
│   │   │   └── rateLimiter.ts             # Rate limiting
│   │   └── index.ts                       # Main Express server
│   └── test-better-auth-integration.js    # Integration test script
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── route.ts           # API proxy to backend
│   │   ├── login/
│   │   │   └── page.tsx                   # Login page
│   │   └── dashboard/
│   │       ├── page.tsx                   # Dashboard (server component)
│   │       └── dashboard-client.tsx       # Dashboard (client component)
│   ├── lib/
│   │   ├── index.ts                       # Main auth exports
│   │   ├── auth.ts                        # Better Auth React client
│   │   └── auth-hooks.tsx                 # React hooks & components
│   ├── middleware.ts                      # Next.js route protection
│   └── tsconfig.json                      # TypeScript config with path aliases
└── docs/
    ├── BETTER_AUTH_EXPRESS_INTEGRATION.md  # Express integration guide
    ├── BETTER_AUTH_NEXTJS_INTEGRATION.md   # Next.js integration guide
    └── BETTER_AUTH_PROJECT_ORGANIZATION.md # This file
```

## 🔧 Import Structure

### Backend Imports

```typescript
// Main auth instance and types
import { auth, VevurnUser, VevurnSession } from './lib/index.js';

// Middleware (RECOMMENDED - Better Auth)
import { 
  attachBetterAuthSession, 
  requireBetterAuth, 
  requireRole 
} from './middleware/index.js';

// User management
import { getUserById, updateUser } from './lib/index.js';
```

### Frontend Imports

```typescript
// Main auth functionality (RECOMMENDED)
import { 
  useVevurnAuth, 
  useRequireAuth, 
  useDiscountPermission,
  signIn,
  signOut 
} from '@/lib/index';

// Or direct imports
import { useVevurnAuth } from '@/lib/auth-hooks';
import { signIn } from '@/lib/auth';

// Components
import { ProtectedRoute, UserProfile } from '@/lib/auth-hooks';
```

## 🔄 File Connections

### 1. Backend Flow

```
index.ts (Express server)
    ↓
lib/index.ts (exports)
    ↓
├── lib/auth.ts (Better Auth config)
├── lib/auth-types.ts (TypeScript types)
├── lib/user-service.ts (user management)
└── middleware/betterAuth.ts (Express middleware)
```

### 2. Frontend Flow

```
app/*/page.tsx (Next.js pages)
    ↓
lib/index.ts (exports)
    ↓
├── lib/auth.ts (React client)
├── lib/auth-hooks.tsx (React hooks)
└── middleware.ts (route protection)
    ↓
app/api/auth/[...all]/route.ts (proxy to backend)
```

## 📋 Key Integration Points

### 1. TypeScript Path Aliases

**Frontend `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/components/*": ["./components/*"],
      "@/app/*": ["./app/*"]
    }
  }
}
```

### 2. Environment Variables

**Backend `.env`:**
```bash
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=your-secret-here
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
BETTER_AUTH_SECRET=same-secret-as-backend
```

### 3. Package Dependencies

**Backend:**
```json
{
  "dependencies": {
    "better-auth": "^1.3.0",
    "express": "^4.18.0",
    "@prisma/client": "^5.0.0",
    "redis": "^4.6.0"
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "better-auth": "^1.3.0",
    "next": "^14.0.0",
    "react": "^18.0.0"
  }
}
```

## 🚀 Usage Examples

### 1. Backend Route Protection

```typescript
import { requireBetterAuth, requireRole } from './middleware/index.js';

// Require authentication
app.get('/api/protected', requireBetterAuth, (req, res) => {
  const user = getCurrentUser(req);
  res.json({ user });
});

// Require admin role
app.get('/api/admin', requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

### 2. Frontend Component Protection

```tsx
import { ProtectedRoute, useVevurnAuth } from '@/lib';

function MyComponent() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  );
}

function UserInfo() {
  const { user } = useVevurnAuth();
  return <div>Welcome, {user?.firstName}!</div>;
}
```

### 3. Server-Side Session Check

```tsx
// app/dashboard/page.tsx
import { headers } from "next/headers";

async function getSession() {
  const response = await fetch('/api/auth/get-session', {
    headers: { cookie: (await headers()).get("cookie") || "" },
  });
  return response.ok ? await response.json() : null;
}

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect('/login');
  
  return <DashboardClient session={session} />;
}
```

## ✅ Organization Checklist

### Backend
- [x] `lib/index.ts` - Central auth exports
- [x] `lib/auth.ts` - Better Auth configuration
- [x] `lib/auth-types.ts` - TypeScript definitions
- [x] `middleware/index.ts` - Middleware exports
- [x] `middleware/betterAuth.ts` - Better Auth middleware
- [x] Express server properly configured with Better Auth handler

### Frontend
- [x] `lib/index.ts` - Central auth exports
- [x] `lib/auth.ts` - React client configuration
- [x] `lib/auth-hooks.tsx` - React hooks and components
- [x] `app/api/auth/[...all]/route.ts` - API proxy
- [x] `middleware.ts` - Route protection
- [x] `tsconfig.json` - Path aliases configured

### Documentation
- [x] Express integration guide
- [x] Next.js integration guide
- [x] Project organization guide (this file)
- [x] Testing scripts

## 🧪 Testing

### 1. Backend Integration Test
```bash
cd backend
node test-better-auth-integration.js
```

### 2. Frontend Development
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/dashboard
# Should redirect to /login
```

### 3. Full Stack Test
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test authentication flow
4. Verify role-based access
5. Check permission system

## 📚 Migration Guide

### From Old Auth System

1. **Backup existing files:**
   ```bash
   mv lib/auth-client.ts lib/auth-client.ts.backup
   mv lib/use-pos-auth.ts lib/use-pos-auth.ts.backup
   ```

2. **Update imports:**
   ```typescript
   // OLD
   import { usePOSAuth } from './use-pos-auth';
   
   // NEW
   import { useVevurnAuth } from '@/lib';
   ```

3. **Update components:**
   ```typescript
   // OLD
   const { user, canApplyDiscount } = usePOSAuth();
   
   // NEW
   const { user } = useVevurnAuth();
   const { canApplyDiscount } = useDiscountPermission();
   ```

## 🔒 Security Best Practices

1. **Always validate sessions server-side**
2. **Use middleware for route protection**
3. **Implement proper error handling**
4. **Configure CORS correctly**
5. **Use HTTPS in production**
6. **Rotate secrets regularly**
7. **Monitor authentication events**

---

This organization ensures:
- ✅ **Clean separation of concerns**
- ✅ **Type safety throughout**
- ✅ **Easy imports with path aliases**
- ✅ **Backward compatibility**
- ✅ **Comprehensive documentation**
- ✅ **Testing capabilities**
