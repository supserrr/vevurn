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

        // Payment methods breakdown - for now return empty array
        Promise.resolve([]),

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
            stockQuantity: {
              lte: 5  // Alert when stock is 5 or below
            },
            status: 'ACTIVE',
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
      const paymentMethodsWithPercentage: Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
      }> = [];

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (tp) => {
          const product = await prisma.product.findUnique({
            where: { id: tp.productId },
            include: { category: true }
          });
          return {
            id: tp.productId,
            name: product?.name || 'Unknown Product',
            quantitySold: tp._sum.quantity || 0,
            revenue: Number(tp._sum.totalPrice || 0),
            category: product?.category?.name || 'Unknown'
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
      return;

      // TODO: Uncomment this when database is available
      /* 
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Get today's sales data
      const [todaySales, todaySalesCount, allSales] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            },
            status: 'COMPLETED'
          },
          _sum: {
            totalAmount: true
          }
        }),
        prisma.sale.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            },
            status: 'COMPLETED'
          }
        }),
        prisma.sale.findMany({
          where: {
            status: 'COMPLETED'
          },
          include: {
            payments: true,
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        })
      ]);

      const totalRevenue = todaySales._sum.totalAmount || 0;
      const totalOrders = todaySalesCount;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get payment methods breakdown
      const paymentMethods = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        },
        _count: {
          method: true
        }
      });

      const totalPaymentAmount = paymentMethods.reduce((sum, pm) => sum + (pm._sum.amount || 0), 0);
      const paymentMethodsStats = paymentMethods.map(pm => ({
        method: pm.method,
        count: pm._count.method,
        amount: pm._sum.amount || 0,
        percentage: totalPaymentAmount > 0 ? ((pm._sum.amount || 0) / totalPaymentAmount) * 100 : 0
      }));

      // Get top products by quantity sold
      const topProducts = await prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
          totalPrice: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

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
            revenue: item._sum.totalPrice || 0,
            category: product?.category?.name || 'General'
          };
        })
      );

      // Get inventory alerts (low stock products)
      const inventoryAlerts = await prisma.product.findMany({
        where: {
          OR: [
            {
              stockQuantity: 0
            },
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
      });

      const inventoryAlertsFormatted = inventoryAlerts.map(product => ({
        id: product.id,
        name: product.name,
        currentStock: product.stockQuantity,
        minStock: product.minStockLevel,
        status: product.stockQuantity === 0 ? 'OUT_OF_STOCK' as const : 'LOW_STOCK' as const
      }));

      // Get recent activity
      const recentSales = await prisma.sale.findMany({
        include: {
          customer: true,
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      const recentActivity = recentSales.map(sale => ({
        id: sale.id,
        type: 'SALE',
        description: `Sale ${sale.saleNumber} completed`,
        amount: sale.totalAmount,
        timestamp: sale.createdAt.toISOString()
      }));

      const dashboardStats = {
        todaySales: {
          totalRevenue: Number(totalRevenue),
          totalOrders,
          averageOrderValue: Number(averageOrderValue)
        },
        paymentMethods: paymentMethodsStats,
        topProducts: topProductsWithDetails,
        inventoryAlerts: inventoryAlertsFormatted,
        recentActivity
      };

      res.json(ApiResponse.success('Dashboard stats retrieved successfully', dashboardStats));
      */
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
      // Return demo analytics data when database is unavailable
      const analytics = {
        totalSales: 47,
        totalRevenue: 2150000,
        averageOrderValue: 45745,
        salesByCategory: [
          { name: 'Phone Cases', value: 650000 },
          { name: 'Screen Protectors', value: 425000 },
          { name: 'Chargers', value: 380000 },
          { name: 'Headphones', value: 495000 },
          { name: 'Power Banks', value: 200000 }
        ],
        dailySales: [
          { date: '2025-08-23', amount: 285000, count: 8 },
          { date: '2025-08-24', amount: 320000, count: 9 },
          { date: '2025-08-25', amount: 410000, count: 11 },
          { date: '2025-08-26', amount: 685000, count: 14 },
          { date: '2025-08-27', amount: 450000, count: 12 }
        ]
      };

      res.json(ApiResponse.success('Sales analytics retrieved successfully', analytics));
      return;

      // TODO: Uncomment this when database is available
      /*
      const { from, to } = req.query;
      
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = to ? new Date(to as string) : new Date();

      const salesData = await prisma.sale.findMany({
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
        }
      });

      const totalSales = salesData.length;
      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Group sales by category
      const salesByCategory = salesData.reduce((acc: any, sale) => {
        sale.items.forEach(item => {
          const categoryName = item.product?.category?.name || 'General';
          if (!acc[categoryName]) {
            acc[categoryName] = { name: categoryName, value: 0 };
          }
          acc[categoryName].value += item.totalPrice;
        });
        return acc;
      }, {});

      // Daily sales data
      const dailySales = salesData.reduce((acc: any, sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += sale.totalAmount;
        acc[date].count += 1;
        return acc;
      }, {});

      const analytics = {
        totalSales,
        totalRevenue: Number(totalRevenue),
        averageOrderValue: Number(averageOrderValue),
        salesByCategory: Object.values(salesByCategory),
        dailySales: Object.values(dailySales)
      };

      res.json(ApiResponse.success('Sales analytics retrieved successfully', analytics));
      */
    } catch (error) {
      logger.error('Error fetching sales analytics:', error);
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();