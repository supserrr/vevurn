import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/better-auth.middleware';

const router: Router = Router();
const dashboardController = new DashboardController();

// Protect all dashboard routes
router.use(authMiddleware);

// Dashboard statistics
router.get('/stats', dashboardController.getStats.bind(dashboardController));
router.get('/recent-transactions', dashboardController.getRecentTransactions.bind(dashboardController));
router.get('/low-stock', dashboardController.getLowStock.bind(dashboardController));
router.get('/payment-status', dashboardController.getPaymentStatus.bind(dashboardController));

export { router as dashboardRoutes };
