import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SaleStatus, PaymentMethod } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { validatePagination, generateSaleNumber } from '../utils/helpers';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class SalesController {
  /**
   * Get all sales with filtering and pagination
   */
  async getAllSales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        dateFrom, 
        dateTo,
        customerId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query as any;

      const { page: validPage, limit: validLimit } = validatePagination(page, limit);
      const offset = (validPage - 1) * validLimit;

      // Build where clause
      const where: any = {};

      if (status) where.status = status as SaleStatus;
      if (customerId) where.customerId = customerId;
      if (dateFrom && dateTo) {
        where.createdAt = {
          gte: new Date(dateFrom as string),
          lte: new Date(dateTo as string)
        };
      }

      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    categoryId: true
                  }
                },
                productVariation: true
              }
            },
            payments: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true
              }
            },
            cashier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip: offset,
          take: validLimit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.sale.count({ where })
      ]);

      res.json(ApiResponse.success(
        'Sales retrieved successfully',
        sales,
        {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: Math.ceil(total / validLimit)
        }
      ));
    } catch (error) {
      logger.error('Error fetching sales:', error);
      next(error);
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
              productVariation: true
            }
          },
          payments: true,
          customer: true,
          cashier: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      res.json(ApiResponse.success('Sale retrieved successfully', sale));
    } catch (error) {
      logger.error('Error fetching sale:', error);
      next(error);
    }
  }

  /**
   * Create a new sale
   */
  async createSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { items, customerId, subtotal, taxAmount = 0, discountAmount = 0, totalAmount, notes } = req.body;
      
      if (!req.user) {
        return res.status(401).json(ApiResponse.error('User not authenticated'));
      }

      // Validate that products exist and calculate prices
      const productIds = items.map((item: any) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length !== productIds.length) {
        return res.status(400).json(ApiResponse.error('One or more products not found'));
      }

      // Create sale with items in a transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale
        const newSale = await tx.sale.create({
          data: {
            saleNumber: generateSaleNumber(),
            customerId,
            subtotal: new Decimal(subtotal),
            taxAmount: new Decimal(taxAmount),
            discountAmount: new Decimal(discountAmount),
            totalAmount: new Decimal(totalAmount),
            status: 'DRAFT',
            notes,
            cashierId: req.user!.id,
            items: {
              create: items.map((item: any) => {
                const product = products.find(p => p.id === item.productId);
                const unitPrice = new Decimal(item.unitPrice || product!.retailPrice);
                const discountAmount = new Decimal(item.discountAmount || 0);
                const totalPrice = unitPrice.mul(item.quantity).sub(discountAmount);
                
                return {
                  productId: item.productId,
                  productVariationId: item.productVariationId,
                  quantity: item.quantity,
                  unitPrice,
                  discountAmount,
                  totalPrice,
                  unitCost: product!.costPrice,
                  totalCost: product!.costPrice.mul(item.quantity),
                  notes: item.notes
                };
              })
            }
          },
          include: {
            items: {
              include: {
                product: true,
                productVariation: true
              }
            },
            customer: true
          }
        });

        // Update stock quantities
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          });

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'STOCK_OUT',
              quantity: -item.quantity, // Negative for outgoing stock
              referenceType: 'SALE',
              referenceId: newSale.id,
              reason: 'SALE',
              notes: `Sale: ${newSale.saleNumber}`,
              stockBefore: 0, // You'd get this from current stock
              stockAfter: 0,  // You'd calculate this
              createdBy: req.user!.id
            }
          });
        }

        return newSale;
      });

      res.status(201).json(ApiResponse.success('Sale created successfully', sale));
    } catch (error) {
      logger.error('Error creating sale:', error);
      next(error);
    }
  }

  /**
   * Complete a sale (mark as completed and process final payments)
   */
  async completeSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const sale = await prisma.sale.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      if (sale.status === 'COMPLETED') {
        return res.status(400).json(ApiResponse.error('Sale is already completed'));
      }

      // Update sale status
      const updatedSale = await prisma.sale.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        },
        include: {
          items: {
            include: {
              product: true,
              productVariation: true
            }
          },
          payments: true,
          customer: true
        }
      });

      res.json(ApiResponse.success('Sale completed successfully', updatedSale));
    } catch (error) {
      logger.error('Error completing sale:', error);
      next(error);
    }
  }

  /**
   * Get daily sales statistics
   */
  async getDailyStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      
      // Set start and end of day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [salesStats, salesCount] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          _sum: {
            totalAmount: true,
            discountAmount: true
          },
          _avg: {
            totalAmount: true
          }
        }),
        prisma.sale.count({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      ]);

      const stats = {
        date: targetDate.toISOString().split('T')[0],
        totalSales: salesCount,
        totalRevenue: salesStats._sum.totalAmount || 0,
        totalDiscounts: salesStats._sum.discountAmount || 0,
        averageSaleValue: salesStats._avg.totalAmount || 0
      };

      res.json(ApiResponse.success('Daily stats retrieved successfully', stats));
    } catch (error) {
      logger.error('Error fetching daily stats:', error);
      next(error);
    }
  }
}
