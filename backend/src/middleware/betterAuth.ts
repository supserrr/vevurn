/**
 * Better Auth Express Middleware
 * 
 * Provides Express middleware for Better Auth integration
 */

import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

// Simple logger fallback
const logger = {
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error)
};

// Extend Express Request type to include Better Auth session
declare global {
  namespace Express {
    interface Request {
      betterAuth?: {
        session: any;
        user: any;
      };
    }
  }
}

/**
 * Middleware to attach Better Auth session to request object
 */
export const attachBetterAuthSession = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    req.betterAuth = {
      session: session,
      user: session?.user || null
    };

    next();
  } catch (error) {
    logger.error('Error attaching Better Auth session:', error);
    req.betterAuth = {
      session: null,
      user: null
    };
    next();
  }
};

/**
 * Middleware to require authentication
 */
export const requireBetterAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.betterAuth) {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      req.betterAuth = {
        session: session,
        user: session?.user || null
      };
    }

    if (!req.betterAuth.session || !req.betterAuth.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    if (!req.betterAuth.user.isActive) {
      res.status(403).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in requireBetterAuth middleware:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to require specific role
 */
export const requireRole = (requiredRoles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.betterAuth?.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'You must be logged in to access this resource'
        });
        return;
      }

      const user = req.betterAuth.user;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(user.role)) {
        res.status(403).json({
          error: 'Insufficient permissions',
          message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${user.role}`
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          error: 'Account inactive',
          message: 'Your account has been deactivated'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in requireRole middleware:', error);
      res.status(500).json({
        error: 'Authorization error',
        message: 'Internal server error during authorization'
      });
    }
  };
};

/**
 * Helper function to get current user from request
 */
export const getCurrentUser = (req: Request) => {
  return req.betterAuth?.user || null;
};

/**
 * Helper function to get current session from request
 */
export const getCurrentSession = (req: Request) => {
  return req.betterAuth?.session || null;
};

export default {
  attachBetterAuthSession,
  requireBetterAuth,
  requireRole,
  getCurrentUser,
  getCurrentSession
};
