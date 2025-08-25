import { Request, Response, NextFunction } from 'express';
import { PrismaClient, MovementType, TransactionType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { validatePagination } from '../utils/helpers';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class InventoryController {
  /**
   * Adjust stock for a product
   */
  async adjustStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { quantity, type, reason, unitPrice } = req.body;
      const userId = req.user!.id;

      // Validate input
      if (!quantity || !type || !reason) {
        return res.status(400).json(ApiResponse.error('Quantity, type, and reason are required'));
      }

      if (!Object.values(MovementType).includes(type)) {
        return res.status(400).json(ApiResponse.error('Invalid movement type'));
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variations: true }
      });

      if (!product) {
        return res.status(404).json(ApiResponse.error('Product not found'));
      }

      const result = await prisma.$transaction(async (tx) => {
        // Calculate new stock quantity
        const newStock = type === MovementType.STOCK_IN 
          ? product.stockQuantity + Math.abs(quantity)
          : product.stockQuantity - Math.abs(quantity);

        // Ensure stock doesn't go negative
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }

        // Create inventory movement record
        const movement = await tx.inventoryMovement.create({
          data: {
            productId,
            type,
            quantity: Math.abs(quantity),
            reason,
            unitPrice: unitPrice ? new Decimal(unitPrice) : null,
            totalValue: unitPrice ? new Decimal(unitPrice).mul(Math.abs(quantity)) : null,
            stockBefore: product.stockQuantity,
            stockAfter: newStock,
            createdBy: userId
          }
        });

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: newStock
          },
          include: {
            category: true,
            variations: true
          }
        });

        return { movement, product: updatedProduct };
      });

      logger.info(`Stock adjusted for product ${productId}: ${type} ${quantity} units`, {
        productId,
        type,
        quantity,
        userId
      });

      return res.status(200).json(ApiResponse.success('Stock adjusted successfully', result));
    } catch (error) {
      logger.error('Error adjusting stock:', error);
      if (error instanceof Error && error.message === 'Insufficient stock') {
        return res.status(400).json(ApiResponse.error('Insufficient stock'));
      }
      next(error);
    }
  }

  /**
   * Get products with low stock
   */
  async getLowStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { threshold = 10 } = req.query as any;
      const numericThreshold = parseInt(threshold);

      const lowStockProducts = await prisma.product.findMany({
        where: {
          stockQuantity: {
            lte: numericThreshold
          },
          status: 'ACTIVE'
        },
        include: {
          category: true,
          variations: true
        },
        orderBy: {
          stockQuantity: 'asc'
        }
      });

      return res.status(200).json(ApiResponse.success('Low stock products retrieved successfully', {
        products: lowStockProducts,
        count: lowStockProducts.length,
        threshold: numericThreshold
      }));
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      next(error);
    }
  }

  /**
   * Restock product (shorthand for stock adjustment IN)
   */
  async restockProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { quantity, unitPrice, supplier, notes } = req.body;
      const userId = req.user!.id;

      if (!quantity || quantity <= 0) {
        return res.status(400).json(ApiResponse.error('Valid quantity is required'));
      }

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json(ApiResponse.error('Product not found'));
      }

      const result = await prisma.$transaction(async (tx) => {
        const newStock = product.stockQuantity + quantity;

        // Create inventory movement
        const movement = await tx.inventoryMovement.create({
          data: {
            productId,
            type: MovementType.STOCK_IN,
            quantity,
            reason: `Restock from ${supplier || 'supplier'}${notes ? `: ${notes}` : ''}`,
            unitPrice: unitPrice ? new Decimal(unitPrice) : null,
            totalValue: unitPrice ? new Decimal(unitPrice).mul(quantity) : null,
            stockBefore: product.stockQuantity,
            stockAfter: newStock,
            createdBy: userId
          }
        });

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: newStock,
            // Update cost if provided
            ...(unitPrice && { costPrice: new Decimal(unitPrice) })
          },
          include: {
            category: true,
            variations: true
          }
        });

        return { movement, product: updatedProduct };
      });

      logger.info(`Product restocked: ${productId} (+${quantity} units)`, {
        productId,
        quantity,
        supplier,
        userId
      });

      return res.status(200).json(ApiResponse.success('Product restocked successfully', result));
    } catch (error) {
      logger.error('Error restocking product:', error);
      next(error);
    }
  }

  /**
   * Get inventory movement history
   */
  async getMovementHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        productId, 
        type,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query as any;

      const { page: validPage, limit: validLimit } = validatePagination(page, limit);
      const offset = (validPage - 1) * validLimit;

      const where: any = {};

      if (productId) where.productId = productId;
      if (type) where.type = type;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [movements, total] = await Promise.all([
        prisma.inventoryMovement.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: offset,
          take: validLimit
        }),
        prisma.inventoryMovement.count({ where })
      ]);

      const totalPages = Math.ceil(total / validLimit);

      return res.status(200).json(ApiResponse.paginated(
        'Inventory movement history retrieved successfully',
        movements,
        validPage,
        validLimit,
        total
      ));
    } catch (error) {
      logger.error('Error getting inventory movement history:', error);
      next(error);
    }
  }

  /**
   * Transfer stock between locations (future feature placeholder)
   */
  async transferStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { fromLocationId, toLocationId, items } = req.body;
      const userId = req.user!.id;

      // This is a placeholder for future multi-location support
      return res.status(400).json(ApiResponse.error(
        'Stock transfer feature not yet implemented. Currently supporting single location only.'
      ));
    } catch (error) {
      logger.error('Error transferring stock:', error);
      next(error);
    }
  }

  /**
   * Get inventory summary statistics
   */
  async getInventorySummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [
        totalProducts,
        activeProducts,
        totalStock,
        lowStockCount,
        outOfStockCount,
        recentMovements
      ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.product.aggregate({
          where: { status: 'ACTIVE' },
          _sum: {
            stockQuantity: true
          }
        }),
        prisma.product.count({
          where: {
            stockQuantity: { lte: 10 },
            status: 'ACTIVE'
          }
        }),
        prisma.product.count({
          where: {
            stockQuantity: 0,
            status: 'ACTIVE'
          }
        }),
        prisma.inventoryMovement.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        })
      ]);

      return res.status(200).json(ApiResponse.success('Inventory summary retrieved successfully', {
        summary: {
          totalProducts,
          activeProducts,
          totalStockUnits: totalStock._sum.stockQuantity || 0,
          lowStockCount,
          outOfStockCount
        },
        recentMovements
      }));
    } catch (error) {
      logger.error('Error getting inventory summary:', error);
      next(error);
    }
  }

  /**
   * Get stock alerts
   */
  async getStockAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { threshold = 10 } = req.query as any;
      const numericThreshold = parseInt(threshold);

      const [lowStock, outOfStock] = await Promise.all([
        prisma.product.findMany({
          where: {
            stockQuantity: {
              gt: 0,
              lte: numericThreshold
            },
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
            minStockLevel: true,
            category: {
              select: {
                name: true
              }
            }
          },
          orderBy: { stockQuantity: 'asc' }
        }),
        prisma.product.findMany({
          where: {
            stockQuantity: 0,
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
            minStockLevel: true,
            category: {
              select: {
                name: true
              }
            }
          }
        })
      ]);

      return res.status(200).json(ApiResponse.success('Stock alerts retrieved successfully', {
        alerts: {
          lowStock: lowStock.map(p => ({
            ...p,
            alertType: 'LOW_STOCK',
            message: `Only ${p.stockQuantity} units remaining (minimum: ${p.minStockLevel})`
          })),
          outOfStock: outOfStock.map(p => ({
            ...p,
            alertType: 'OUT_OF_STOCK',
            message: 'Product is out of stock'
          }))
        },
        counts: {
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          total: lowStock.length + outOfStock.length
        }
      }));
    } catch (error) {
      logger.error('Error getting stock alerts:', error);
      next(error);
    }
  }
}
