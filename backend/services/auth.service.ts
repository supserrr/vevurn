import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { 
  CreateUserRequest, 
  LoginRequest, 
  ChangePasswordRequest,
  AuthTokens,
  User
} from '../../shared/types/auth';
import { CustomError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new CustomError('Email is already registered', 409, 'EMAIL_EXISTS');
        }
        if (existingUser.username === userData.username) {
          throw new CustomError('Username is already taken', 409, 'USERNAME_EXISTS');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role,
          isActive: true,
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Log registration
      logger.info(`New user registered: ${user.email}`, {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return { user, tokens };
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!user) {
        throw new CustomError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new CustomError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${user.email}`, {
        userId: user.id,
        email: user.email
      });

      return { user: userWithoutPassword, tokens };
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    try {
      // Add token to blacklist (Redis implementation would be better for production)
      // For now, we'll implement a simple database blacklist
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      await this.prisma.tokenBlacklist.create({
        data: {
          token,
          userId: decoded.userId,
          expiresAt: new Date(decoded.exp * 1000),
        }
      });

      logger.info(`User logged out`, { userId: decoded.userId });
    } catch (error) {
      logger.error('Logout failed', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Check if user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        }
      });

      if (!user || !user.isActive) {
        throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void> {
    try {
      // Get current user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user) {
        throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        passwordData.currentPassword, 
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new CustomError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, saltRounds);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          passwordChangedAt: new Date(),
        }
      });

      logger.info(`Password changed for user`, { userId });
    } catch (error) {
      logger.error('Password change failed', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        }
      });

      if (!user) {
        throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
      }

      return user;
    } catch (error) {
      logger.error('Get user profile failed', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      // Remove fields that shouldn't be updated directly
      const { id, password, role, createdAt, updatedAt, ...allowedUpdates } = updateData as any;

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: allowedUpdates,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        }
      });

      logger.info(`Profile updated for user`, { userId });
      
      return updatedUser;
    } catch (error) {
      logger.error('Update profile failed', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true }
      });

      if (!user) {
        // Don't reveal if email exists
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Store reset token (in production, you might want to hash this)
      await this.prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        }
      });

      // TODO: Send email with reset link
      // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Password reset requested for user`, { userId: user.id, email });
    } catch (error) {
      logger.error('Password reset request failed', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'password_reset') {
        throw new CustomError('Invalid reset token', 400, 'INVALID_RESET_TOKEN');
      }

      // Check if token exists in database and is not expired
      const resetTokenRecord = await this.prisma.passwordResetToken.findFirst({
        where: {
          token,
          userId: decoded.userId,
          expiresAt: { gt: new Date() },
          usedAt: null,
        }
      });

      if (!resetTokenRecord) {
        throw new CustomError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and mark token as used
      await Promise.all([
        this.prisma.user.update({
          where: { id: decoded.userId },
          data: { 
            password: hashedPassword,
            passwordChangedAt: new Date(),
          }
        }),
        this.prisma.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: { usedAt: new Date() }
        })
      ]);

      logger.info(`Password reset completed for user`, { userId: decoded.userId });
    } catch (error) {
      logger.error('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'email_verification') {
        throw new CustomError('Invalid verification token', 400, 'INVALID_VERIFICATION_TOKEN');
      }

      await this.prisma.user.update({
        where: { id: decoded.userId },
        data: { 
          emailVerified: true,
          emailVerifiedAt: new Date(),
        }
      });

      logger.info(`Email verified for user`, { userId: decoded.userId });
    } catch (error) {
      logger.error('Email verification failed', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailVerified: true }
      });

      if (!user) {
        throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.emailVerified) {
        throw new CustomError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED');
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { userId, email: user.email, type: 'email_verification' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // TODO: Send verification email
      // await this.emailService.sendEmailVerification(user.email, verificationToken);

      logger.info(`Email verification resent for user`, { userId });
    } catch (error) {
      logger.error('Resend email verification failed', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload = {
      userId,
      email,
      role,
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Verify if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedToken = await this.prisma.tokenBlacklist.findUnique({
        where: { token }
      });

      return !!blacklistedToken;
    } catch (error) {
      logger.error('Token blacklist check failed', error);
      return false;
    }
  }
}
