import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SaleStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class ReportsController {
  /**
   * Get profit report with revenue, costs, and margins
   */
  async getProfitReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo } = req.query;
      const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateTo ? new Date(dateTo as string) : new Date();

      // Get sales data for the period
      const sales = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true,
                  retailPrice: true
                }
              }
            }
          },
          payments: true
        }
      });

      // Calculate totals
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      
      // Calculate costs based on cost prices
      const totalCosts = sales.reduce((sum, sale) => {
        const itemCosts = sale.items.reduce((itemSum, item) => {
          const costPrice = Number(item.unitCost || item.product.costPrice || 0);
          return itemSum + (costPrice * item.quantity);
        }, 0);
        return sum + itemCosts;
      }, 0);

      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Get previous period for growth calculation
      const prevStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const prevSales = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: prevStartDate,
            lte: startDate
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          }
        }
      });

      const prevRevenue = prevSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const prevCosts = prevSales.reduce((sum, sale) => {
        const itemCosts = sale.items.reduce((itemSum, item) => {
          const costPrice = Number(item.unitCost || item.product.costPrice || 0);
          return itemSum + (costPrice * item.quantity);
        }, 0);
        return sum + itemCosts;
      }, 0);
      const prevProfit = prevRevenue - prevCosts;
      const prevMargin = prevRevenue > 0 ? (prevProfit / prevRevenue) * 100 : 0;
      const marginGrowth = prevMargin > 0 ? ((profitMargin - prevMargin) / prevMargin) * 100 : 0;

      // Generate monthly trends (simplified for last 6 months)
      const monthlyTrends = await this.getMonthlyTrends(startDate, endDate);

      // Generate expense breakdown
      const expenseBreakdown = await this.getExpenseBreakdown(startDate, endDate, totalCosts);

      const profitReport = {
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalCosts: Math.round(totalCosts),
          netProfit: Math.round(netProfit),
          profitMargin: Math.round(profitMargin * 100) / 100,
          marginGrowth: Math.round(marginGrowth * 100) / 100
        },
        monthlyTrends,
        expenseBreakdown,
        profitTargets: [
          {
            target: 'Monthly Profit Target',
            current: Math.round(netProfit),
            goal: 4000000,
            percentage: Math.round((netProfit / 4000000) * 100),
            status: netProfit >= 4000000 ? 'exceeded' : netProfit >= 3600000 ? 'on-track' : 'behind'
          },
          {
            target: 'Profit Margin Target',
            current: Math.round(profitMargin * 100) / 100,
            goal: 25,
            percentage: Math.round((profitMargin / 25) * 100),
            status: profitMargin >= 25 ? 'exceeded' : profitMargin >= 22.5 ? 'on-track' : 'behind'
          }
        ]
      };

      res.json(ApiResponse.success('Profit report generated successfully', profitReport));
    } catch (error) {
      logger.error('Error generating profit report:', error);
      next(error);
    }
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { lowStockOnly = false } = req.query;

      const where: any = {
        deletedAt: null,
        status: 'ACTIVE'
      };

      if (lowStockOnly === 'true') {
        where.stockQuantity = {
          lte: prisma.product.fields.minStockLevel
        };
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true
        },
        orderBy: {
          stockQuantity: 'asc'
        }
      });

      const totalProducts = products.length;
      const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
      const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;
      const totalValue = products.reduce((sum, p) => sum + Number(p.retailPrice) * p.stockQuantity, 0);

      const inventoryReport = {
        summary: {
          totalProducts,
          lowStockCount,
          outOfStockCount,
          totalValue: Math.round(totalValue)
        },
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stockQuantity: product.stockQuantity,
          minStockLevel: product.minStockLevel,
          retailPrice: Number(product.retailPrice),
          stockValue: Number(product.retailPrice) * product.stockQuantity,
          category: product.category?.name,
          supplier: product.supplier?.name,
          status: product.stockQuantity === 0 ? 'out-of-stock' :
                 product.stockQuantity <= product.minStockLevel ? 'low-stock' : 'in-stock'
        }))
      };

      res.json(ApiResponse.success('Inventory report generated successfully', inventoryReport));
    } catch (error) {
      logger.error('Error generating inventory report:', error);
      next(error);
    }
  }

  /**
   * Get sales report
   */
  async getSalesReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo, groupBy = 'day' } = req.query;
      const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateTo ? new Date(dateTo as string) : new Date();

      const sales = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          cashier: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Group sales by date
      const salesByDate = sales.reduce((acc, sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            salesCount: 0,
            revenue: 0
          };
        }
        acc[date].salesCount++;
        acc[date].revenue += Number(sale.totalAmount);
        return acc;
      }, {} as Record<string, { date: string; salesCount: number; revenue: number }>);

      // Top selling products
      const productSales = sales.flatMap(sale => sale.items).reduce((acc, item) => {
        const productName = item.product.name;
        if (!acc[productName]) {
          acc[productName] = {
            name: productName,
            quantitySold: 0,
            revenue: 0
          };
        }
        acc[productName].quantitySold += item.quantity;
        acc[productName].revenue += Number(item.totalPrice);
        return acc;
      }, {} as Record<string, { name: string; quantitySold: number; revenue: number }>);

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10);

      const salesReport = {
        summary: {
          totalSales,
          totalRevenue: Math.round(totalRevenue),
          averageSaleValue: Math.round(averageSaleValue),
          period: {
            from: startDate.toISOString(),
            to: endDate.toISOString()
          }
        },
        salesByDate: Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date)),
        topProducts,
        recentSales: sales.slice(0, 20).map(sale => ({
          id: sale.id,
          saleNumber: sale.saleNumber,
          totalAmount: Number(sale.totalAmount),
          itemCount: sale.items.length,
          cashier: sale.cashier.name,
          createdAt: sale.createdAt
        }))
      };

      res.json(ApiResponse.success('Sales report generated successfully', salesReport));
    } catch (error) {
      logger.error('Error generating sales report:', error);
      next(error);
    }
  }

  /**
   * Private method to get monthly trends
   */
  private async getMonthlyTrends(startDate: Date, endDate: Date) {
    // Get last 6 months of data
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthSales = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          }
        }
      });

      const revenue = monthSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const cost = monthSales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
          const costPrice = Number(item.unitCost || item.product.costPrice || 0);
          return itemSum + (costPrice * item.quantity);
        }, 0);
      }, 0);
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(revenue),
        cost: Math.round(cost),
        profit: Math.round(profit),
        margin: Math.round(margin * 100) / 100
      });
    }

    return months;
  }

  /**
   * Private method to get expense breakdown
   */
  private async getExpenseBreakdown(startDate: Date, endDate: Date, totalCosts: number) {
    // Simplified expense breakdown - in a real app, you'd have more detailed expense tracking
    return [
      {
        category: 'Cost of Goods Sold',
        amount: Math.round(totalCosts * 0.85),
        percentage: 85.0,
        change: 12.5
      },
      {
        category: 'Operating Expenses',
        amount: Math.round(totalCosts * 0.10),
        percentage: 10.0,
        change: -2.3
      },
      {
        category: 'Administrative Costs',
        amount: Math.round(totalCosts * 0.05),
        percentage: 5.0,
        change: 8.1
      }
    ];
  }
}
