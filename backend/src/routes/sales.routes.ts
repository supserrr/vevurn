import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { invoicesController } from '../controllers/invoices.controller';
import { requireAuth, requireManagerOrAdmin } from '../middleware/better-auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createSaleSchema, updateSaleSchema, voidSaleSchema } from '../validators/sales.schemas';
import { convertSaleToInvoiceSchema } from '../validators/invoices.schemas';

const router: Router = Router();
const salesController = new SalesController();

// Sales CRUD - All authenticated users can view, cashiers can create sales
router.get('/', requireAuth, (req, res, next) => salesController.getAllSales(req, res, next));

router.get('/:id', requireAuth, (req, res, next) => salesController.getSaleById(req, res, next));

// POST /api/sales - Process sale (all authenticated users)
router.post('/', 
  requireAuth,
  validateRequest({ body: createSaleSchema }), 
  (req, res, next) => salesController.createSale(req, res, next)
);

// PUT /api/sales/:id/complete - Complete a sale
router.put('/:id/complete', requireAuth, (req, res, next) => salesController.completeSale(req, res, next));

// GET /api/sales/stats/daily - Daily sales statistics (managers only)
router.get('/stats/daily', requireManagerOrAdmin, (req, res, next) => salesController.getDailyStats(req, res, next));

// PUT /api/sales/:id - Update sale (managers only)
router.put('/:id', 
  requireManagerOrAdmin,
  validateRequest({ body: updateSaleSchema }), 
  (req, res, next) => salesController.updateSale(req, res, next)
);

// PUT /api/sales/:id/void - Void a sale (managers only)
router.put('/:id/void', 
  requireManagerOrAdmin,
  validateRequest({ body: voidSaleSchema }), 
  (req, res, next) => salesController.voidSale(req, res, next)
);

// GET /api/sales/:id/receipt - Get receipt data
router.get('/:id/receipt', requireAuth, (req, res, next) => salesController.getReceipt(req, res, next));

// POST /api/sales/:id/convert-to-invoice - Convert sale to invoice (managers only)
router.post('/:id/convert-to-invoice',
  requireManagerOrAdmin,
  validateRequest({ body: convertSaleToInvoiceSchema }),
  (req, res, next) => invoicesController.convertSaleToInvoice(req, res, next)
);

export default router;
