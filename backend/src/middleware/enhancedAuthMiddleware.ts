// Enhanced Authentication Middleware - Integrated with Enhanced Error Handler
// This middleware provides JWT authentication with enhanced security features

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { JwtSecurityService } from '../services/JwtSecurityService';
import { ErrorTrackingService } from '../services/ErrorTrackingService';
import { logger } from '../utils/logger';
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError 
} from './enhancedErrorHandler';

const prisma = new PrismaClient();

export interface EnhancedAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
    maxDiscountAllowed: number;
    canSellBelowMin: boolean;
    sessionId: string;
    deviceFingerprint: string;
  };
  requestId?: string;
  correlationId?: string;
}

/**
 * Enhanced authentication middleware with security tracking
 * Integrates with the Enhanced Error Handler Middleware system
 */
export const enhancedAuthMiddleware = async (
  req: EnhancedAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const jwtService = JwtSecurityService.getInstance();
  const errorTracker = ErrorTrackingService.getInstance();

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      throw new AuthenticationError('Authentication token required');
    }

    // Get request context
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Validate token with enhanced security checks
    const payload = await jwtService.validateAccessToken(token, ipAddress, userAgent);
    
    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true
      }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      // Track security event for inactive user access attempt
      await errorTracker.captureError(new Error('Inactive user access attempt'), {
        component: 'enhancedAuthMiddleware',
        operation: 'validateUser',
        userId: user.id,
        sessionId: payload.sessionId,
        ipAddress,
        userAgent,
        additionalData: { riskLevel: 'medium' }
      }, req);
      
      throw new AuthorizationError('User account is inactive');
    }

    // Attach user information to request
    req.user = {
      ...user,
      maxDiscountAllowed: user.maxDiscountAllowed || 0,
      canSellBelowMin: user.canSellBelowMin || false,
      sessionId: payload.sessionId,
      deviceFingerprint: payload.deviceFingerprint
    };

    // Track successful authentication (non-blocking)
    setImmediate(async () => {
      try {
        await errorTracker.captureError(new Error('AUTH_SUCCESS'), {
          component: 'enhancedAuthMiddleware',
          operation: 'authenticate',
          userId: user.id,
          sessionId: payload.sessionId,
          additionalData: {
            deviceFingerprint: payload.deviceFingerprint,
            riskLevel: 'low',
            success: true
          }
        }, req);
      } catch (trackingError) {
        logger.warn('Failed to track auth success', { error: (trackingError as Error).message });
      }
    });

    next();
  } catch (error) {
    // Track authentication failure (non-blocking)
    setImmediate(async () => {
      try {
        await errorTracker.captureError(error as Error, {
          component: 'enhancedAuthMiddleware',
          operation: 'authenticate',
          additionalData: {
            riskLevel: 'high',
            success: false
          }
        }, req);
      } catch (trackingError) {
        logger.warn('Failed to track auth failure', { error: (trackingError as Error).message });
      }
    });

    // Pass to enhanced error handler
    next(error);
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req: EnhancedAuthenticatedRequest, _res: Response, next: NextFunction) => {
    const errorTracker = ErrorTrackingService.getInstance();

    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        // Track authorization failure
        await errorTracker.captureError(new Error('Authorization failure'), {
          component: 'requireRole',
          operation: 'checkRole',
          userId: req.user.id,
          additionalData: {
            userRole: req.user.role,
            requiredRoles: allowedRoles,
            riskLevel: 'medium'
          }
        }, req);

        throw new AuthorizationError(
          `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Manager or admin middleware
 */
export const requireManager = requireRole(['admin', 'manager']);

/**
 * Staff, manager, or admin middleware
 */
export const requireStaff = requireRole(['admin', 'manager', 'staff']);

/**
 * Permission-based middleware factory
 * Checks if user has specific permissions based on role and user properties
 */
export const requirePermission = (permission: string) => {
  return async (req: EnhancedAuthenticatedRequest, _res: Response, next: NextFunction) => {
    const errorTracker = ErrorTrackingService.getInstance();

    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      let hasPermission = false;

      // Check permissions based on role and specific permission
      switch (permission) {
        case 'sell_below_minimum':
          hasPermission = req.user.role === 'admin' || req.user.canSellBelowMin;
          break;
          
        case 'apply_discount':
          // Check if user can apply discount based on their role and discount limit
          const requestedDiscount = parseFloat(req.body?.discountPercentage || '0');
          hasPermission = req.user.role === 'admin' || 
            (req.user.maxDiscountAllowed >= requestedDiscount);
          break;
          
        case 'manage_inventory':
          hasPermission = ['admin', 'manager'].includes(req.user.role);
          break;
          
        case 'view_reports':
          hasPermission = ['admin', 'manager'].includes(req.user.role);
          break;
          
        case 'manage_users':
          hasPermission = req.user.role === 'admin';
          break;
          
        default:
          hasPermission = false;
      }

      if (!hasPermission) {
        // Track permission denial
        await errorTracker.captureError(new Error('Permission denied'), {
          component: 'requirePermission',
          operation: 'checkPermission',
          userId: req.user.id,
          additionalData: {
            userRole: req.user.role,
            requestedPermission: permission,
            riskLevel: 'medium'
          }
        }, req);

        throw new AuthorizationError(
          `Permission denied: ${permission}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 * Simple in-memory rate limiting (for production, use Redis-based solution)
 */
class SimpleRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return 0;
    
    return Math.max(0, record.resetTime - Date.now());
  }
}

const authRateLimiter = new SimpleRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes

/**
 * Rate limiting middleware for authentication attempts
 */
export const authRateLimit = async (
  req: EnhancedAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const errorTracker = ErrorTrackingService.getInstance();
  
  try {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!authRateLimiter.isAllowed(identifier)) {
      const remainingTime = authRateLimiter.getRemainingTime(identifier);
      
      // Track rate limit exceeded
      await errorTracker.captureError(new Error('Rate limit exceeded'), {
        component: 'authRateLimit',
        operation: 'checkRateLimit',
        additionalData: {
          identifier,
          remainingTime,
          riskLevel: 'high'
        }
      }, req);

      throw new ValidationError(
        `Too many authentication attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to track API usage for authenticated users
 */
export const trackApiUsage = async (
  req: EnhancedAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user) {
    const errorTracker = ErrorTrackingService.getInstance();
    
    // Track API usage (non-blocking)
    setImmediate(async () => {
      try {
        await errorTracker.captureError(new Error('API_USAGE'), {
          component: 'trackApiUsage',
          operation: 'trackUsage',
          userId: req.user!.id,
          additionalData: {
            endpoint: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
          }
        }, req);
      } catch (error) {
        logger.warn('Failed to track API usage', { error: (error as Error).message });
      }
    });
  }
  
  next();
};

/**
 * Logout middleware that blacklists the current token
 */
export const logoutMiddleware = async (
  req: EnhancedAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jwtService = JwtSecurityService.getInstance();
  const errorTracker = ErrorTrackingService.getInstance();

  try {
    const token = req.headers.authorization?.substring(7);
    
    if (token && req.user) {
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti) {
        await jwtService.blacklistToken(decoded.jti);
      }

      // Track logout (non-blocking)
      setImmediate(async () => {
        try {
          await errorTracker.captureError(new Error('USER_LOGOUT'), {
            component: 'logoutMiddleware',
            operation: 'logout',
            userId: req.user!.id,
            additionalData: {
              sessionId: req.user!.sessionId,
              riskLevel: 'low'
            }
          }, req);
        } catch (trackingError) {
          logger.warn('Failed to track logout', { error: (trackingError as Error).message });
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
