import { Router, Request, Response } from 'express';
import { JwtSecurityService } from '../services/JwtSecurityService';
import { EnhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/enhancedAuth';
import { logger } from '../utils/logger';

const router = Router();
// Use the global Redis service that's already connected
const redisService = (global as any).redisService;
const jwtSecurity = JwtSecurityService.getInstance(redisService);
const authMiddleware = new EnhancedAuthMiddleware();

/**
 * Test login endpoint - creates JWT tokens with device fingerprinting
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Simple validation (in real app, you'd verify against database)
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Mock user data (in real app, fetch from database)
    const mockUser = {
      id: 'user-123',
      userId: 'user-123',
      email,
      name: 'Test User',
      role: 'user',
      permissions: ['read:products', 'create:sales']
    };
    
    // Get device info from request
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: (req.ip || req.connection.remoteAddress || '127.0.0.1') as string,
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || ''
    };
    
    // Create token pair with device fingerprinting
    const tokenResult = await jwtSecurity.createTokenPair(mockUser, deviceInfo);
    
    if (!tokenResult.success || !tokenResult.data) {
      res.status(500).json({ error: 'Failed to create tokens' });
      return;
    }
    
    const { accessToken, refreshToken, sessionId, fingerprint } = tokenResult.data;
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/jwt-test'
    });
    
    // Return access token and user info
    res.json({
      success: true,
      user: {
        id: mockUser.id,
        userId: mockUser.userId,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role
      },
      accessToken,
      sessionId,
      fingerprint,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });
    
    logger.info(`JWT tokens created for user ${mockUser.email}`, {
      sessionId,
      userId: mockUser.id,
      deviceFingerprint: fingerprint
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Protected route - requires valid JWT token
 */
router.get('/protected', authMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Access granted to protected route',
      user: req.user,
      sessionInfo: {
        sessionId: req.sessionId,
        deviceFingerprint: req.deviceFingerprint,
        deviceValidated: req.deviceValidated
      }
    });
  } catch (error) {
    logger.error('Protected route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Admin-only route - requires admin role
 */
router.get('/admin', 
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        message: 'Access granted to admin route',
        user: req.user,
        adminData: {
          totalUsers: 100,
          totalSessions: 25,
          systemHealth: 'good'
        }
      });
    } catch (error) {
      logger.error('Admin route error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Refresh token endpoint
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not provided' });
      return;
    }
    
    // Get device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: (req.ip || req.connection.remoteAddress || '127.0.0.1') as string,
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || ''
    };
    
    // Refresh tokens
    const result = await jwtSecurity.refreshTokens(refreshToken, deviceInfo);
    
    if (!result.success || !result.data) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    
    const { accessToken, refreshToken: newRefreshToken, sessionId } = result.data;
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/jwt-test'
    });
    
    res.json({
      success: true,
      accessToken,
      sessionId,
      expiresIn: 15 * 60
    });
    
    logger.info('Tokens refreshed successfully', { sessionId });
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Logout endpoint - blacklists tokens
 */
router.post('/logout', authMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Blacklist tokens
    if (accessToken) {
      await jwtSecurity.blacklistToken(accessToken);
    }
    
    if (refreshToken) {
      await jwtSecurity.blacklistToken(refreshToken);
    }
    
    // End session
    if (req.sessionId) {
      await jwtSecurity.endSession(req.sessionId);
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/jwt-test'
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    logger.info('User logged out', {
      userId: req.user?.id,
      sessionId: req.sessionId
    });
    
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Session management endpoints
 */
router.get('/sessions', authMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(400).json({ error: 'User ID not found' });
      return;
    }
    
    const sessions = await jwtSecurity.getUserSessions(req.user.id);
    
    res.json({
      success: true,
      sessions: sessions.map((session: any) => ({
        sessionId: session.sessionId,
        deviceInfo: session.deviceInfo,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        isCurrentSession: session.sessionId === req.sessionId
      }))
    });
    
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/sessions/:sessionId', authMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    if (!req.user?.id) {
      res.status(400).json({ error: 'User ID not found' });
      return;
    }
    
    // Verify the session belongs to the user
    const sessions = await jwtSecurity.getUserSessions(req.user.id);
    const sessionExists = sessions.some((s: any) => s.sessionId === sessionId);
    
    if (!sessionExists) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    
    await jwtSecurity.endSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
    
    logger.info('Session terminated', {
      userId: req.user.id,
      terminatedSessionId: sessionId,
      bySessionId: req.sessionId
    });
    
  } catch (error) {
    logger.error('Terminate session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Security info endpoint
 */
router.get('/security-info', authMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const securityInfo = await jwtSecurity.getSecurityInfo(req.user?.id || '');
    
    res.json({
      success: true,
      securityInfo
    });
    
  } catch (error) {
    logger.error('Security info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
