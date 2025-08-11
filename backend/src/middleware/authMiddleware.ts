import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    role?: string | null;
    firstName?: string;
    lastName?: string;
    [key: string]: any; // Allow for additional fields
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Authentication middleware using Better Auth
 * Follows Express integration documentation
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in to access this resource.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Attach user and session to request object
    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication service error. Please try again.',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Optional authentication middleware - sets user if authenticated but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Continue without authentication for optional auth
    next();
  }
}

/**
 * Middleware to require email verification
 */
export async function requireEmailVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required. Please verify your email address to access this resource.',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to require fresh session for sensitive operations
 */
export async function requireFreshSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.session) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if session is fresh (within 2 hours for sensitive operations)
    const sessionAge = Date.now() - new Date(req.session.createdAt).getTime();
    const maxFreshAge = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    if (sessionAge > maxFreshAge) {
      res.status(403).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FRESH',
          message: 'This operation requires a fresh session. Please sign in again.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Fresh session middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_ERROR',
        message: 'Session validation error. Please try again.',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Note: This assumes role is stored in user object
    // Adjust based on your user schema
    const userRole = (req.user as any).role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}
