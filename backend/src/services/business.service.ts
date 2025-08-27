import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';
import { uploadToS3 } from '../utils/s3-upload';

export class BusinessService {
  static async setupBusiness(userId: string, data: {
    businessName: string;
    tin?: string;
    logo?: Express.Multer.File;
  }) {
    try {
      // Check if user already has a business
      const existingBusiness = await prisma.business.findFirst({
        where: { ownerId: userId }
      });

      if (existingBusiness) {
        throw new CustomError('User already has a business', 400, 'BUSINESS_EXISTS');
      }

      let logoUrl: string | undefined;
      if (data.logo) {
        logoUrl = await uploadToS3(data.logo, 'business-logos');
      }

      // Create business
      const business = await prisma.business.create({
        data: {
          name: data.businessName,
          tin: data.tin,
          logo: logoUrl,
          ownerId: userId,
        }
      });

      // Update user with business association
      await prisma.user.update({
        where: { id: userId },
        data: { 
          businessId: business.id,
          role: 'MANAGER' // Promote to manager role
        }
      });

      logger.info('Business setup completed', { businessId: business.id, userId });
      return business;

    } catch (error) {
      logger.error('Business setup failed:', error);
      throw error;
    }
  }

  static async getBusiness(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true
          }
        },
        _count: {
          select: {
            products: true,
            customers: true,
            sales: true
          }
        }
      }
    });

    if (!business) {
      throw new CustomError('Business not found', 404, 'BUSINESS_NOT_FOUND');
    }

    return business;
  }

  static async updateBusiness(businessId: string, data: {
    name?: string;
    tin?: string;
    logo?: Express.Multer.File;
  }) {
    try {
      let logoUrl: string | undefined;
      if (data.logo) {
        logoUrl = await uploadToS3(data.logo, 'business-logos');
      }

      const business = await prisma.business.update({
        where: { id: businessId },
        data: {
          name: data.name,
          tin: data.tin,
          ...(logoUrl && { logo: logoUrl })
        }
      });

      return business;
    } catch (error) {
      logger.error('Business update failed:', error);
      throw error;
    }
  }
}
