import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RedisService } from '../services/RedisService';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();
const redis = new RedisService();

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username?: string | null;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    isActive: boolean;
    isVerified: boolean;
  };
}

// Main authentication middleware
export const authMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from headers
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.headers['x-access-token'] as string;

    if (!token) {
      throw new AppError('Authentication token required', 401, 'TOKEN_REQUIRED');
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.exists(`blacklist:token:${token}`);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Check if user session exists in Redis (optional for session management)
    const sessionKey = `session:${decoded.userId}`;
    const sessionData = await redis.getJSON(sessionKey);
    
    if (!sessionData) {
      // User might be logged out, but we'll allow it if token is valid
      logger.warn(`No session found for user ${decoded.userId}, but token is valid`);
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true,
        isVerified: true,
        lastLogin: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    if (!user.isVerified) {
      throw new AppError('Account is not verified', 401, 'ACCOUNT_NOT_VERIFIED');
    }

    // Attach user to request object
    req.user = {
      ...user,
      role: user.role as string
    };

    // Update last activity in session
    if (sessionData) {
      await redis.setJSON(sessionKey, {
        ...sessionData,
        lastActivity: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }, 3600); // 1 hour TTL
    }

    // Log user activity (optional)
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'API_ACCESS',
        resource: `${req.method} ${req.path}`,
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      }
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authentication token expired', 401, 'TOKEN_EXPIRED'));
    } else if (error instanceof jwt.NotBeforeError) {
      next(new AppError('Authentication token not active', 401, 'TOKEN_NOT_ACTIVE'));
    } else {
      next(error);
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.headers['x-access-token'] as string;

    if (!token) {
      return next(); // Continue without authentication
    }

    // Same logic as authMiddleware but don't throw errors
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true,
        isVerified: true
      }
    });

    if (user && user.isActive && user.isVerified) {
      req.user = {
        ...user,
        role: user.role as string
      };
    }

    next();
  } catch (error) {
    // Silently continue without authentication if token is invalid
    logger.warn('Optional auth middleware error:', error);
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${userRole} to ${req.path}`, {
        userId: req.user.id,
        userRole,
        allowedRoles,
        path: req.path,
        method: req.method
      });
      
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn(`Permission denied for user ${req.user.id}`, {
        userId: req.user.id,
        userPermissions,
        requiredPermissions,
        path: req.path,
        method: req.method
      });
      
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

// Admin-only middleware
export const adminOnly = authorize('SUPER_ADMIN', 'ADMIN');

// Manager and above middleware
export const managerOrAbove = authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER');

// Staff and above middleware (everyone except guests)
export const staffOrAbove = authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CASHIER');

// API key authentication middleware (for external integrations)
export const apiKeyAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AppError('API key required', 401, 'API_KEY_REQUIRED');
    }

    // Validate API key (you might want to store these in database)
    const validApiKey = process.env.API_KEY;
    if (!validApiKey || apiKey !== validApiKey) {
      throw new AppError('Invalid API key', 401, 'INVALID_API_KEY');
    }

    // Log API key usage
    logger.info('API key authentication successful', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Utility functions for token management
export const tokenUtils = {
  // Generate JWT token
  generateToken: (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    return jwt.sign(payload, jwtSecret, { 
      expiresIn: '24h',
      issuer: 'vevurn-pos',
      audience: 'vevurn-users'
    });
  },

  // Generate refresh token
  generateRefreshToken: (): string => {
    return jwt.sign(
      { type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
    );
  },

  // Blacklist token
  blacklistToken: async (token: string): Promise<void> => {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.set(`blacklist:token:${token}`, 'true', ttl);
        }
      }
    } catch (error) {
      logger.error('Error blacklisting token:', error);
    }
  },

  // Create user session
  createSession: async (userId: string, sessionData: any): Promise<void> => {
    const sessionKey = `session:${userId}`;
    await redis.setJSON(sessionKey, {
      ...sessionData,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }, 3600); // 1 hour TTL
  },

  // Destroy user session
  destroySession: async (userId: string): Promise<void> => {
    const sessionKey = `session:${userId}`;
    await redis.del(sessionKey);
  }
};

export type { AuthenticatedRequest };
