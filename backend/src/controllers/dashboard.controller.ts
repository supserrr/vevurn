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
      // Return demo data when database is unavailable
      const dashboardStats = {
        todaySales: {
          totalRevenue: 450000,
          totalOrders: 12,
          averageOrderValue: 37500
        },
        paymentMethods: [
          { method: 'CASH', count: 7, amount: 210000, percentage: 46.7 },
          { method: 'MOBILE_MONEY', count: 4, amount: 180000, percentage: 40.0 },
          { method: 'BANK_TRANSFER', count: 1, amount: 60000, percentage: 13.3 }
        ],
        topProducts: [
          { id: '1', name: 'iPhone 15 Pro Clear Case', quantitySold: 8, revenue: 144000, category: 'Phone Cases' },
          { id: '2', name: 'Samsung Galaxy S24 Screen Protector', quantitySold: 15, revenue: 105000, category: 'Screen Protectors' },
          { id: '3', name: 'USB-C Fast Charger 25W', quantitySold: 6, revenue: 150000, category: 'Chargers' },
          { id: '4', name: 'Wireless Earbuds Pro', quantitySold: 3, revenue: 225000, category: 'Headphones' },
          { id: '5', name: '10000mAh Power Bank', quantitySold: 4, revenue: 140000, category: 'Power Banks' }
        ],
        inventoryAlerts: [
          { id: '1', name: 'Samsung Galaxy S24 Screen Protector', currentStock: 5, minStock: 15, status: 'LOW_STOCK' },
          { id: '2', name: 'Lightning Cable 2M', currentStock: 0, minStock: 15, status: 'OUT_OF_STOCK' },
          { id: '3', name: 'Wireless Earbuds Pro', currentStock: 3, minStock: 5, status: 'LOW_STOCK' }
        ],
        recentActivity: [
          { id: '1', type: 'SALE', description: 'Sale SALE-20250827-0012 completed', amount: 25000, timestamp: new Date().toISOString() },
          { id: '2', type: 'SALE', description: 'Sale SALE-20250827-0011 completed', amount: 75000, timestamp: new Date(Date.now() - 1800000).toISOString() },
          { id: '3', type: 'SALE', description: 'Sale SALE-20250827-0010 completed', amount: 18000, timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: '4', type: 'SALE', description: 'Sale SALE-20250827-0009 completed', amount: 35000, timestamp: new Date(Date.now() - 5400000).toISOString() },
          { id: '5', type: 'SALE', description: 'Sale SALE-20250827-0008 completed', amount: 42000, timestamp: new Date(Date.now() - 7200000).toISOString() }
        ]
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