import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = Router();

// Simple JWT test without Redis dependency
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-testing';
const JWT_EXPIRES_IN = '15m';
const REFRESH_SECRET = process.env.REFRESH_JWT_SECRET || 'your-refresh-secret-key';
const REFRESH_EXPIRES_IN = '7d';

/**
 * Simple login endpoint - creates JWT tokens without Redis
 */
router.post('/simple-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Mock user data
    const mockUser = {
      id: 'user-123',
      email,
      name: 'Test User',
      role: 'user'
    };
    
    // Create access token
    const accessToken = jwt.sign(
      {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Create refresh token
    const refreshToken = jwt.sign(
      {
        userId: mockUser.id,
        type: 'refresh'
      },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/simple-jwt-test'
    });
    
    // Return access token and user info
    res.json({
      success: true,
      user: mockUser,
      accessToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });
    
    logger.info(`Simple JWT tokens created for user ${mockUser.email}`, {
      userId: mockUser.id
    });
    
  } catch (error) {
    logger.error('Simple login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Protected route - requires valid JWT token
 */
router.get('/simple-protected', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== 'access') {
        res.status(401).json({ error: 'Invalid token type' });
        return;
      }
      
      res.json({
        success: true,
        message: 'Access granted to protected route',
        user: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        },
        tokenInfo: {
          issuedAt: new Date(decoded.iat * 1000),
          expiresAt: new Date(decoded.exp * 1000)
        }
      });
      
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
    
  } catch (error) {
    logger.error('Protected route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Refresh token endpoint
 */
router.post('/simple-refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not provided' });
      return;
    }
    
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        res.status(401).json({ error: 'Invalid refresh token type' });
        return;
      }
      
      // Create new access token
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          type: 'access'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      // Optionally create new refresh token (refresh token rotation)
      const newRefreshToken = jwt.sign(
        {
          userId: decoded.userId,
          type: 'refresh'
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
      );
      
      // Set new refresh token cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/simple-jwt-test'
      });
      
      res.json({
        success: true,
        accessToken: newAccessToken,
        expiresIn: 15 * 60
      });
      
      logger.info('Simple tokens refreshed successfully', { userId: decoded.userId });
      
    } catch (jwtError) {
      logger.error('Refresh token verification failed:', jwtError);
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Logout endpoint
 */
router.post('/simple-logout', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/simple-jwt-test'
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    logger.info('User logged out (simple)');
    
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
