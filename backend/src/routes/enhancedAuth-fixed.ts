import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { RedisService } from '../services/RedisService';

const router = express.Router();
const prisma = new PrismaClient();
const redisService = new RedisService();

// Enhanced Auth Configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const DEVICE_SALT = process.env.DEVICE_SALT || 'default-device-salt';
const MAX_SESSIONS_PER_USER = parseInt(process.env.MAX_SESSIONS_PER_USER || '5');

// Rate limiters for enhanced auth endpoints
const enhancedLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { 
    success: false, 
    error: { 
      message: 'Too many login attempts. Please try again later.', 
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    } 
  },
  standardHeaders: true,
  legacyHeaders: false
});

const refreshTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15,
  message: { 
    success: false, 
    error: { 
      message: 'Too many refresh attempts. Please try again later.', 
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    } 
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const enhancedLoginSchema = z.object({
  email: z.string().email(),
  accessToken: z.string().min(1), // Better Auth token
  rememberMe: z.boolean().optional().default(false)
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

// Utility functions
const generateDeviceFingerprint = (req: express.Request): string => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || '',
    DEVICE_SALT
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};

const generateEnhancedJWT = (
  user: any,
  deviceFingerprint: string,
  sessionId: string
): { accessToken: string; refreshToken: string } => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'USER',
    deviceFingerprint,
    sessionId,
    type: 'enhanced_access'
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '1h',
    issuer: 'vevurn-pos',
    audience: 'vevurn-clients'
  });

  const refreshPayload = {
    userId: user.id,
    sessionId,
    type: 'enhanced_refresh'
  };

  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { 
    expiresIn: '7d',
    issuer: 'vevurn-pos',
    audience: 'vevurn-clients'
  });

  return { accessToken, refreshToken };
};

const logSecurityEvent = async (
  action: string,
  userId: string,
  details: any,
  req: express.Request
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity: 'User',
        entityId: userId,
        oldValues: {},
        newValues: {
          ...details,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }
    });
  } catch (error) {
    logger.error('Failed to log security event:', error);
  }
};

// Helper functions for session management using Redis hashes
const getActiveSessionIds = async (userId: string): Promise<string[]> => {
  const pattern = `session:${userId}:*`;
  return await redisService.scan(pattern);
};

const addActiveSession = async (userId: string, sessionId: string, sessionData: any, ttl: number): Promise<void> => {
  const sessionKey = `session:${userId}:${sessionId}`;
  await redisService.set(sessionKey, JSON.stringify(sessionData), { ttl });
};

const removeActiveSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessionKey = `session:${userId}:${sessionId}`;
  await redisService.del(sessionKey);
};

const getSessionData = async (userId: string, sessionId: string): Promise<any | null> => {
  const sessionKey = `session:${userId}:${sessionId}`;
  const data = await redisService.get(sessionKey);
  return data ? JSON.parse(data) : null;
};

// Enhanced login endpoint - creates JWT from Better Auth session
router.post('/login', enhancedLoginLimiter, async (req: Request, res: Response) => {
  try {
    const validation = enhancedLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validation.error.issues,
          timestamp: new Date().toISOString()
        }
      });
    }

    const { email, rememberMe } = validation.data;

    // Find user by email (Better Auth compatible)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      await logSecurityEvent('enhanced_login_failed', 'unknown', {
        reason: 'user_not_found',
        email
      }, req);
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate device fingerprint and session ID
    const deviceFingerprint = generateDeviceFingerprint(req);
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Check concurrent session limits
    const activeSessions = await getActiveSessionIds(user.id);
    if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
      // Remove oldest session (first one found)
      const oldestSessionKey = activeSessions[0];
      if (oldestSessionKey) {
        await redisService.del(oldestSessionKey);
      }
    }

    // Generate enhanced JWT tokens
    const { accessToken: enhancedAccessToken, refreshToken } = generateEnhancedJWT(
      user,
      deviceFingerprint,
      sessionId
    );

    // Store session in Redis
    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceFingerprint,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      rememberMe
    };

    const sessionExpiry = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 1 day
    await addActiveSession(user.id, sessionId, sessionData, sessionExpiry);

    // Log successful login
    await logSecurityEvent('enhanced_login_success', user.id, {
      deviceFingerprint,
      sessionId,
      rememberMe
    }, req);

    // Prepare response
    const response = {
      success: true,
      data: {
        accessToken: enhancedAccessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified
        },
        sessionInfo: {
          sessionId,
          expiresIn: 3600, // 1 hour
          deviceFingerprint,
          createdAt: sessionData.createdAt,
          rememberMe
        }
      }
    };

    logger.info(`Enhanced authentication successful for user: ${user.email}`, {
      userId: user.id,
      sessionId,
      ipAddress: req.ip
    });

    return res.status(200).json(response);

  } catch (error) {
    logger.error('Enhanced login error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Token refresh endpoint
router.post('/refresh', refreshTokenLimiter, async (req: Request, res: Response) => {
  try {
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { refreshToken } = validation.data;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

    if (decoded.type !== 'enhanced_refresh') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get session data
    const sessionData = await getSessionData(decoded.userId, decoded.sessionId);
    if (!sessionData) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Session expired',
          code: 'SESSION_EXPIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify device fingerprint
    const currentFingerprint = generateDeviceFingerprint(req);
    if (sessionData.deviceFingerprint !== currentFingerprint) {
      // Invalidate session on device mismatch
      await removeActiveSession(decoded.userId, decoded.sessionId);
      
      await logSecurityEvent('device_mismatch', sessionData.userId, {
        sessionId: decoded.sessionId,
        expectedFingerprint: sessionData.deviceFingerprint,
        actualFingerprint: currentFingerprint
      }, req);

      return res.status(401).json({
        success: false,
        error: {
          message: 'Device verification failed',
          code: 'DEVICE_MISMATCH',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate new tokens (token rotation)
    const newSessionId = crypto.randomBytes(32).toString('hex');
    const { accessToken, refreshToken: newRefreshToken } = generateEnhancedJWT(
      user,
      currentFingerprint,
      newSessionId
    );

    // Update session data
    const updatedSession = {
      ...sessionData,
      lastActivity: new Date().toISOString()
    };

    // Replace old session with new one
    await removeActiveSession(decoded.userId, decoded.sessionId);
    
    const sessionExpiry = sessionData.rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
    await addActiveSession(decoded.userId, newSessionId, updatedSession, sessionExpiry);

    // Log token refresh
    await logSecurityEvent('token_refresh', user.id, {
      oldSessionId: decoded.sessionId,
      newSessionId
    }, req);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
        sessionId: newSessionId
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Remove session
    await removeActiveSession(decoded.userId, decoded.sessionId);
    
    // Blacklist the token
    const tokenExpiry = decoded.exp - Math.floor(Date.now() / 1000);
    if (tokenExpiry > 0) {
      await redisService.set(`blacklist:${token}`, 'true', { ttl: tokenExpiry });
    }

    // Log logout
    await logSecurityEvent('LOGOUT', decoded.userId, {
      sessionId: decoded.sessionId,
      reason: 'user_logout'
    }, req);

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Logout from all devices
router.post('/logout-all', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get all active sessions
    const activeSessions = await getActiveSessionIds(decoded.userId);
    
    // Remove all sessions
    for (const sessionKey of activeSessions) {
      await redisService.del(sessionKey);
    }

    // Log logout all
    await logSecurityEvent('LOGOUT_ALL', decoded.userId, {
      sessionsRevoked: activeSessions.length
    }, req);

    return res.status(200).json({
      success: true,
      message: `Logged out from ${activeSessions.length} devices`
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get active sessions
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentSessionId = decoded.sessionId;
    
    // Get all active sessions
    const sessionKeys = await getActiveSessionIds(decoded.userId);
    
    const sessions = [];
    
    for (const sessionKey of sessionKeys) {
      const sessionData = await redisService.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const sessionId = sessionKey.split(':').pop(); // Extract session ID from key
        sessions.push({
          sessionId,
          deviceFingerprint: session.deviceFingerprint,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          isCurrentSession: sessionId === currentSessionId
        });
      }
    }

    return res.status(200).json({
      success: true,
      sessions
    });

  } catch (error) {
    logger.error('Get sessions error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get sessions',
        code: 'SESSIONS_FETCH_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Revoke specific session
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { sessionId } = req.params;
    
    // Remove the specific session
    await removeActiveSession(decoded.userId, sessionId);

    // Log session revocation
    await logSecurityEvent('SESSION_REVOKED', decoded.userId, {
      revokedSessionId: sessionId,
      revokedBy: decoded.sessionId
    }, req);

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    logger.error('Revoke session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to revoke session',
        code: 'SESSION_REVOKE_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get user profile with security info
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get session count
    const activeSessions = await getActiveSessionIds(decoded.userId);

    // Get recent security events
    const recentEvents = await prisma.auditLog.findMany({
      where: {
        userId: decoded.userId,
        action: {
          in: ['enhanced_login_success', 'enhanced_login_failed', 'LOGOUT', 'device_mismatch']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        action: true,
        createdAt: true,
        newValues: true
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        security: {
          activeSessionsCount: activeSessions.length,
          maxSessionsAllowed: MAX_SESSIONS_PER_USER,
          currentSessionId: decoded.sessionId,
          deviceFingerprint: decoded.deviceFingerprint,
          recentActivity: recentEvents.map(event => ({
            action: event.action,
            timestamp: event.createdAt,
            details: event.newValues
          }))
        }
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile',
        code: 'PROFILE_FETCH_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Validate token endpoint
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token has been revoked',
          code: 'TOKEN_REVOKED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify session still exists
    const sessionData = await getSessionData(decoded.userId, decoded.sessionId);
    if (!sessionData) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Session expired',
          code: 'SESSION_EXPIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify device fingerprint
    const currentFingerprint = generateDeviceFingerprint(req);
    if (sessionData.deviceFingerprint !== currentFingerprint) {
      // Invalidate session on device mismatch
      await removeActiveSession(decoded.userId, decoded.sessionId);
      
      await logSecurityEvent('device_mismatch', decoded.userId, {
        sessionId: decoded.sessionId,
        expectedFingerprint: sessionData.deviceFingerprint,
        actualFingerprint: currentFingerprint
      }, req);

      return res.status(401).json({
        success: false,
        error: {
          message: 'Device verification failed',
          code: 'DEVICE_MISMATCH',
          timestamp: new Date().toISOString()
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        },
        sessionInfo: {
          sessionId: decoded.sessionId,
          deviceFingerprint: decoded.deviceFingerprint,
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        }
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.error('Token validation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Token validation failed',
        code: 'VALIDATION_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get security events
router.get('/security-events', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const events = await prisma.auditLog.findMany({
      where: {
        userId: decoded.userId,
        action: {
          in: [
            'enhanced_login_success',
            'enhanced_login_failed',
            'token_refresh',
            'LOGOUT',
            'LOGOUT_ALL',
            'SESSION_REVOKED',
            'device_mismatch'
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        action: true,
        createdAt: true,
        newValues: true
      }
    });

    return res.status(200).json({
      success: true,
      events: events.map(event => ({
        action: event.action,
        timestamp: event.createdAt,
        details: event.newValues
      }))
    });

  } catch (error) {
    logger.error('Get security events error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get security events',
        code: 'SECURITY_EVENTS_FETCH_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
