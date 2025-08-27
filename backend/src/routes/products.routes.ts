import { Router } from 'express';
import { ProductController } from '../controllers/products.controller';
import { requireAuth, requireManagerOrAdmin } from '../middleware/better-auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createProductSchema, updateProductSchema } from '../validators/products.schemas';

const router: Router = Router();
const productController = new ProductController();

// Product CRUD - All users can view products, only managers can modify
router.get('/', requireAuth, (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => productController.getProductById(req, res, next));
router.post('/', requireManagerOrAdmin, validateRequest({ body: createProductSchema }), (req, res, next) => productController.createProduct(req, res, next));
router.put('/:id', requireManagerOrAdmin, validateRequest({ body: updateProductSchema }), (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/:id', requireManagerOrAdmin, (req, res, next) => productController.deleteProduct(req, res, next));

// Product variations
router.get('/:id/variations', requireAuth, (req, res, next) => productController.getProductVariations(req, res, next));
router.post('/:id/variations', requireManagerOrAdmin, (req, res, next) => productController.createProductVariation(req, res, next));
router.put('/:productId/variations/:variationId', requireManagerOrAdmin, (req, res, next) => productController.updateProductVariation(req, res, next));
router.delete('/:productId/variations/:variationId', requireManagerOrAdmin, (req, res, next) => productController.deleteProductVariation(req, res, next));

// Stock management - Managers only
router.put('/:id/stock', requireManagerOrAdmin, (req, res, next) => productController.updateStock(req, res, next));
// GET /api/products/search?q=query - Search products
router.get('/search', requireAuth, (req, res, next) => productController.searchProducts(req, res, next));

// GET /api/products/low-stock - Get low stock products (alternative endpoint)
router.get('/low-stock', requireAuth, (req, res, next) => productController.getLowStockProducts(req, res, next));

router.get('/reports/low-stock', requireAuth, (req, res, next) => productController.getLowStockProducts(req, res, next));
router.post('/:id/restock', requireManagerOrAdmin, (req, res, next) => productController.restockProduct(req, res, next));
router.get('/:id/stock-history', requireAuth, (req, res, next) => productController.getStockHistory(req, res, next));

// Image management - Managers only
router.post('/:id/images', requireManagerOrAdmin, (req, res, next) => productController.uploadProductImages(req, res, next));
router.delete('/:productId/images/:imageId', requireManagerOrAdmin, (req, res, next) => productController.deleteProductImage(req, res, next));

export default router;
