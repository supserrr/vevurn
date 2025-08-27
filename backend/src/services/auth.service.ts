import { prisma } from '../lib/prisma';
import { auth } from '../auth';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

export class AuthService {
  static async createCashier(
    managerId: string,
    businessId: string,
    data: {
      email: string;
      name: string;
      phoneNumber?: string;
    }
  ) {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new CustomError('Email already exists', 400, 'EMAIL_EXISTS');
      }

      // Generate temporary password
      const tempPassword = this.generateTempPassword();

      // Create cashier account using Better Auth
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: 'CASHIER',
          businessId,
          phoneNumber: data.phoneNumber,
          isActive: true,
          emailVerified: false
        }
      });

      // Create account record for password
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          password: await auth.crypto.hash(tempPassword)
        }
      });

      // Send email with credentials
      await EmailService.sendCashierCredentials(data.email, {
        name: data.name,
        email: data.email,
        tempPassword,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      });

      logger.info('Cashier account created', { 
        cashierId: user.id, 
        managerId, 
        businessId 
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      };

    } catch (error) {
      logger.error('Cashier creation failed:', error);
      throw error;
    }
  }

  static generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static async getCashiers(businessId: string) {
    const cashiers = await prisma.user.findMany({
      where: {
        businessId,
        role: 'CASHIER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return cashiers;
  }

  static async deactivateCashier(cashierId: string, businessId: string) {
    const cashier = await prisma.user.update({
      where: { 
        id: cashierId,
        businessId // Ensure cashier belongs to the business
      },
      data: { isActive: false }
    });

    return cashier;
  }
}
