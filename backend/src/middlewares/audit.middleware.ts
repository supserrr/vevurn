import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';

const prisma = new PrismaClient();

// Audit middleware to log API requests
export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip audit logging for certain routes
  const skipRoutes = [
    '/api/health',
    '/api/auth/session', // Too frequent, handled by auth hooks
  ];
  
  const shouldSkip = skipRoutes.some(route => req.path.startsWith(route));
  if (shouldSkip) {
    return next();
  }
  
  // Skip GET requests to reduce noise (only log mutations)
  if (req.method === 'GET') {
    return next();
  }
  
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    const userId = session?.user?.id || null;
    
    // Log the request
    await prisma.auditLog.create({
      data: {
        userId,
        action: `${req.method}_${req.path.replace('/api/', '').replace(/\//g, '_').toUpperCase()}`,
        resourceType: 'API_REQUEST',
        resourceId: null,
        newValues: {
          method: req.method,
          path: req.path,
          query: req.query,
          // Don't log sensitive data like passwords
          body: sanitizeRequestBody(req.body),
        },
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
      },
    }).catch(error => {
      // Don't fail the request if audit logging fails
      console.error('Audit logging failed:', error);
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit middleware error:', error);
  }
  
  next();
};

// Helper function to get client IP
function getClientIP(req: Request): string | null {
  return (
    req.get('x-forwarded-for') ||
    req.get('x-real-ip') ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
}

// Helper function to sanitize request body (remove sensitive fields)
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
  ];
  
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
