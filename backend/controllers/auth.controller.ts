import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { CreateUserRequest, LoginRequest, ChangePasswordRequest, ApiResponse } from '../../shared';
import { asyncHandler } from '../utils/async-handler';
import { validateRequest } from '../middleware/validation.middleware';
import { createUserSchema, loginSchema, changePasswordSchema, updateUserSchema } from '../../shared/utils/validation';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = validateRequest(createUserSchema, req.body);
    const result = await this.authService.register(validatedData as CreateUserRequest);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'User registered successfully',
      data: result,
    };

    res.status(201).json(response);
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = validateRequest(loginSchema, req.body);
    const result = await this.authService.login(validatedData as LoginRequest);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Login successful',
      data: result,
    };

    res.json(response);
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await this.authService.logout(token);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Logout successful',
      data: null,
    };

    res.json(response);
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    const result = await this.authService.refreshToken(refreshToken);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };

    res.json(response);
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = validateRequest(changePasswordSchema, req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }

    await this.authService.changePassword(userId, validatedData as ChangePasswordRequest);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Password changed successfully',
      data: null,
    };

    res.json(response);
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }

    const user = await this.authService.getUserProfile(userId);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    };

    res.json(response);
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }

    const validatedData = validateRequest(updateUserSchema, req.body);
    const user = await this.authService.updateProfile(userId, validatedData);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Profile updated successfully',
      data: user,
    };

    res.json(response);
  });

  /**
   * Request password reset
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'EMAIL_REQUIRED',
      });
    }

    await this.authService.requestPasswordReset(email);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Password reset email sent',
      data: null,
    };

    res.json(response);
  });

  /**
   * Reset password with token
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
        error: 'INVALID_REQUEST',
      });
    }

    await this.authService.resetPassword(token, newPassword);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Password reset successfully',
      data: null,
    };

    res.json(response);
  });

  /**
   * Verify email address
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    
    await this.authService.verifyEmail(token);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Email verified successfully',
      data: null,
    };

    res.json(response);
  });

  /**
   * Resend email verification
   */
  resendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }

    await this.authService.resendEmailVerification(userId);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Verification email sent',
      data: null,
    };

    res.json(response);
  });
}
