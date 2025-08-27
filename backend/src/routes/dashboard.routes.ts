import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/better-auth.middleware';

const router: Router = Router();
const dashboardController = new DashboardController();

// Protect all dashboard routes
router.use(authMiddleware);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats.bind(dashboardController));
router.get('/sales-analytics', dashboardController.getSalesAnalytics.bind(dashboardController));

export { router as dashboardRoutes };
