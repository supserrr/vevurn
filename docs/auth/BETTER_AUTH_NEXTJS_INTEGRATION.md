# Better Auth Next.js Integration - Complete Implementation Guide

## Overview

This guide demonstrates the complete integration of Better Auth with Next.js App Router for the Vevurn POS system. The integration provides secure authentication with server-side rendering, middleware protection, and type-safe React hooks.

## Key Features

✅ **Next.js App Router Integration**  
✅ **Server-Side Session Management**  
✅ **Type-Safe React Hooks**  
✅ **Route Protection Middleware**  
✅ **Role-Based UI Components**  
✅ **POS-Specific Permission System**  
✅ **Automatic Cookie Handling**

## Architecture

### 1. API Route Handler (`/app/api/auth/[...all]/route.ts`)

This route proxies all auth requests to the backend Better Auth server:

```typescript
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function handler(request: Request) {
  const url = new URL(request.url);
  const backendPath = url.pathname.replace('/api/auth', '/api/auth');
  const backendUrl = `${backendURL}${backendPath}${url.search}`;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
    },
    body: request.method !== 'GET' ? await request.text() : undefined,
  });

  return new Response(await response.text(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const GET = handler;
export const POST = handler;
```

### 2. Auth Client Configuration (`/lib/auth.ts`)

```typescript
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: backendURL,
  basePath: "/api/auth",
  plugins: [
    inferAdditionalFields<{
      firstName: string;
      lastName: string;
      role: string;
      isActive: boolean;
      maxDiscountAllowed: number;
      canSellBelowMin: boolean;
      employeeId: string | null;
    }>(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  changePassword,
  resetPassword,
} = authClient;
```

### 3. Next.js Middleware (`/middleware.ts`)

Provides route protection and role-based access control:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutes = ['/dashboard', '/pos', '/inventory', '/admin'];
const adminRoutes = ['/admin', '/settings/users'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request, {
    cookieName: "better-auth.session_token",
    cookiePrefix: "vevurn_auth"
  });

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-specific validation for sensitive routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (isAdminRoute) {
    try {
      const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      });

      if (!sessionResponse.ok) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const session = await sessionResponse.json();
      
      if (session.user.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard?error=insufficient_permissions', request.url));
      }

      if (!session.user.isActive) {
        return NextResponse.redirect(new URL('/login?error=account_inactive', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### 4. React Hooks (`/lib/auth-hooks.tsx`)

Provides type-safe hooks for authentication and POS permissions:

```typescript
export function useVevurnAuth() {
  const session = useSession();
  
  return {
    user: session.data?.user as VevurnUser | null,
    session: session.data as VevurnSession | null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error
  };
}

export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useVevurnAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

export function useRequireRole(requiredRoles: string | string[]) {
  const { user, isLoading } = useVevurnAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(user.role)) {
        router.push('/dashboard?error=insufficient_permissions');
      }
    }
  }, [user, isLoading, requiredRoles, router]);

  return { user, isLoading, hasPermission: user ? roles.includes(user.role) : false };
}

export function useDiscountPermission() {
  const { user } = useVevurnAuth();
  
  return {
    maxDiscountAllowed: user?.maxDiscountAllowed || 0,
    canApplyDiscount: (discount: number) => {
      if (!user || !user.isActive) return false;
      return discount <= user.maxDiscountAllowed;
    }
  };
}
```

## Page Examples

### 1. Login Page (`/app/login/page.tsx`)

```typescript
'use client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { isAuthenticated } = useVevurnAuth();
  const { signIn } = useAuthActions();
  const searchParams = useSearchParams();
  
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password, callbackUrl);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Login form UI */}
    </form>
  );
}
```

### 2. Dashboard Page (Server Component)

```typescript
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getSession() {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const headersList = await headers();
  
  const response = await fetch(`${backendURL}/api/auth/get-session`, {
    headers: { cookie: headersList.get("cookie") || "" },
    cache: 'no-store',
  });

  return response.ok ? await response.json() : null;
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  if (!session.user.isActive) {
    redirect('/login?error=account_inactive');
  }

  return (
    <div>
      <h1>Welcome, {session.user.firstName} {session.user.lastName}</h1>
      <DashboardClient initialSession={session} />
    </div>
  );
}
```

### 3. Protected Components

```typescript
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback = <div>Loading...</div> 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  
  if (requiredRole) {
    const { hasPermission, isLoading: roleLoading } = useRequireRole(requiredRole);
    
    if (isLoading || roleLoading) return fallback;
    if (!isAuthenticated || !hasPermission) return null;
  } else {
    if (isLoading) return fallback;
    if (!isAuthenticated) return null;
  }

  return <>{children}</>;
}

// Usage
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

## Environment Configuration

Add these environment variables to `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Better Auth Configuration (if needed)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

## Security Features

### 1. Server-Side Session Validation

```typescript
// Always validate sessions on the server for protected pages
const session = await getSession();
if (!session) redirect('/login');
```

### 2. Middleware Route Protection

```typescript
// Middleware checks session cookies before page loads
const sessionCookie = getSessionCookie(request);
if (!sessionCookie) return NextResponse.redirect(loginUrl);
```

### 3. Role-Based Access Control

```typescript
// Check user roles on both client and server
if (!['admin', 'manager'].includes(user.role)) {
  redirect('/dashboard?error=insufficient_permissions');
}
```

### 4. POS Permission System

```typescript
// Granular POS permissions
const canApplyDiscount = (discount: number) => {
  return user.isActive && discount <= user.maxDiscountAllowed;
};
```

## Component Usage Examples

### 1. Dashboard with Permissions

```typescript
export function POSDashboard() {
  const { user } = useVevurnAuth();
  const { canApplyDiscount } = useDiscountPermission();
  const { canSellBelowMin } = useBelowMinimumPermission();

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      
      {canApplyDiscount(10) && (
        <button>Apply 10% Discount</button>
      )}
      
      {canSellBelowMin && (
        <button>Sell Below Minimum</button>
      )}
      
      {['admin', 'manager'].includes(user?.role) && (
        <AdminControls />
      )}
    </div>
  );
}
```

### 2. User Profile Component

```typescript
export function UserProfile() {
  const { user } = useVevurnAuth();
  const { signOut } = useAuthActions();

  return (
    <div>
      <h3>{user?.firstName} {user?.lastName}</h3>
      <p>Role: {user?.role}</p>
      <p>Max Discount: {user?.maxDiscountAllowed}%</p>
      <p>Below Min Sales: {user?.canSellBelowMin ? 'Yes' : 'No'}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Testing the Integration

### 1. Start the Development Server

```bash
cd /Users/password/vevurn/frontend
npm run dev
```

### 2. Test Authentication Flow

1. Navigate to `http://localhost:3000/dashboard`
2. Should redirect to `/login` (middleware protection)
3. Enter credentials and sign in
4. Should redirect back to `/dashboard`
5. Test role-based features

### 3. Test Permission System

```bash
# In browser console
console.log(await authClient.getSession());
```

## Key Implementation Benefits

1. **Server-Side Security**: Session validation on server prevents client-side bypasses
2. **Middleware Protection**: Routes protected before page loads
3. **Type Safety**: Full TypeScript support with inferred types
4. **POS-Specific**: Custom permission system for retail operations
5. **Performance**: Server-side rendering with client-side interactivity
6. **Error Handling**: Comprehensive error states and redirects

## Next Steps

1. **Complete UI Components**: Build full POS interface
2. **Testing**: Add comprehensive test coverage
3. **Performance**: Optimize session checks and caching
4. **Documentation**: API documentation for components
5. **Monitoring**: Add authentication analytics

---

This Next.js integration provides a production-ready authentication system with server-side security, type-safe client components, and POS-specific features for the Vevurn system.
