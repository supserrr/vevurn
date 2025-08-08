/**
 * Better Auth Next.js API Route Handler
 * 
 * This file proxies auth requests to the backend Better Auth server
 * Route: /api/auth/[...all]
 */

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Proxy all auth requests to backend
async function handler(request: Request) {
  const url = new URL(request.url);
  const backendPath = url.pathname.replace('/api/auth', '/api/auth');
  const backendUrl = `${backendURL}${backendPath}${url.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      },
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    // Forward the response from backend
    const responseBody = await response.text();
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Auth proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Export Next.js App Router handlers
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;

// Optional: Add custom configurations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
