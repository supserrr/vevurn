import { Router } from 'express'
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'categories' })
})

// Get all categories with product counts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    })
  }
})

export default router
