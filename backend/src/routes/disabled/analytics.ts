// backend/src/routes/analytics.ts

import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { requireBetterAuth } from '../middleware/betterAuth';
import { roleMiddleware, allStaff, managerOrAdmin } from '../middleware/roleMiddleware';

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication middleware to all analytics routes
router.use(requireBetterAuth);

/**
 * @route POST /api/analytics/dashboard
 * @description Get comprehensive dashboard analytics with key metrics
 * @query period - Time period ('7d', '30d', '90d', '1y')
 * @access Private (Admin, Manager, Staff)
 */
router.post('/dashboard', 
  allStaff,
  analyticsController.getDashboardAnalytics
);

/**
 * @route GET /api/analytics/profit-margin
 * @description Get detailed profit margin analysis
 * @query startDate - Start date (ISO string)
 * @query endDate - End date (ISO string) 
 * @query groupBy - Group by 'product', 'category', or 'both'
 * @access Private (Admin, Manager)
 */
router.get('/profit-margin',
  managerOrAdmin,
  analyticsController.getProfitMarginAnalysis
);

/**
 * @route GET /api/analytics/customer-ltv
 * @description Get customer lifetime value analysis
 * @query customerId - Optional: Get LTV for specific customer
 * @query segment - Optional: Filter by segment ('all', 'vip', 'at-risk')
 * @access Private (Admin, Manager)
 */
router.get('/customer-ltv',
  managerOrAdmin,
  analyticsController.getCustomerLifetimeValue
);

/**
 * @route GET /api/analytics/inventory-aging
 * @description Get inventory aging report
 * @access Private (Admin, Manager)
 */
router.get('/inventory-aging',
  managerOrAdmin,
  analyticsController.getInventoryAgingReport
);

/**
 * @route POST /api/analytics/export
 * @description Export analytics data in various formats
 * @body format - Export format ('csv', 'excel', 'pdf')
 * @body type - Data type to export
 * @body dateRange - Optional date range
 * @access Private (Admin, Manager)
 */
router.post('/export',
  managerOrAdmin,
  analyticsController.exportData
);

/**
 * @route POST /api/analytics/schedule
 * @description Schedule automated report generation
 * @body name - Report name
 * @body schedule - Cron expression for scheduling
 * @body exportOptions - Export configuration
 * @body recipients - Email recipients
 * @access Private (Admin, Manager)
 */
router.post('/schedule',
  managerOrAdmin,
  analyticsController.scheduleReport
);

/**
 * @route GET /api/analytics/scheduled
 * @description Get all scheduled reports
 * @access Private (Admin, Manager)
 */
router.get('/scheduled',
  managerOrAdmin,
  analyticsController.getScheduledReports
);

/**
 * @route DELETE /api/analytics/scheduled/:id
 * @description Cancel a scheduled report
 * @params id - Scheduled report ID
 * @access Private (Admin, Manager)
 */
router.delete('/scheduled/:id',
  managerOrAdmin,
  analyticsController.cancelScheduledReport
);

/**
 * @route GET /api/analytics/sales-trends
 * @description Get sales trend analysis
 * @query period - Time period ('7d', '30d', '90d', '1y')
 * @query groupBy - Group by ('day', 'week', 'month')
 * @access Private (Admin, Manager, Staff)
 */
router.get('/sales-trends',
  allStaff,
  analyticsController.getSalesTrends
);

/**
 * @route GET /api/analytics/product-performance
 * @description Get product performance analytics
 * @query limit - Number of products to return (default: 20)
 * @query sortBy - Sort by ('revenue', 'quantity', 'profit')
 * @access Private (Admin, Manager, Staff)
 */
router.get('/product-performance',
  allStaff,
  analyticsController.getProductPerformance
);

/**
 * @route GET /api/analytics/staff-performance
 * @description Get staff performance metrics
 * @query period - Time period ('7d', '30d', '90d')
 * @access Private (Admin, Manager)
 */
router.get('/staff-performance',
  managerOrAdmin,
  analyticsController.getStaffPerformance
);

export { router as analyticsRoutes };
