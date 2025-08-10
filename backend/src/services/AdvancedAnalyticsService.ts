// backend/src/services/AdvancedAnalyticsService.ts

import { PrismaClient } from '@prisma/client';
import { RedisService } from './RedisService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const redis = new RedisService();

// Date utility functions
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (format === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  if (format === 'yyyy-MM') {
    return `${year}-${month}`;
  }
  return date.toISOString();
};

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const differenceInDays = (laterDate: Date, earlierDate: Date): number => {
  const diffTime = Math.abs(laterDate.getTime() - earlierDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

interface ProfitMarginAnalysis {
  overall: {
    revenue: number;
    cost: number;
    profit: number;
    marginPercentage: number;
  };
  byProduct: Array<{
    productId: string;
    productName: string;
    revenue: number;
    cost: number;
    profit: number;
    marginPercentage: number;
    unitsSold: number;
  }>;
  byCategory: Array<{
    category: string;
    revenue: number;
    cost: number;
    profit: number;
    marginPercentage: number;
  }>;
  byTimeRange: {
    daily: Array<{ date: string; profit: number; margin: number }>;
    monthly: Array<{ month: string; profit: number; margin: number }>;
  };
  trends: {
    isImproving: boolean;
    changePercentage: number;
    forecast: number;
  };
}

interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  metrics: {
    totalPurchases: number;
    totalSpent: number;
    averageOrderValue: number;
    purchaseFrequency: number;
    customerLifespan: number; // in days
    predictedLTV: number;
    churnRisk: 'low' | 'medium' | 'high';
    segment: 'vip' | 'loyal' | 'regular' | 'at-risk' | 'new';
  };
  history: {
    firstPurchase: Date;
    lastPurchase: Date;
    totalTransactions: number;
    favoriteCategories: string[];
    preferredPaymentMethod: string;
  };
}

interface InventoryAgingReport {
  summary: {
    totalInventoryValue: number;
    totalAgedItems: number;
    totalDeadStock: number;
    writeOffRecommended: number;
  };
  agingBrackets: {
    current: { items: number; value: number; percentage: number };
    '30-60days': { items: number; value: number; percentage: number };
    '60-90days': { items: number; value: number; percentage: number };
    '90-180days': { items: number; value: number; percentage: number };
    over180days: { items: number; value: number; percentage: number };
  };
  deadStock: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    value: number;
    lastMovementDate: Date;
    daysInStock: number;
    recommendedAction: 'discount' | 'writeoff' | 'return' | 'donate';
  }>;
  slowMoving: Array<{
    productId: string;
    productName: string;
    turnoverRate: number;
    currentStock: number;
    averageDailySales: number;
    daysOfSupply: number;
  }>;
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;

  static getInstance(): AdvancedAnalyticsService {
    if (!this.instance) {
      this.instance = new AdvancedAnalyticsService();
    }
    return this.instance;
  }

  /**
   * Calculate comprehensive profit margin analysis
   */
  async getProfitMarginAnalysis(
    startDate: Date,
    endDate: Date,
    groupBy: 'product' | 'category' | 'both' = 'both'
  ): Promise<ProfitMarginAnalysis> {
    try {
      // Try to get from cache first
      const cacheKey = `profit_margin:${startDate.toISOString()}:${endDate.toISOString()}:${groupBy}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get all sales within date range
      const sales = await prisma.sale.findMany({
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

      // Calculate overall profit margins
      let totalRevenue = 0;
      let totalCost = 0;
      const productMetrics = new Map();
      const categoryMetrics = new Map();
      const dailyMetrics = new Map();

      for (const sale of sales) {
        for (const item of sale.items) {
          const revenue = item.quantity * item.unitPrice;
          const cost = item.quantity * (item.product.costPrice || 0);
          const profit = revenue - cost;

          totalRevenue += revenue;
          totalCost += cost;

          // Aggregate by product
          const productKey = item.productId;
          if (!productMetrics.has(productKey)) {
            productMetrics.set(productKey, {
              productId: item.productId,
              productName: item.product.name,
              revenue: 0,
              cost: 0,
              unitsSold: 0
            });
          }
          const pm = productMetrics.get(productKey);
          pm.revenue += revenue;
          pm.cost += cost;
          pm.unitsSold += item.quantity;

          // Aggregate by category
          const categoryKey = item.product.categoryId || 'uncategorized';
          if (!categoryMetrics.has(categoryKey)) {
            categoryMetrics.set(categoryKey, {
              category: item.product.category?.name || 'Uncategorized',
              revenue: 0,
              cost: 0
            });
          }
          const cm = categoryMetrics.get(categoryKey);
          cm.revenue += revenue;
          cm.cost += cost;

          // Daily aggregation
          const dateKey = formatDate(sale.createdAt, 'yyyy-MM-dd');
          if (!dailyMetrics.has(dateKey)) {
            dailyMetrics.set(dateKey, { revenue: 0, cost: 0 });
          }
          const dm = dailyMetrics.get(dateKey);
          dm.revenue += revenue;
          dm.cost += cost;
        }
      }

      // Calculate profit and margins
      const overall = {
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalRevenue - totalCost,
        marginPercentage: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
      };

      // Process product metrics
      const byProduct = Array.from(productMetrics.values()).map(pm => ({
        ...pm,
        profit: pm.revenue - pm.cost,
        marginPercentage: pm.revenue > 0 ? ((pm.revenue - pm.cost) / pm.revenue) * 100 : 0
      })).sort((a, b) => b.profit - a.profit);

      // Process category metrics
      const byCategory = Array.from(categoryMetrics.values()).map(cm => ({
        ...cm,
        profit: cm.revenue - cm.cost,
        marginPercentage: cm.revenue > 0 ? ((cm.revenue - cm.cost) / cm.revenue) * 100 : 0
      })).sort((a, b) => b.profit - a.profit);

      // Process daily metrics
      const daily = Array.from(dailyMetrics.entries()).map(([date, metrics]) => ({
        date,
        profit: metrics.revenue - metrics.cost,
        margin: metrics.revenue > 0 ? ((metrics.revenue - metrics.cost) / metrics.revenue) * 100 : 0
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Monthly aggregation
      const monthlyMap = new Map();
      daily.forEach(d => {
        const month = d.date.substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { profit: 0, revenue: 0, cost: 0 });
        }
        const mm = monthlyMap.get(month);
        mm.profit += d.profit;
        mm.revenue += dailyMetrics.get(d.date).revenue;
        mm.cost += dailyMetrics.get(d.date).cost;
      });

      const monthly = Array.from(monthlyMap.entries()).map(([month, metrics]) => ({
        month,
        profit: metrics.profit,
        margin: metrics.revenue > 0 ? ((metrics.revenue - metrics.cost) / metrics.revenue) * 100 : 0
      }));

      // Calculate trends
      const previousPeriodDays = differenceInDays(endDate, startDate);
      const previousStartDate = subDays(startDate, previousPeriodDays);
      const previousEndDate = subDays(endDate, previousPeriodDays);

      const previousSales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: previousStartDate,
            lte: previousEndDate
          },
          status: 'COMPLETED'
        },
        include: {
          items: true
        }
      });

      let previousRevenue = 0;
      let previousCost = 0;
      previousSales.forEach(sale => {
        sale.items.forEach(item => {
          previousRevenue += item.quantity * item.unitPrice;
        });
      });

      const previousProfit = previousRevenue - previousCost;
      const currentProfit = overall.profit;
      const changePercentage = previousProfit > 0 ? 
        ((currentProfit - previousProfit) / previousProfit) * 100 : 0;

      // Simple linear forecast (could be enhanced with ML)
      const forecast = currentProfit * (1 + changePercentage / 100);

      const result: ProfitMarginAnalysis = {
        overall,
        byProduct: groupBy === 'category' ? [] : byProduct,
        byCategory: groupBy === 'product' ? [] : byCategory,
        byTimeRange: {
          daily,
          monthly
        },
        trends: {
          isImproving: changePercentage > 0,
          changePercentage,
          forecast
        }
      };

      // Cache for 1 hour
      await redis.set(cacheKey, JSON.stringify(result), { ttl: 3600 });
      
      return result;
    } catch (error) {
      logger.error('Error calculating profit margins:', error);
      throw error;
    }
  }

  /**
   * Calculate Customer Lifetime Value (CLV/LTV)
   */
  async getCustomerLifetimeValue(
    customerId?: string,
    segment?: 'all' | 'vip' | 'at-risk'
  ): Promise<CustomerLifetimeValue[]> {
    try {
      const whereClause: any = {};
      if (customerId) {
        whereClause.id = customerId;
      }

      const customers = await prisma.customer.findMany({
        where: whereClause,
        include: {
          sales: {
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
          },
          loans: true
        }
      });

      const results: CustomerLifetimeValue[] = [];

      for (const customer of customers) {
        if (customer.sales.length === 0) continue;

        // Calculate metrics
        const totalSpent = customer.sales.reduce((sum, sale) => 
          sum + (sale.status === 'COMPLETED' ? sale.totalAmount : 0), 0
        );
        
        const completedSales = customer.sales.filter(s => s.status === 'COMPLETED');
        const totalPurchases = completedSales.length;
        const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

        const firstPurchase = customer.sales[customer.sales.length - 1].createdAt;
        const lastPurchase = customer.sales[0].createdAt;
        const customerLifespan = differenceInDays(lastPurchase, firstPurchase) || 1;
        
        // Calculate purchase frequency (purchases per month)
        const monthsActive = Math.max(customerLifespan / 30, 1);
        const purchaseFrequency = totalPurchases / monthsActive;

        // Predict LTV using simple formula: AOV * Purchase Frequency * Customer Lifespan
        // This could be enhanced with cohort analysis and retention rates
        const expectedLifespan = 24; // 24 months average customer lifespan
        const predictedLTV = averageOrderValue * purchaseFrequency * expectedLifespan;

        // Determine churn risk based on recency
        const daysSinceLastPurchase = differenceInDays(new Date(), lastPurchase);
        let churnRisk: 'low' | 'medium' | 'high' = 'low';
        if (daysSinceLastPurchase > 90) churnRisk = 'high';
        else if (daysSinceLastPurchase > 45) churnRisk = 'medium';

        // Segment customers
        let customerSegment: 'vip' | 'loyal' | 'regular' | 'at-risk' | 'new' = 'regular';
        if (totalSpent > 1000000 && purchaseFrequency > 2) customerSegment = 'vip';
        else if (totalPurchases > 10 && churnRisk === 'low') customerSegment = 'loyal';
        else if (churnRisk === 'high') customerSegment = 'at-risk';
        else if (totalPurchases <= 2) customerSegment = 'new';

        // Calculate favorite categories
        const categoryCount = new Map<string, number>();
        completedSales.forEach(sale => {
          sale.items.forEach(item => {
            const category = item.product.category?.name || 'Uncategorized';
            categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
          });
        });
        const favoriteCategories = Array.from(categoryCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category]) => category);

        // Preferred payment method
        const paymentMethods = completedSales.map(s => s.paymentMethod);
        const preferredPaymentMethod = this.getMostFrequent(paymentMethods) as string || 'CASH';

        const ltv: CustomerLifetimeValue = {
          customerId: customer.id,
          customerName: customer.name,
          email: customer.email || '',
          phone: customer.phone,
          metrics: {
            totalPurchases,
            totalSpent,
            averageOrderValue,
            purchaseFrequency,
            customerLifespan,
            predictedLTV,
            churnRisk,
            segment: customerSegment
          },
          history: {
            firstPurchase,
            lastPurchase,
            totalTransactions: customer.sales.length,
            favoriteCategories,
            preferredPaymentMethod
          }
        };

        // Filter by segment if specified
        if (!segment || segment === 'all' || 
            (segment === 'vip' && customerSegment === 'vip') ||
            (segment === 'at-risk' && customerSegment === 'at-risk')) {
          results.push(ltv);
        }
      }

      return results.sort((a, b) => b.metrics.predictedLTV - a.metrics.predictedLTV);
    } catch (error) {
      logger.error('Error calculating customer lifetime value:', error);
      throw error;
    }
  }

  /**
   * Generate inventory aging report
   */
  async getInventoryAgingReport(): Promise<InventoryAgingReport> {
    try {
      const cacheKey = 'inventory_aging_report';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get all products with stock
      const products = await prisma.product.findMany({
        where: {
          stockQuantity: { gt: 0 }
        },
        include: {
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          saleItems: {
            where: {
              sale: {
                status: 'COMPLETED',
                createdAt: {
                  gte: subDays(new Date(), 180)
                }
              }
            },
            include: {
              sale: true
            }
          }
        }
      });

      const now = new Date();
      const agingBrackets = {
        current: { items: 0, value: 0, percentage: 0 },
        '30-60days': { items: 0, value: 0, percentage: 0 },
        '60-90days': { items: 0, value: 0, percentage: 0 },
        '90-180days': { items: 0, value: 0, percentage: 0 },
        over180days: { items: 0, value: 0, percentage: 0 }
      };

      const deadStock: any[] = [];
      const slowMoving: any[] = [];
      let totalInventoryValue = 0;
      let totalAgedItems = 0;
      let totalDeadStock = 0;

      for (const product of products) {
        const lastMovement = product.stockMovements[0];
        const lastMovementDate = lastMovement ? lastMovement.createdAt : product.createdAt;
        const daysInStock = differenceInDays(now, lastMovementDate);
        const inventoryValue = product.stockQuantity * (product.costPrice || 0);
        
        totalInventoryValue += inventoryValue;

        // Categorize by age
        if (daysInStock <= 30) {
          agingBrackets.current.items++;
          agingBrackets.current.value += inventoryValue;
        } else if (daysInStock <= 60) {
          agingBrackets['30-60days'].items++;
          agingBrackets['30-60days'].value += inventoryValue;
          totalAgedItems++;
        } else if (daysInStock <= 90) {
          agingBrackets['60-90days'].items++;
          agingBrackets['60-90days'].value += inventoryValue;
          totalAgedItems++;
        } else if (daysInStock <= 180) {
          agingBrackets['90-180days'].items++;
          agingBrackets['90-180days'].value += inventoryValue;
          totalAgedItems++;
        } else {
          agingBrackets.over180days.items++;
          agingBrackets.over180days.value += inventoryValue;
          totalAgedItems++;
          totalDeadStock++;
        }

        // Identify dead stock (no movement in 180+ days)
        if (daysInStock > 180) {
          let recommendedAction: 'discount' | 'writeoff' | 'return' | 'donate' = 'discount';
          if (daysInStock > 365) recommendedAction = 'writeoff';
          else if (product.supplierId) recommendedAction = 'return';
          
          deadStock.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: product.stockQuantity,
            value: inventoryValue,
            lastMovementDate,
            daysInStock,
            recommendedAction
          });
        }

        // Calculate turnover rate for slow-moving analysis
        const salesInPeriod = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
        const daysInPeriod = 180;
        const averageDailySales = salesInPeriod / daysInPeriod;
        const turnoverRate = averageDailySales > 0 ? 
          (salesInPeriod / product.stockQuantity) * (365 / daysInPeriod) : 0;
        const daysOfSupply = averageDailySales > 0 ? 
          product.stockQuantity / averageDailySales : 999;

        // Identify slow-moving (turnover rate < 4 times per year)
        if (turnoverRate < 4 && turnoverRate > 0) {
          slowMoving.push({
            productId: product.id,
            productName: product.name,
            turnoverRate,
            currentStock: product.stockQuantity,
            averageDailySales,
            daysOfSupply
          });
        }
      }

      // Calculate percentages
      Object.keys(agingBrackets).forEach(key => {
        const bracket = agingBrackets[key as keyof typeof agingBrackets];
        bracket.percentage = totalInventoryValue > 0 ? 
          (bracket.value / totalInventoryValue) * 100 : 0;
      });

      const result: InventoryAgingReport = {
        summary: {
          totalInventoryValue,
          totalAgedItems,
          totalDeadStock,
          writeOffRecommended: deadStock
            .filter(d => d.recommendedAction === 'writeoff')
            .reduce((sum, d) => sum + d.value, 0)
        },
        agingBrackets,
        deadStock: deadStock.sort((a, b) => b.daysInStock - a.daysInStock),
        slowMoving: slowMoving.sort((a, b) => a.turnoverRate - b.turnoverRate)
      };

      // Cache for 6 hours
      await redis.set(cacheKey, JSON.stringify(result), { ttl: 21600 });

      return result;
    } catch (error) {
      logger.error('Error generating inventory aging report:', error);
      throw error;
    }
  }

  private getMostFrequent<T>(arr: T[]): T | undefined {
    const frequency = new Map<T, number>();
    let maxFreq = 0;
    let mostFrequent: T | undefined;

    for (const item of arr) {
      const freq = (frequency.get(item) || 0) + 1;
      frequency.set(item, freq);
      if (freq > maxFreq) {
        maxFreq = freq;
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }
}

export default AdvancedAnalyticsService;
