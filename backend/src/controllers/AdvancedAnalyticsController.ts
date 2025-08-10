// backend/src/controllers/AdvancedAnalyticsController.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';
import { logger } from '../utils/logger';

const analyticsService = AdvancedAnalyticsService.getInstance();

export class AdvancedAnalyticsController {
  /**
   * Get profit margin analysis
   * GET /api/analytics/profit-margins
   */
  static async getProfitMarginAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, groupBy } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format.'
        });
        return;
      }

      if (start > end) {
        res.status(400).json({
          success: false,
          message: 'Start date cannot be later than end date'
        });
        return;
      }

      const analysis = await analyticsService.getProfitMarginAnalysis(
        start,
        end,
        groupBy as 'product' | 'category' | 'both' || 'both'
      );

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error in getProfitMarginAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate profit margin analysis',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get customer lifetime value analysis
   * GET /api/analytics/customer-ltv
   */
  static async getCustomerLifetimeValue(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, segment } = req.query;

      const ltvAnalysis = await analyticsService.getCustomerLifetimeValue(
        customerId as string,
        segment as 'all' | 'vip' | 'at-risk'
      );

      res.json({
        success: true,
        data: ltvAnalysis
      });
    } catch (error) {
      logger.error('Error in getCustomerLifetimeValue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate customer lifetime value',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get inventory aging report
   * GET /api/analytics/inventory-aging
   */
  static async getInventoryAgingReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await analyticsService.getInventoryAgingReport();

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error in getInventoryAgingReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate inventory aging report',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get analytics dashboard summary
   * GET /api/analytics/dashboard
   */
  static async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Get profit margins for last 30 days
      const profitAnalysis = await analyticsService.getProfitMarginAnalysis(
        thirtyDaysAgo,
        today,
        'both'
      );

      // Get top 10 customers by LTV
      const topCustomers = (await analyticsService.getCustomerLifetimeValue())
        .slice(0, 10);

      // Get at-risk customers
      const atRiskCustomers = await analyticsService.getCustomerLifetimeValue(
        undefined,
        'at-risk'
      );

      // Get inventory aging
      const inventoryAging = await analyticsService.getInventoryAgingReport();

      const dashboardData = {
        profitMargins: {
          totalProfit: profitAnalysis.overall.profit,
          marginPercentage: profitAnalysis.overall.marginPercentage,
          isImproving: profitAnalysis.trends.isImproving,
          changePercentage: profitAnalysis.trends.changePercentage
        },
        topCustomers: topCustomers.map(c => ({
          name: c.customerName,
          predictedLTV: c.metrics.predictedLTV,
          totalSpent: c.metrics.totalSpent,
          segment: c.metrics.segment
        })),
        atRiskCustomers: {
          count: atRiskCustomers.length,
          totalValue: atRiskCustomers.reduce((sum, c) => sum + c.metrics.totalSpent, 0)
        },
        inventory: {
          totalValue: inventoryAging.summary.totalInventoryValue,
          deadStockValue: inventoryAging.agingBrackets.over180days.value,
          deadStockItems: inventoryAging.summary.totalDeadStock,
          writeOffRecommended: inventoryAging.summary.writeOffRecommended
        },
        kpis: {
          avgOrderValue: topCustomers.length > 0 ? 
            topCustomers.reduce((sum, c) => sum + c.metrics.averageOrderValue, 0) / topCustomers.length : 0,
          customerRetentionRate: topCustomers.filter(c => c.metrics.segment === 'loyal' || c.metrics.segment === 'vip').length / Math.max(topCustomers.length, 1) * 100,
          inventoryTurnover: inventoryAging.slowMoving.length > 0 ?
            inventoryAging.slowMoving.reduce((sum, item) => sum + item.turnoverRate, 0) / inventoryAging.slowMoving.length : 0
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error in getDashboardSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate dashboard summary',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}

export default AdvancedAnalyticsController;
