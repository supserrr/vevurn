import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class DashboardController {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's sales data
      const [todaySales, paymentMethods, topProducts, inventoryAlerts] = await Promise.all([
        // Today's sales totals
        prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            },
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true },
          _count: { id: true },
          _avg: { totalAmount: true }
        }),

        // Payment methods breakdown from payments
        prisma.payment.groupBy({
          by: ['method'],
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            },
            status: 'COMPLETED'
          },
          _sum: { amount: true },
          _count: { method: true }
        }),

        // Top selling products (last 7 days)
        prisma.saleItem.groupBy({
          by: ['productId'],
          where: {
            sale: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              },
              status: 'COMPLETED'
            }
          },
          _sum: { quantity: true, totalPrice: true },
          orderBy: { _sum: { totalPrice: 'desc' } },
          take: 5
        }),

        // Low stock alerts
        prisma.product.findMany({
          where: {
            OR: [
              { stockQuantity: 0 },
              {
                stockQuantity: {
                  lte: prisma.product.fields.minStockLevel
                }
              }
            ],
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            stockQuantity: true,
            minStockLevel: true
          },
          take: 10
        })
      ]);

      // Calculate payment method percentages
      const totalPaymentAmount = paymentMethods.reduce((sum, pm) => sum + Number(pm._sum.amount || 0), 0);
      const paymentMethodsWithPercentage = paymentMethods.map(pm => ({
        method: pm.method,
        count: pm._count.method,
        amount: Number(pm._sum.amount || 0),
        percentage: totalPaymentAmount > 0 ? ((Number(pm._sum.amount || 0)) / totalPaymentAmount) * 100 : 0
      }));

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { category: true }
          });
          return {
            id: item.productId,
            name: product?.name || 'Unknown Product',
            quantitySold: item._sum.quantity || 0,
            revenue: Number(item._sum.totalPrice || 0),
            category: product?.category?.name || 'General'
          };
        })
      );

      // Format inventory alerts
      const formattedInventoryAlerts = inventoryAlerts.map(item => ({
        id: item.id,
        name: item.name,
        currentStock: item.stockQuantity,
        minStock: item.minStockLevel,
        status: item.stockQuantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
      }));

      const dashboardStats = {
        todaySales: {
          totalRevenue: Number(todaySales._sum.totalAmount || 0),
          totalOrders: todaySales._count.id || 0,
          averageOrderValue: Number(todaySales._avg.totalAmount || 0)
        },
        paymentMethods: paymentMethodsWithPercentage,
        topProducts: topProductsWithDetails,
        inventoryAlerts: formattedInventoryAlerts,
        recentActivity: []
      };

      res.json(ApiResponse.success('Dashboard stats retrieved successfully', dashboardStats));

    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      next(error);
    }
  }

  /**
   * Get sales analytics for a date range
   */
  async getSalesAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = to ? new Date(to as string) : new Date();

      // Get sales data for the period
      const [salesData, salesByCategory] = await Promise.all([
        // Get sales data
        prisma.sale.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'COMPLETED'
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),

        // Get sales by category
        prisma.saleItem.groupBy({
          by: ['productId'],
          where: {
            sale: {
              createdAt: {
                gte: startDate,
                lte: endDate
              },
              status: 'COMPLETED'
            }
          },
          _sum: {
            totalPrice: true
          }
        })
      ]);

      // Calculate analytics
      const totalSales = salesData.length;
      const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Group sales by date
      const salesByDate = salesData.reduce((acc, sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += Number(sale.totalAmount);
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { date: string; amount: number; count: number }>);

      // Get category breakdown
      const categoryStats = await Promise.all(
        salesByCategory.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { category: true }
          });
          return {
            categoryName: product?.category?.name || 'Uncategorized',
            value: Number(item._sum.totalPrice || 0)
          };
        })
      );

      // Aggregate by category
      const salesByCategoryAggregated = categoryStats.reduce((acc, item) => {
        const existing = acc.find(c => c.name === item.categoryName);
        if (existing) {
          existing.value += item.value;
        } else {
          acc.push({ name: item.categoryName, value: item.value });
        }
        return acc;
      }, [] as Array<{ name: string; value: number }>);

      const analytics = {
        totalSales,
        totalRevenue: Math.round(totalRevenue),
        averageOrderValue: Math.round(averageOrderValue),
        salesByCategory: salesByCategoryAggregated.sort((a, b) => b.value - a.value).slice(0, 5),
        dailySales: Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date))
      };

      res.json(ApiResponse.success('Sales analytics retrieved successfully', analytics));
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      next(error);
    }
  }
}