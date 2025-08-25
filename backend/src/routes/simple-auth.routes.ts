import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = Router();
const prisma = new PrismaClient();

// Simple login endpoint for development
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // For development, accept any password for existing users
    // Store user session in a simple way
    const sessionToken = `session_${user.id}_${Date.now()}`;
    
    // Set cookie
    res.cookie('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        sessionToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user session
router.get('/session', async (req: Request, res: Response) => {
  try {
    const token = req.cookies['auth-token'];

    if (!token || !token.startsWith('session_')) {
      return res.status(401).json({
        success: false,
        message: 'No valid session'
      });
    }

    // Extract user ID from token
    const userId = token.split('_')[1];
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid session'
    });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth-token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
