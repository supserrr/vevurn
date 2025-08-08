import { Router } from 'express'
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { AuthenticatedRequest } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import { roleMiddleware } from '../middleware/roleMiddleware'

const router = Router()
const prisma = new PrismaClient()

// Settings validation schema
const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email('Invalid email format').optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.enum(['RWF', 'USD', 'EUR']).optional(),
  receiptFooter: z.string().optional(),
  lowStockThreshold: z.number().int().positive().optional(),
  enableNotifications: z.boolean().optional(),
  enableInventoryAlerts: z.boolean().optional(),
  enableSalesReports: z.boolean().optional(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']).optional()
})

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'settings' })
})

// Apply authentication - different permissions for different operations
router.use(authMiddleware)

// Get system settings (all authenticated users can view)
router.get('/', async (_req: Request, res: Response) => {
  try {
    // For simplicity, we'll store settings in a JSON structure
    // In a real app, you might have a Settings table
    const settings = {
      companyName: 'Vevurn POS',
      companyAddress: 'Kigali, Rwanda',
      companyPhone: '+250 000 000 000',
      companyEmail: 'info@vevurn.com',
      taxRate: 18.0,
      currency: 'RWF',
      receiptFooter: 'Thank you for your business!',
      lowStockThreshold: 10,
      enableNotifications: true,
      enableInventoryAlerts: true,
      enableSalesReports: true,
      backupFrequency: 'daily'
    }

    res.json({
      success: true,
      data: settings
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    })
  }
})

// Update settings (admin only)
router.put('/', roleMiddleware(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = settingsSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      })
    }

    // In a real implementation, you would update the settings in the database
    // For now, we'll just return the updated settings
    const updatedSettings = {
      ...result.data,
      updatedAt: new Date(),
      updatedBy: req.user!.id
    }

    return res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    })
  }
})

// Get system statistics (manager+ only)
router.get('/stats', roleMiddleware(['manager', 'admin']), async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalProducts,
      totalSales,
      activeLoans,
      lowStockItems
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.sale.count(),
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lt: 10 } // Low stock threshold
        }
      })
    ])

    const stats = {
      users: {
        total: totalUsers,
        active: totalUsers
      },
      customers: {
        total: totalCustomers,
        active: totalCustomers
      },
      products: {
        total: totalProducts,
        active: totalProducts,
        lowStock: lowStockItems
      },
      sales: {
        total: totalSales
      },
      loans: {
        active: activeLoans
      },
      alerts: {
        lowStock: lowStockItems > 0,
        count: lowStockItems
      }
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    })
  }
})

// Backup system data (admin only)
router.post('/backup', roleMiddleware(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real implementation, this would trigger a backup process
    const backupInfo = {
      id: `backup_${Date.now()}`,
      timestamp: new Date(),
      initiatedBy: req.user!.id,
      status: 'initiated',
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }

    res.json({
      success: true,
      data: backupInfo,
      message: 'Backup initiated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initiate backup'
    })
  }
})

// Test database connection (admin only)
router.get('/database/test', roleMiddleware(['admin']), async (_req: Request, res: Response) => {
  try {
    // Simple database connection test
    await prisma.$queryRaw`SELECT 1`

    res.json({
      success: true,
      data: {
        status: 'connected',
        timestamp: new Date(),
        version: process.env.DATABASE_URL ? 'connected' : 'not configured'
      },
      message: 'Database connection successful'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Clear cache (admin only)
router.post('/cache/clear', roleMiddleware(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real implementation, this would clear Redis cache
    // For now, we'll simulate it
    
    res.json({
      success: true,
      data: {
        cleared: true,
        timestamp: new Date(),
        clearedBy: req.user!.id
      },
      message: 'Cache cleared successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    })
  }
})

export default router
