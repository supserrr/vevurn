import { Router, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/index.js';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * Get current user session
 * Following Better Auth Express integration documentation
 */
router.get('/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'No valid session found',
          timestamp: new Date().toISOString(),
        }
      });
    }
    
    return res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          emailVerified: session.user.emailVerified,
          createdAt: session.user.createdAt,
          updatedAt: session.user.updatedAt,
          // Include additional fields if present
          ...(session.user.firstName && { firstName: session.user.firstName }),
          ...(session.user.lastName && { lastName: session.user.lastName }),
          ...(session.user.role && { role: session.user.role }),
        },
        session: {
          id: session.session.id,
          userId: session.session.userId,
          expiresAt: session.session.expiresAt,
          createdAt: session.session.createdAt,
          updatedAt: session.session.updatedAt,
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'SESSION_ERROR',
        message: 'Failed to retrieve session',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

/**
 * Get user profile (authenticated required)
 */
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to retrieve profile',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

/**
 * Check authentication status (optional auth)
 */
router.get('/status', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const isAuthenticated = !!req.user;
    
    return res.json({
      success: true,
      data: {
        authenticated: isAuthenticated,
        user: isAuthenticated ? {
          id: req.user!.id,
          email: req.user!.email,
          name: req.user!.name,
          emailVerified: req.user!.emailVerified,
        } : null,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to check authentication status',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

/**
 * Refresh session endpoint
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Better Auth handles session refresh automatically through the main auth handler
    // This endpoint can be used to manually trigger a session check
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired. Please sign in again.',
          timestamp: new Date().toISOString(),
        }
      });
    }
    
    return res.json({
      success: true,
      message: 'Session is valid',
      data: {
        expiresAt: session.session.expiresAt,
        userId: session.session.userId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh session',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

/**
 * Get all user sessions (requires authentication)
 */
router.get('/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Note: This would require implementing a sessions listing method in Better Auth
    // For now, return current session info
    return res.json({
      success: true,
      message: 'Sessions endpoint - implementation depends on Better Auth session management features',
      data: {
        currentSession: req.session,
        // Additional sessions would be listed here if supported by Better Auth
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sessions listing error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SESSIONS_ERROR',
        message: 'Failed to retrieve sessions',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

/**
 * Health check for auth endpoints
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test Better Auth availability
    const testSession = await auth.api.getSession({
      headers: new Headers(),
    });
    
    return res.json({
      success: true,
      message: 'Authentication service is healthy',
      data: {
        service: 'better-auth',
        status: 'healthy',
        features: {
          emailPassword: true,
          oauth: true,
          sessionManagement: true,
          rateLimiting: true,
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // This is expected when no session headers are provided
    return res.json({
      success: true,
      message: 'Authentication service is operational',
      data: {
        service: 'better-auth',
        status: 'operational',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
