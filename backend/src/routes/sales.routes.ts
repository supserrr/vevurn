import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { invoicesController } from '../controllers/invoices.controller';
import { authMiddleware } from '../middlewares';
import { validateRequest } from '../middlewares/validation.middleware';
import { createSaleSchema, updateSaleSchema, voidSaleSchema } from '../validators/sales.schemas';
import { convertSaleToInvoiceSchema } from '../validators/invoices.schemas';

const router: Router = Router();
const salesController = new SalesController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/sales - List sales with filters
router.get('/', (req, res, next) => salesController.getAllSales(req, res, next));

// GET /api/sales/:id - Get sale details
router.get('/:id', (req, res, next) => salesController.getSaleById(req, res, next));

// POST /api/sales - Create new sale
router.post('/', 
  validateRequest({ body: createSaleSchema }), 
  (req, res, next) => salesController.createSale(req, res, next)
);

// PUT /api/sales/:id/complete - Complete a sale
router.put('/:id/complete', (req, res, next) => salesController.completeSale(req, res, next));

// GET /api/sales/stats/daily - Daily sales statistics
router.get('/stats/daily', (req, res, next) => salesController.getDailyStats(req, res, next));

// PUT /api/sales/:id - Update sale
router.put('/:id', 
  validateRequest({ body: updateSaleSchema }), 
  (req, res, next) => salesController.updateSale(req, res, next)
);

// PUT /api/sales/:id/void - Void a sale
router.put('/:id/void', 
  validateRequest({ body: voidSaleSchema }), 
  (req, res, next) => salesController.voidSale(req, res, next)
);

// GET /api/sales/:id/receipt - Get receipt data
router.get('/:id/receipt', (req, res, next) => salesController.getReceipt(req, res, next));

// POST /api/sales/:id/convert-to-invoice - Convert sale to invoice
router.post('/:id/convert-to-invoice',
  validateRequest({ body: convertSaleToInvoiceSchema }),
  (req, res, next) => invoicesController.convertSaleToInvoice(req, res, next)
);

export default router;
