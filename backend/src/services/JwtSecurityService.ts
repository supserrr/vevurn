// Enhanced JWT Security Service
// File: backend/src/services/JwtSecurityService.ts

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RedisService } from './RedisService';
import { logger } from '../utils/logger';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  deviceFingerprint: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for tracking
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
  jti: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface SessionInfo {
  userId: string;
  sessionId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
}

export class JwtSecurityService {
  private static instance: JwtSecurityService;
  private redis: RedisService;
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private readonly MAX_SESSIONS_PER_USER = 5; // Maximum concurrent sessions

  constructor(redisService?: RedisService) {
    this.redis = redisService || new RedisService();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(redisService?: RedisService): JwtSecurityService {
    if (!JwtSecurityService.instance) {
      JwtSecurityService.instance = new JwtSecurityService(redisService);
    }
    return JwtSecurityService.instance;
  }

  /**
   * Generate device fingerprint from request headers
   */
  generateDeviceFingerprint(userAgent: string, ip: string): string {
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}:${ip}:${process.env.DEVICE_SALT || 'default-salt'}`)
      .digest('hex')
      .substring(0, 16);
    
    return fingerprint;
  }

  /**
   * Generate secure session ID
   */
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate JWT ID for token tracking
   */
  generateJwtId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Create token pair with enhanced security
   */
  async createTokenPair(
    userId: string,
    email: string,
    role: string,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent: string
  ): Promise<TokenPair> {
    const sessionId = this.generateSessionId();
    const accessJti = this.generateJwtId();
    const refreshJti = this.generateJwtId();

    // Check and enforce session limits
    await this.enforceSessionLimits(userId);

    // Create access token
    const accessTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId,
      email,
      role,
      sessionId,
      deviceFingerprint,
      jti: accessJti
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_SECRET!,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'vevurn-pos',
        audience: 'vevurn-users',
        algorithm: 'HS256'
      }
    );

    // Get current token version for refresh token rotation
    const tokenVersion = await this.getTokenVersion(userId);

    // Create refresh token
    const refreshTokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      sessionId,
      tokenVersion,
      jti: refreshJti
    };

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'vevurn-pos',
        audience: 'vevurn-refresh',
        algorithm: 'HS256'
      }
    );

    // Store session information
    const sessionInfo: SessionInfo = {
      userId,
      sessionId,
      deviceFingerprint,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true
    };

    await this.storeSession(sessionId, sessionInfo);
    await this.trackActiveToken(accessJti, sessionId);
    await this.trackRefreshToken(refreshJti, sessionId);

    // Store refresh token hash for validation
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    
    await this.redis.set(
      `refresh:${userId}:${sessionId}`, 
      refreshTokenHash, 
      { ttl: 7 * 24 * 60 * 60 } // 7 days
    );

    logger.info(`Token pair created for user ${userId}`, {
      userId,
      sessionId,
      deviceFingerprint,
      ipAddress
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  /**
   * Validate access token with enhanced security checks
   */
  async validateAccessToken(
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<JWTPayload | null> {
    try {
      // Check if token is blacklisted
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.jti) {
        return null;
      }

      const isBlacklisted = await this.redis.exists(`blacklist:${decoded.jti}`);
      if (isBlacklisted) {
        logger.warn(`Blacklisted token used`, { jti: decoded.jti, userId: decoded.userId });
        return null;
      }

      // Verify JWT signature and expiration
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Validate session exists and is active
      const sessionInfo = await this.getSession(payload.sessionId);
      if (!sessionInfo || !sessionInfo.isActive) {
        logger.warn(`Invalid session for token`, { 
          sessionId: payload.sessionId, 
          userId: payload.userId 
        });
        return null;
      }

      // Device fingerprint validation
      const currentFingerprint = this.generateDeviceFingerprint(userAgent, ipAddress);
      if (payload.deviceFingerprint !== currentFingerprint) {
        logger.warn(`Device fingerprint mismatch`, {
          userId: payload.userId,
          sessionId: payload.sessionId,
          expected: payload.deviceFingerprint,
          actual: currentFingerprint
        });
        // Invalidate session for security
        await this.invalidateSession(payload.sessionId);
        return null;
      }

      // Update last activity
      await this.updateSessionActivity(payload.sessionId);

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn(`Invalid JWT token`, { error: error.message });
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.info(`Expired JWT token`, { error: error.message });
      }
      return null;
    }
  }

  /**
   * Refresh token with rotation
   */
  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET!
      ) as RefreshTokenPayload;

      // Validate refresh token hash
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const storedHash = await this.redis.get(`refresh:${payload.userId}:${payload.sessionId}`);
      if (storedHash !== refreshTokenHash) {
        logger.warn(`Invalid refresh token hash`, { 
          userId: payload.userId, 
          sessionId: payload.sessionId 
        });
        return null;
      }

      // Check token version for refresh token rotation
      const currentVersion = await this.getTokenVersion(payload.userId);
      if (payload.tokenVersion !== currentVersion) {
        logger.warn(`Outdated refresh token version`, { 
          userId: payload.userId,
          tokenVersion: payload.tokenVersion,
          currentVersion
        });
        return null;
      }

      // Get user data for new tokens
      const sessionInfo = await this.getSession(payload.sessionId);
      if (!sessionInfo || !sessionInfo.isActive) {
        return null;
      }

      // Invalidate old refresh token
      await this.redis.del(`refresh:${payload.userId}:${payload.sessionId}`);
      await this.blacklistToken(payload.jti);

      // Create new token pair
      const userInfo = await this.getUserInfo(payload.userId);
      if (!userInfo) {
        return null;
      }

      const deviceFingerprint = this.generateDeviceFingerprint(userAgent, ipAddress);
      
      return await this.createTokenPair(
        payload.userId,
        userInfo.email,
        userInfo.role,
        deviceFingerprint,
        ipAddress,
        userAgent
      );

    } catch (error) {
      logger.warn(`Refresh token validation failed`, { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Blacklist a token by JWT ID
   */
  async blacklistToken(jti: string): Promise<void> {
    // Calculate TTL based on token expiration (for cleanup)
    const ttl = 24 * 60 * 60; // 24 hours (max access token life)
    await this.redis.set(`blacklist:${jti}`, 'true', { ttl });
    
    logger.info(`Token blacklisted`, { jti });
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessionPattern = `session:${userId}:*`;
    const sessionKeys = await this.redis.keys(sessionPattern);

    for (const sessionKey of sessionKeys) {
      const sessionId = sessionKey.split(':')[2];
      await this.invalidateSession(sessionId);
    }

    // Increment token version to invalidate all refresh tokens
    await this.incrementTokenVersion(userId);

    logger.info(`All sessions invalidated for user`, { userId });
  }

  /**
   * Invalidate specific session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const sessionInfo = await this.getSession(sessionId);
    if (sessionInfo) {
      sessionInfo.isActive = false;
      await this.storeSession(sessionId, sessionInfo);
    }

    // Remove refresh token
    await this.redis.del(`refresh:${sessionInfo?.userId}:${sessionId}`);

    logger.info(`Session invalidated`, { sessionId });
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessionPattern = `session:${userId}:*`;
    const sessionKeys = await this.redis.keys(sessionPattern);
    
    const sessions: SessionInfo[] = [];
    for (const sessionKey of sessionKeys) {
      const sessionData = await this.redis.getJSON(sessionKey);
      if (sessionData && sessionData.isActive) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  }

  // Private helper methods

  private async storeSession(sessionId: string, sessionInfo: SessionInfo): Promise<void> {
    const sessionKey = `session:${sessionInfo.userId}:${sessionId}`;
    await this.redis.setJSON(sessionKey, sessionInfo, 7 * 24 * 60 * 60); // 7 days
  }

  private async getSession(sessionId: string): Promise<SessionInfo | null> {
    // We need to find the session by ID across all users
    const pattern = `session:*:${sessionId}`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) return null;
    
    return await this.redis.getJSON(keys[0]);
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    const sessionInfo = await this.getSession(sessionId);
    if (sessionInfo) {
      sessionInfo.lastActivity = new Date().toISOString();
      await this.storeSession(sessionId, sessionInfo);
    }
  }

  private async trackActiveToken(jti: string, sessionId: string): Promise<void> {
    await this.redis.set(`token:${jti}`, sessionId, { ttl: 15 * 60 }); // 15 minutes
  }

  private async trackRefreshToken(jti: string, sessionId: string): Promise<void> {
    await this.redis.set(`refresh_token:${jti}`, sessionId, { ttl: 7 * 24 * 60 * 60 }); // 7 days
  }

  private async getTokenVersion(userId: string): Promise<number> {
    const version = await this.redis.get(`token_version:${userId}`);
    return version ? parseInt(version) : 1;
  }

  private async incrementTokenVersion(userId: string): Promise<number> {
    const currentVersion = await this.getTokenVersion(userId);
    const newVersion = currentVersion + 1;
    await this.redis.set(`token_version:${userId}`, newVersion.toString());
    return newVersion;
  }

  private async enforceSessionLimits(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    
    if (sessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      sessions.sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime());
      const oldestSession = sessions[0];
      await this.invalidateSession(oldestSession.sessionId);
    }
  }

  /**
   * End a specific session
   */
  async endSession(sessionId: string): Promise<ServiceResult<boolean>> {
    try {
      // Remove session data
      await this.redis.del(`session:${sessionId}`);
      
      // Remove from user sessions list
      const pattern = `user_sessions:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const sessions = await this.redis.getJSON(key, []);
        const filteredSessions = sessions.filter((s: any) => s.sessionId !== sessionId);
        await this.redis.setJSON(key, filteredSessions, 86400 * 7); // 7 days TTL
      }
      
      logger.info('Session ended', { sessionId });
      
      return { success: true, data: true };
    } catch (error) {
      logger.error('Failed to end session:', error);
      return { success: false, error: 'Failed to end session' };
    }
  }

  /**
   * Invalidate session (alias for endSession)
   */
  async invalidateSession(sessionId: string): Promise<ServiceResult<boolean>> {
    return this.endSession(sessionId);
  }

  private async getUserInfo(userId: string): Promise<{ email: string; role: string } | null> {
    // This should be replaced with actual database call
    // For now, we'll use a mock implementation
    try {
      // In real implementation, fetch from Prisma
      const user = { email: 'user@example.com', role: 'STAFF' };
      return user;
    } catch (error) {
      logger.error(`Failed to get user info for ${userId}`, error);
      return null;
    }
  }
}
