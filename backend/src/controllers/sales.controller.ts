import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SaleStatus, PaymentMethod } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { validatePagination, generateSaleNumber } from '../utils/helpers';
import { NotificationService } from '../services/notification.service';
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

      // Filter by business if user is authenticated
      if (req.user?.businessId) {
        where.businessId = req.user.businessId;
      }

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
   * Create a new sale (Process POS transaction)
   */
  async createSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { 
        items, 
        customerId, 
        customerName, 
        paymentMethod = 'CASH', 
        discount = 0,
        amountPaid = 0 
      } = req.body;
      
      const cashierId = req.user!.id;
      const businessId = req.user!.businessId;

      if (!businessId) {
        return res.status(400).json(
          ApiResponse.error('User must have a business setup to process sales', 400)
        );
      }

      // Calculate totals
      let subtotal = 0;
      const saleItems = [];

      for (const item of items) {
        const product = await prisma.product.findFirst({
          where: { 
            id: item.productId,
            businessId // Ensure product belongs to the same business
          }
        });

        if (!product) {
          return res.status(400).json(
            ApiResponse.error(`Product not found: ${item.productId}`, 400)
          );
        }

        if (product.stockQuantity < item.quantity) {
          return res.status(400).json(
            ApiResponse.error(
              `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`, 
              400
            )
          );
        }

        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;

        saleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          discountAmount: new Decimal(item.discount || 0),
          totalPrice: new Decimal(itemTotal),
          unitCost: product.costPrice,
          totalCost: product.costPrice.mul(item.quantity)
        });
      }

      const total = subtotal - discount;
      const changeAmount = Math.max(0, amountPaid - total);
      const saleNumber = generateSaleNumber();

      // Create sale with items in transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale
        const newSale = await tx.sale.create({
          data: {
            saleNumber,
            customerId,
            businessId,
            subtotal: new Decimal(subtotal),
            discountAmount: new Decimal(discount),
            totalAmount: new Decimal(total),
            amountPaid: new Decimal(amountPaid),
            amountDue: new Decimal(Math.max(0, total - amountPaid)),
            changeAmount: new Decimal(changeAmount),
            status: 'COMPLETED',
            cashierId,
            completedAt: new Date(),
            items: {
              create: saleItems
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                }
              }
            },
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

        // Create payment record
        if (amountPaid > 0) {
          await tx.payment.create({
            data: {
              saleId: newSale.id,
              amount: new Decimal(amountPaid),
              method: paymentMethod as PaymentMethod,
              status: 'COMPLETED',
              processedAt: new Date(),
              changeGiven: changeAmount > 0 ? new Decimal(changeAmount) : null,
              changeMethod: changeAmount > 0 ? 'CASH' : null
            }
          });
        }

        // Update product stock and create inventory movements
        for (const item of items) {
          const product = await tx.product.findUnique({ 
            where: { id: item.productId } 
          });
          
          if (!product) continue;

          const newStock = product.stockQuantity - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock }
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'STOCK_OUT',
              quantity: item.quantity,
              stockBefore: product.stockQuantity,
              stockAfter: newStock,
              referenceType: 'SALE',
              referenceId: newSale.id,
              reason: 'Sale transaction',
              createdBy: cashierId
            }
          });

          // Check for stock alerts and send notifications
          if (newStock <= product.minStockLevel) {
            if (newStock === 0) {
              await NotificationService.notifyOutOfStock(businessId, {
                ...product,
                stockQuantity: newStock
              });
            } else {
              await NotificationService.notifyLowStock(businessId, {
                ...product,
                stockQuantity: newStock
              });
            }
          }
        }

        return newSale;
      });

      // Send sale alert for large transactions
      if (total >= 100000) { // 100k RWF or more
        await NotificationService.notifySaleAlert(businessId, sale, 'large_sale');
      }

      logger.info('Sale completed:', {
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        businessId,
        total: sale.totalAmount.toNumber(),
        cashier: cashierId
      });

      res.status(201).json(
        ApiResponse.success('Sale completed successfully', sale)
      );
    } catch (error) {
      logger.error('Error processing sale:', error);
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

  /**
   * Update sale status or notes
   */
  async updateSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const sale = await prisma.sale.findUnique({
        where: { id }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      const updatedSale = await prisma.sale.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(notes && { notes }),
          updatedAt: new Date()
        },
        include: {
          items: true,
          customer: true,
          cashier: { select: { name: true, email: true } }
        }
      });

      res.json(ApiResponse.success('Sale updated successfully', updatedSale));
    } catch (error) {
      logger.error('Error updating sale:', error);
      next(error);
    }
  }

  /**
   * Void a sale (mark as cancelled)
   */
  async voidSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const sale = await prisma.sale.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      if (sale.status === 'COMPLETED') {
        return res.status(400).json(ApiResponse.error('Cannot void completed sale. Create refund instead.'));
      }

      await prisma.$transaction(async (tx) => {
        // Update sale status
        await tx.sale.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            notes: reason || 'Sale voided',
            cancelledAt: new Date()
          }
        });

        // Restore inventory for each item
        for (const item of sale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity }
            }
          });

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'STOCK_IN',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalValue: item.totalPrice,
              stockBefore: 0, // Will be calculated
              stockAfter: 0,  // Will be calculated  
              referenceType: 'SALE',
              referenceId: id,
              reason: 'Sale voided - inventory restored',
              createdBy: req.user!.id
            }
          });
        }
      });

      res.json(ApiResponse.success('Sale voided successfully'));
    } catch (error) {
      logger.error('Error voiding sale:', error);
      next(error);
    }
  }

  /**
   * Get receipt data for a sale
   */
  async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true }
              }
            }
          },
          customer: true,
          cashier: {
            select: { name: true, email: true }
          },
          payments: true
        }
      });

      if (!sale) {
        return res.status(404).json(ApiResponse.error('Sale not found'));
      }

      // Format receipt data
      const receipt = {
        sale: {
          id: sale.id,
          saleNumber: sale.saleNumber,
          date: sale.createdAt,
          status: sale.status
        },
        customer: sale.customer ? {
          name: `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim(),
          phone: sale.customer.phone,
          email: sale.customer.email
        } : null,
        cashier: {
          name: sale.cashier.name,
          email: sale.cashier.email
        },
        items: sale.items.map(item => ({
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        totals: {
          subtotal: sale.subtotal,
          taxAmount: sale.taxAmount,
          discountAmount: sale.discountAmount,
          totalAmount: sale.totalAmount,
          amountPaid: sale.amountPaid,
          changeAmount: sale.changeAmount
        },
        payments: sale.payments.map(payment => ({
          method: payment.method,
          amount: payment.amount,
          status: payment.status,
          processedAt: payment.processedAt
        })),
        companyInfo: {
          name: 'Vevurn POS',
          address: 'Kigali, Rwanda',
          phone: '+250 788 000 000',
          taxNumber: 'TIN: 123456789'
        }
      };

      res.json(ApiResponse.success('Receipt retrieved successfully', receipt));
    } catch (error) {
      logger.error('Error getting receipt:', error);
      next(error);
    }
  }
}
