import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Get date ranges
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch sales data
      const [todaySales, weekSales, monthSales, productCount, lowStockCount] = await Promise.all([
        this.getSalesForPeriod(todayStart, today),
        this.getSalesForPeriod(weekStart, today),
        this.getSalesForPeriod(monthStart, today),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ 
          where: { 
            status: 'ACTIVE',
            stockQuantity: { lte: 10 } // Using a fixed threshold for low stock
          }
        })
      ]);

      const totalValue = await prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _sum: {
          stockQuantity: true
        }
      });

      res.json({
        todaysSales: todaySales,
        weekSales: weekSales,
        monthSales: monthSales,
        inventory: {
          totalProducts: productCount,
          lowStock: lowStockCount,
          totalValue: (totalValue._sum?.stockQuantity || 0)
        }
      });
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  private async getSalesForPeriod(startDate: Date, endDate: Date) {
    const sales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    return {
      amount: sales._sum.totalAmount || 0,
      count: sales._count.id || 0,
      change: 0 // TODO: Calculate actual change percentage
    };
  }

  async getRecentTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const transactions = await prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: true,
          payments: true
        }
      });

      const formatted = transactions.map(sale => ({
        id: sale.id,
        timestamp: sale.createdAt.toISOString(),
        amount: sale.totalAmount,
        paymentMethod: sale.payments.length > 0 ? sale.payments[0].method : 'CASH',
        status: sale.status.toLowerCase(),
        customerName: sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim() : undefined,
        itemCount: sale.items.length
      }));

      res.json(formatted);
    } catch (error) {
      logger.error('Recent transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
  }

  async getLowStock(req: AuthenticatedRequest, res: Response) {
    try {
      const lowStockProducts = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          stockQuantity: { lte: 10 } // Using fixed threshold for low stock
        },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          minStockLevel: true,
          sku: true
        },
        take: 20
      });

      res.json(lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        currentStock: product.stockQuantity,
        minStock: product.minStockLevel,
        sku: product.sku
      })));
    } catch (error) {
      logger.error('Low stock error:', error);
      res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
  }

  async getPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const paymentMethods = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          },
          status: 'COMPLETED'
        },
        _count: { id: true },
        _sum: { amount: true }
      });

      const formatted = paymentMethods.map(method => ({
        method: method.method,
        count: method._count?.id || 0,
        amount: method._sum?.amount || 0,
        status: 'active' as const
      }));

      res.json(formatted);
    } catch (error) {
      logger.error('Payment status error:', error);
      res.status(500).json({ error: 'Failed to fetch payment status' });
    }
  }
}
