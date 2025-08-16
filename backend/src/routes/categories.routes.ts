import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/better-auth.middleware';

const router: Router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/categories
 * Get all categories with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        skip: offset,
        take: limit,
        where: {
          isActive: true,
          deletedAt: null
        },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.category.count({
        where: {
          isActive: true,
          deletedAt: null
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error?.message || 'Unknown error' : 'Internal server error'
    });
  }
});

/**
 * POST /api/categories
 * Create a new category
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'VALIDATION_ERROR'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? error?.message || 'Unknown error' : 'Internal server error'
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        color: color || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: process.env.NODE_ENV === 'development' ? error?.message || 'Unknown error' : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Soft delete a category
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { 
        categoryId: id,
        status: 'ACTIVE',
        deletedAt: null
      }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productsCount} active products`,
        error: 'CATEGORY_HAS_PRODUCTS'
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: { id }
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: process.env.NODE_ENV === 'development' ? error?.message || 'Unknown error' : 'Internal server error'
    });
  }
});

export default router;
