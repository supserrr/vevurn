import { Request, Response, NextFunction } from 'express';
import { JwtSecurityService } from '../services/JwtSecurityService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const jwtService = new JwtSecurityService();

// Custom error class for authentication errors
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string | undefined;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = 'AppError';
  }
}

// Extended request interface with user and session info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string | undefined;
    lastName: string | undefined;
    role: string;
    sessionId: string;
    deviceFingerprint: string;
    maxDiscountAllowed: number | undefined;
    canSellBelowMin: boolean | undefined;
  };
  sessionInfo?: {
    sessionId: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    lastActivity: string;
    isActive: boolean;
  };
}

/**
 * Enhanced Authentication Middleware
 * Provides comprehensive JWT authentication with device fingerprinting, session management,
 * token blacklisting, audit logging, and security headers
 */
export const enhancedAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization header missing or invalid', 401, 'AUTH_HEADER_MISSING');
    }

    const token = authHeader.substring(7);
    if (!token) {
      throw new AppError('Access token missing', 401, 'TOKEN_MISSING');
    }

    // Get client information for device fingerprinting
    const clientInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: (req.ip || req.connection.remoteAddress || '127.0.0.1') as string,
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || ''
    };

    // Validate token with enhanced security checks
    const payload = await jwtService.validateAccessToken(token, clientInfo.ip, clientInfo.userAgent);
    
    if (!payload) {
      throw new AppError('Invalid or expired token', 401, 'TOKEN_INVALID');
    }

    // Get user details from database
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
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Attach user and session info to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      sessionId: payload.sessionId,
      deviceFingerprint: payload.deviceFingerprint,
      maxDiscountAllowed: user.maxDiscountAllowed || undefined,
      canSellBelowMin: user.canSellBelowMin || undefined
    };
    req.sessionInfo = {
      sessionId: payload.sessionId,
      deviceFingerprint: payload.deviceFingerprint,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      createdAt: new Date().toISOString(), // We don't have access to actual creation time
      lastActivity: new Date().toISOString(),
      isActive: true
    };

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Log authentication success
    logger.info(`Authentication successful`, {
      userId: user.id,
      email: user.email,
      sessionId: payload.sessionId,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent
    });

    next();

  } catch (error) {
    logger.error('Authentication error:', error);

    // Handle specific error types
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString()
      });
    }

    // Handle JWT errors
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          errorCode: 'TOKEN_INVALID',
          timestamp: new Date().toISOString()
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          errorCode: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional Enhanced Authentication Middleware
 * Similar to enhancedAuthMiddleware but continues without error if no token is provided
 */
export const optionalEnhancedAuthMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    if (!token) {
      return next();
    }

    // Get client information
    const clientInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: (req.ip || req.connection.remoteAddress || '127.0.0.1') as string
    };

    // Validate token
    const payload = await jwtService.validateAccessToken(token, clientInfo.ip, clientInfo.userAgent);
    
    if (payload) {
      // Get user details
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

      if (user && user.isActive) {
        // Attach user info to request
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: user.role,
          sessionId: payload.sessionId,
          deviceFingerprint: payload.deviceFingerprint,
          maxDiscountAllowed: user.maxDiscountAllowed || undefined,
          canSellBelowMin: user.canSellBelowMin || undefined
        };
        req.sessionInfo = {
          sessionId: payload.sessionId,
          deviceFingerprint: payload.deviceFingerprint,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          isActive: true
        };

        logger.info(`Optional authentication successful`, {
          userId: user.id,
          sessionId: payload.sessionId
        });
      }
    }

    next();

  } catch (error) {
    logger.error('Optional authentication error:', error);
    // Continue without authentication on error
    next();
  }
};

/**
 * Role-based Authorization Middleware
 */
export const enhancedAuthorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log authorization failure
      logger.warn(`Authorization failed`, {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        timestamp: new Date().toISOString()
      });
    }

    // Log successful authorization
    logger.info(`Authorization successful`, {
      userId: req.user.id,
      userRole: req.user.role,
      allowedRoles
    });

    next();
  };
};

/**
 * Logout Middleware
 * Invalidates the current session and access token
 */
export const logoutMiddleware = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    // End the current session
    const result = await jwtService.endSession(req.user.sessionId);
    
    if (!result.success) {
      logger.error('Failed to end session:', result.error);
      return res.status(500).json({
        error: 'Failed to logout',
        errorCode: 'LOGOUT_FAILED'
      });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/enhanced-auth'
    });

    // Log successful logout
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        entity: 'AUTH',
        entityId: req.user.sessionId,
        newValues: {
          sessionId: req.user.sessionId,
          timestamp: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

    logger.info(`User logged out`, {
      userId: req.user.id,
      sessionId: req.user.sessionId
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      errorCode: 'LOGOUT_FAILED'
    });
  }
};

/**
 * Logout All Sessions Middleware
 * Invalidates all sessions for the current user
 */
export const logoutAllMiddleware = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    // Invalidate all sessions for the user
    await jwtService.invalidateAllUserSessions(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/enhanced-auth'
    });

    // Log logout all action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT_ALL',
        entity: 'AUTH',
        entityId: req.user.id,
        newValues: {
          timestamp: new Date().toISOString(),
          reason: 'User requested logout from all devices'
        }
      }
    });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

    logger.info(`User logged out from all devices`, {
      userId: req.user.id
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      error: 'Internal server error',
      errorCode: 'LOGOUT_ALL_FAILED'
    });
  }
};

/**
 * Get Active Sessions Middleware
 */
export const getActiveSessionsMiddleware = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    const sessions = await jwtService.getUserSessions(req.user.id);

    // Mask sensitive information
    const sanitizedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      deviceFingerprint: session.deviceFingerprint.substring(0, 8) + '...',
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      isCurrentSession: session.sessionId === req.user!.sessionId
    }));

    res.json({
      success: true,
      sessions: sanitizedSessions,
      totalSessions: sessions.length
    });

  } catch (error) {
    logger.error('Get active sessions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      errorCode: 'GET_SESSIONS_FAILED'
    });
  }
};

/**
 * Revoke Session Middleware
 */
export const revokeSessionMiddleware = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        errorCode: 'SESSION_ID_MISSING'
      });
    }

    // Prevent users from revoking their current session (use logout instead)
    if (sessionId === req.user.sessionId) {
      return res.status(400).json({
        error: 'Cannot revoke current session. Use logout instead.',
        errorCode: 'CANNOT_REVOKE_CURRENT_SESSION'
      });
    }

    // Verify the session belongs to the user
    const sessions = await jwtService.getUserSessions(req.user.id);
    const targetSession = sessions.find(s => s.sessionId === sessionId);

    if (!targetSession) {
      return res.status(404).json({
        error: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND'
      });
    }

    // Revoke the session
    const result = await jwtService.endSession(sessionId);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to revoke session',
        errorCode: 'REVOKE_SESSION_FAILED'
      });
    }

    // Log session revocation
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'REVOKE_SESSION',
        entity: 'AUTH',
        entityId: sessionId,
        newValues: {
          revokedSessionId: sessionId,
          revokedBy: req.user.sessionId,
          timestamp: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: 'Session revoked successfully',
      revokedSessionId: sessionId
    });

    logger.info(`Session revoked`, {
      userId: req.user.id,
      revokedSessionId: sessionId,
      revokedBy: req.user.sessionId
    });

  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      errorCode: 'REVOKE_SESSION_FAILED'
    });
  }
};

// Role-based middleware convenience functions
export const adminOnly = enhancedAuthorize('ADMIN');
export const managerOrAbove = enhancedAuthorize('ADMIN', 'MANAGER');
export const supervisorOrAbove = enhancedAuthorize('ADMIN', 'MANAGER', 'SUPERVISOR');
export const staffOrAbove = enhancedAuthorize('ADMIN', 'MANAGER', 'SUPERVISOR', 'CASHIER');
