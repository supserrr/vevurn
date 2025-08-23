import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware } from '../middlewares';

const router: Router = Router();
const reportsController = new ReportsController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/reports/profit - Profit and loss report
router.get('/profit', (req, res, next) => reportsController.getProfitReport(req, res, next));

// GET /api/reports/inventory - Inventory report
router.get('/inventory', (req, res, next) => reportsController.getInventoryReport(req, res, next));

// GET /api/reports/sales - Sales report
router.get('/sales', (req, res, next) => reportsController.getSalesReport(req, res, next));

export default router;
