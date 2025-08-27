import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin, requireAuth } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional().default('CASHIER')
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  isActive: z.boolean().optional()
});

// Admin-only user management routes
router.post('/admin/create-user', requireAdmin, async (req, res, next) => {
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

router.put('/admin/users/:id', requireAdmin, async (req, res, next) => {
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

router.delete('/admin/users/:id', requireAdmin, async (req, res, next) => {
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
router.get('/profile', requireAuth, async (req, res, next) => {
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

router.put('/profile', requireAuth, async (req, res, next) => {
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
