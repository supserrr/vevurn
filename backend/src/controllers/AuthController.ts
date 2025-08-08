import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const credentials = {
        email,
        password,
        ip_address: req.ip
      };

      // For now, we'll use a simple mock response
      const token = this.authService.generateToken({
        email,
        role: 'cashier'
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email,
            role: 'cashier'
          },
          accessToken: token,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { first_name, last_name, email, password, role } = req.body;

      if (!first_name || !last_name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      const hashedPassword = await this.authService.hashPassword(password);
      const employeeId = this.authService.generateEmployeeId();

      // Mock successful registration
      const token = this.authService.generateToken({
        email,
        role: role || 'cashier'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            employee_id: employeeId,
            first_name,
            last_name,
            email,
            role: role || 'cashier'
          },
          accessToken: token,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // For now, just return success
      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      const payload = this.authService.verifyToken(refreshToken);
      
      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      const newToken = this.authService.generateToken(payload);

      res.json({
        success: true,
        data: {
          accessToken: newToken,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'No token provided'
        });
        return;
      }

      const payload = this.authService.verifyToken(token);

      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
        return;
      }

      res.json({
        success: true,
        data: payload
      });

    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  };
}
