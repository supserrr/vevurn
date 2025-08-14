/**
 * Better Auth Middleware for Vevurn POS
 * Provides authentication and authorization middleware using Better Auth
 */

import { Request, Response, NextFunction } from 'express';
import { auth, Session } from '../auth';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

// Define AuthenticatedRequest interface with Better Auth session
export interface AuthenticatedRequest extends Request {
  session?: Session;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    employeeId?: string | null;
    department?: string | null;
    phoneNumber?: string | null;
    lastLoginAt?: Date | null;
  };
}

/**
 * Get the current session from Better Auth
 */
export async function getSession(req: Request): Promise<Session | null> {
  try {
    return await auth.api.getSession({
      headers: req.headers as any,
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    return null;
  }
}

/**
 * Authentication middleware that adds session to request if available
 * This is optional middleware that doesn't block requests
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req);
    
    if (session && session.user) {
      req.session = session;
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as string,
        isActive: session.user.isActive as boolean,
        emailVerified: session.user.emailVerified,
        employeeId: session.user.employeeId as string | null,
        department: session.user.department as string | null,
        phoneNumber: session.user.phoneNumber as string | null,
        lastLoginAt: session.user.lastLoginAt as Date | null,
      };

      logger.info('User authenticated via Better Auth', { 
        userId: session.user.id, 
        role: session.user.role,
        path: req.path 
      });
    }
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(); // Continue without auth for optional middleware
  }
}

/**
 * Protected route middleware - requires authentication
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req);
    
    if (!session || !session.user) {
      throw new CustomError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    if (!session.user.isActive) {
      throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    if (!session.user.emailVerified) {
      throw new CustomError('Email verification required', 403, 'EMAIL_NOT_VERIFIED');
    }
    
    // Add session and user to request
    req.session = session;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as string,
      isActive: session.user.isActive as boolean,
      emailVerified: session.user.emailVerified,
      employeeId: session.user.employeeId as string | null,
      department: session.user.department as string | null,
      phoneNumber: session.user.phoneNumber as string | null,
      lastLoginAt: session.user.lastLoginAt as Date | null,
    };

    logger.info('User accessed protected route', { 
      userId: session.user.id, 
      role: session.user.role,
      path: req.path 
    });
    
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode,
      });
    }
    
    logger.error('RequireAuth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTHENTICATION_ERROR',
    });
  }
}

/**
 * Admin-only middleware
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      throw new CustomError('Admin access required', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    if (!session.user.isActive) {
      throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }
    
    req.session = session;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as string,
      isActive: session.user.isActive as boolean,
      emailVerified: session.user.emailVerified,
      employeeId: session.user.employeeId as string | null,
      department: session.user.department as string | null,
      phoneNumber: session.user.phoneNumber as string | null,
      lastLoginAt: session.user.lastLoginAt as Date | null,
    };

    logger.info('Admin accessed restricted route', { 
      userId: session.user.id,
      path: req.path 
    });
    
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode,
      });
    }
    
    logger.error('RequireAdmin middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'INSUFFICIENT_PERMISSIONS',
    });
  }
}

/**
 * Manager or Admin middleware for POS operations
 */
export async function requireManagerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req);
    
    if (!session || !session.user || !['ADMIN', 'MANAGER'].includes(session.user.role as string)) {
      throw new CustomError('Manager or Admin access required', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    if (!session.user.isActive) {
      throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }
    
    req.session = session;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as string,
      isActive: session.user.isActive as boolean,
      emailVerified: session.user.emailVerified,
      employeeId: session.user.employeeId as string | null,
      department: session.user.department as string | null,
      phoneNumber: session.user.phoneNumber as string | null,
      lastLoginAt: session.user.lastLoginAt as Date | null,
    };

    logger.info('Manager/Admin accessed restricted route', { 
      userId: session.user.id,
      role: session.user.role,
      path: req.path 
    });
    
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode,
      });
    }
    
    logger.error('RequireManagerOrAdmin middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Manager or Admin access required',
      error: 'INSUFFICIENT_PERMISSIONS',
    });
  }
}

/**
 * Role-based middleware factory
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const session = await getSession(req);
      
      if (!session || !session.user || !allowedRoles.includes(session.user.role as string)) {
        throw new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      if (!session.user.isActive) {
        throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
      }
      
      req.session = session;
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as string,
        isActive: session.user.isActive as boolean,
        emailVerified: session.user.emailVerified,
        employeeId: session.user.employeeId as string | null,
        department: session.user.department as string | null,
        phoneNumber: session.user.phoneNumber as string | null,
        lastLoginAt: session.user.lastLoginAt as Date | null,
      };

      logger.info('Role-based access granted', { 
        userId: session.user.id,
        role: session.user.role,
        allowedRoles,
        path: req.path 
      });
      
      next();
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.errorCode,
        });
      }
      
      logger.error('RequireRole middleware error:', error);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
      });
    }
  };
}
