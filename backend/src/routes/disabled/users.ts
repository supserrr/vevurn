import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas (simplified to match actual schema fields)
const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().default('cashier'),
  maxDiscountAllowed: z.number().min(0).max(100).default(5),
  canSellBelowMin: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
  maxDiscountAllowed: z.number().min(0).max(100).optional(),
  canSellBelowMin: z.boolean().optional(),
  isActive: z.boolean().optional()
});

// GET /users/profile - Get current user's profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// PUT /users/profile - Update current user's profile
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.issues
      });
    }

    const updateData: any = {};
    if (result.data.firstName !== undefined) updateData.firstName = result.data.firstName;
    if (result.data.lastName !== undefined) updateData.lastName = result.data.lastName;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
});

// GET /users - Get all users
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive === 'false' ? false : undefined;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }
    
    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          maxDiscountAllowed: true,
          canSellBelowMin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// GET /users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// POST /users - Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.issues
      });
    }

    // Check if user with same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: result.data.email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await prisma.user.create({
      data: {
        email: result.data.email,
        firstName: result.data.firstName || null,
        lastName: result.data.lastName || null,
        role: result.data.role,
        maxDiscountAllowed: result.data.maxDiscountAllowed,
        canSellBelowMin: result.data.canSellBelowMin,
        isActive: result.data.isActive
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// PUT /users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.issues
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateData: any = {};
    if (result.data.firstName !== undefined) updateData.firstName = result.data.firstName;
    if (result.data.lastName !== undefined) updateData.lastName = result.data.lastName;
    if (result.data.role !== undefined) updateData.role = result.data.role;
    if (result.data.maxDiscountAllowed !== undefined) updateData.maxDiscountAllowed = result.data.maxDiscountAllowed;
    if (result.data.canSellBelowMin !== undefined) updateData.canSellBelowMin = result.data.canSellBelowMin;
    if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// DELETE /users/:id - Delete user (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by setting isActive to false
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

export default router;
