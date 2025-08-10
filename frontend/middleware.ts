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

  // For now, just check for basic session cookie existence
  // More sophisticated validation should be done in the components
  const sessionCookie = request.cookies.get('better-auth.session_token') || 
                       request.cookies.get('vevurn_auth.session_token');

  if (!sessionCookie) {
    console.log(`[Middleware] No session cookie found, redirecting to login`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers and continue
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
