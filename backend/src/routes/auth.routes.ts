import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireAdmin, requireAuth, requireManagerOrAdmin } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { EmailService } from '../services/email.service';
import { AuthService } from '../services/auth.service';
import { auth } from '../auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.middleware';
import { createCashierSchema } from '../validators/auth.schemas';

const router: Router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional().default('CASHIER')
});

const createCashierSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phoneNumber: z.string().optional()
});

const businessSetupSchema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(100),
  tin: z.string().optional(),
  logo: z.string().optional() // S3 URL after upload
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  isActive: z.boolean().optional()
});

// Business setup for new managers
router.post('/business/setup', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = businessSetupSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if user already has a business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (user?.businessId) {
      return res.status(409).json(
        ApiResponse.error('User already has a business setup', 409)
      );
    }

    // Create business and update user
    const business = await prisma.$transaction(async (tx) => {
      // Create the business
      const newBusiness = await tx.business.create({
        data: {
          name: validatedData.businessName,
          tin: validatedData.tin,
          logo: validatedData.logo,
          ownerId: userId
        }
      });

      // Update user to be a manager and link to business
      await tx.user.update({
        where: { id: userId },
        data: {
          businessId: newBusiness.id,
          role: 'MANAGER'
        }
      });

      return newBusiness;
    });

    logger.info('Business setup completed', { 
      userId, 
      businessId: business.id,
      businessName: business.name 
    });

    res.status(201).json(
      ApiResponse.success('Business setup completed successfully', business)
    );
  } catch (error) {
    logger.error('Error setting up business:', error);
    next(error);
  }
});

// Create cashier account (Manager/Admin only)
router.post('/create-cashier', 
  requireManagerOrAdmin,
  validateRequest({ body: createCashierSchema }),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const managerId = req.user!.id;
      const businessId = req.user!.businessId!;
      const { email, name, phoneNumber } = req.body;

      const cashier = await AuthService.createCashier(managerId, businessId, {
        email,
        name,
        phoneNumber
      });

      res.status(201).json(
        ApiResponse.success('Cashier account created successfully', cashier)
      );
    } catch (error) {
      next(error);
    }
  }
);

// Get all cashiers for the business
router.get('/cashiers',
  requireManagerOrAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const businessId = req.user!.businessId!;
      const cashiers = await AuthService.getCashiers(businessId);

      res.json(
        ApiResponse.success('Cashiers retrieved successfully', cashiers)
      );
    } catch (error) {
      next(error);
    }
  }
);

// Deactivate cashier
router.put('/cashiers/:id/deactivate',
  requireManagerOrAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cashierId = req.params.id;
      const businessId = req.user!.businessId!;

      const cashier = await AuthService.deactivateCashier(cashierId, businessId);

      res.json(
        ApiResponse.success('Cashier deactivated successfully', cashier)
      );
    } catch (error) {
      next(error);
    }
  }
);

// Admin-only user management routes
router.post('/admin/create-user', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(409).json(
        ApiResponse.error('User with this email already exists', 409)
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        isActive: true,
        emailVerified: true,
        // Note: In a real implementation, you'd integrate with Better Auth properly
        // For now, we'll just create the user record
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    logger.info('User created by admin', { 
      adminId: req.user?.id, 
      newUserId: user.id,
      userEmail: user.email 
    });

    res.status(201).json(
      ApiResponse.success('User created successfully', user)
    );
  } catch (error) {
    logger.error('Error creating user:', error);
    next(error);
  }
});

router.get('/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (role) where.role = role;
    if (status !== undefined) where.isActive = status === 'active';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              sales: true,
              createdProducts: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json(ApiResponse.success('Users retrieved successfully', {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
});

router.put('/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json(
        ApiResponse.error('User not found', 404)
      );
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info('User updated by admin', { 
      adminId: req.user?.id, 
      updatedUserId: user.id 
    });

    res.json(ApiResponse.success('User updated successfully', user));
  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
});

router.delete('/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json(
        ApiResponse.error('User not found', 404)
      );
    }

    // Prevent admin from deleting themselves
    if (id === req.user?.id) {
      return res.status(400).json(
        ApiResponse.error('Cannot delete your own account', 400)
      );
    }

    // Soft delete user by deactivating
    const user = await prisma.user.update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    logger.info('User deactivated by admin', { 
      adminId: req.user?.id, 
      deactivatedUserId: user.id 
    });

    res.json(ApiResponse.success('User deactivated successfully', user));
  } catch (error) {
    logger.error('Error deactivating user:', error);
    next(error);
  }
});

// Profile routes for authenticated users
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json(
        ApiResponse.error('User not found', 404)
      );
    }

    res.json(ApiResponse.success('Profile retrieved successfully', user));
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    next(error);
  }
});

router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const updateProfileSchema = z.object({
      name: z.string().min(1).max(100).optional()
    });

    const validatedData = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });

    logger.info('User profile updated', { userId: user.id });

    res.json(ApiResponse.success('Profile updated successfully', user));
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
});

// User activity and stats
router.get('/admin/users/:id/activity', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query as any;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const [salesCount, recentSales] = await Promise.all([
      prisma.sale.count({
        where: {
          cashierId: id,
          createdAt: { gte: startDate }
        }
      }),
      prisma.sale.findMany({
        where: {
          cashierId: id
        },
        include: {
          customer: { select: { firstName: true, lastName: true } }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json(ApiResponse.success('User activity retrieved successfully', {
      salesCount,
      recentSales,
      period: `${days} days`
    }));
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    next(error);
  }
});

export default router;
