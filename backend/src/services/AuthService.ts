import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export class AuthService {
  private static instance: AuthService;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRE: string;

  private constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    this.JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: object): string {
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRE as string | number 
    } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  generateEmployeeId(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp.slice(-6)}${random}`;
  }
}
