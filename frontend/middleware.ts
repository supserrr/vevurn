/**
 * Next.js Middleware for Better Auth
 * 
 * This middleware handles authentication checks and redirections
 * for protected routes in the Vevurn POS system
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/pos',
  '/inventory',
  '/sales',
  '/reports',
  '/settings',
  '/admin',
];

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/settings/users',
  '/settings/roles',
];

// Define manager-level routes
const managerRoutes = [
  '/reports/financial',
  '/settings/store',
  '/inventory/manage',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session cookie to check if user is authenticated
  const sessionCookie = getSessionCookie(request, {
    cookieName: "better-auth.session_token",
    cookiePrefix: "vevurn_auth"
  });

  // WARNING: This only checks for cookie existence, not validity
  // Always validate the session on the server for security
  if (!sessionCookie) {
    console.log(`[Middleware] No session cookie found, redirecting to login`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For role-specific routes, we need to fetch the full session
  // This requires making an API call which should be done carefully
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isManagerRoute = managerRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute || isManagerRoute) {
    try {
      // Make an API call to validate session and get user role
      const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (!sessionResponse.ok) {
        console.log(`[Middleware] Session validation failed, redirecting to login`);
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const session = await sessionResponse.json();

      // Check role permissions
      if (isAdminRoute && session.user.role !== 'admin') {
        console.log(`[Middleware] Admin access denied for role: ${session.user.role}`);
        return NextResponse.redirect(new URL('/dashboard?error=insufficient_permissions', request.url));
      }

      if (isManagerRoute && !['admin', 'manager'].includes(session.user.role)) {
        console.log(`[Middleware] Manager access denied for role: ${session.user.role}`);
        return NextResponse.redirect(new URL('/dashboard?error=insufficient_permissions', request.url));
      }

      // Check if user account is active
      if (!session.user.isActive) {
        console.log(`[Middleware] Inactive account detected`);
        return NextResponse.redirect(new URL('/login?error=account_inactive', request.url));
      }

    } catch (error) {
      console.error('[Middleware] Error validating session:', error);
      // On error, redirect to login for security
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
