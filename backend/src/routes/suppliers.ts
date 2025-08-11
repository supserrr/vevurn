import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema for supplier data
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional()
});

// GET /suppliers - Get all suppliers
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { contact: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.supplier.count({ where: whereClause })
    ]);

    return res.json({
      success: true,
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
});

// GET /suppliers/:id - Get supplier by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    return res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier'
    });
  }
});

// POST /suppliers - Create new supplier
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = supplierSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.issues
      });
    }

    // Check if supplier with same name already exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { name: result.data.name }
    });

    if (existingSupplier) {
      return res.status(409).json({
        success: false,
        message: 'Supplier with this name already exists'
      });
    }

    // Convert empty strings to null for optional fields
    const supplierData = {
      name: result.data.name,
      contact: result.data.contact || null,
      email: result.data.email || null,
      phone: result.data.phone || null,
      address: result.data.address || null
    };

    const supplier = await prisma.supplier.create({
      data: supplierData
    });

    return res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create supplier'
    });
  }
});

// PUT /suppliers/:id - Update supplier
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = supplierSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.issues
      });
    }

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if another supplier with same name exists
    if (result.data.name !== existingSupplier.name) {
      const duplicateName = await prisma.supplier.findFirst({
        where: {
          name: result.data.name,
          NOT: { id }
        }
      });

      if (duplicateName) {
        return res.status(409).json({
          success: false,
          message: 'Another supplier with this name already exists'
        });
      }
    }

    // Convert empty strings to null for optional fields
    const updateData = {
      name: result.data.name,
      contact: result.data.contact || null,
      email: result.data.email || null,
      phone: result.data.phone || null,
      address: result.data.address || null
    };

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData
    });

    return res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update supplier'
    });
  }
});

// DELETE /suppliers/:id - Delete supplier
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete supplier'
    });
  }
});

export default router;
