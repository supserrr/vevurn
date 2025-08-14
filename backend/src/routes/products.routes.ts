import { Router } from 'express';
import { ProductController } from '../controllers/products.controller';

const router: Router = Router();
const productController = new ProductController();

// Product CRUD - basic routes without middleware for now
router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));
router.post('/', (req, res, next) => productController.createProduct(req, res, next));
router.put('/:id', (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/:id', (req, res, next) => productController.deleteProduct(req, res, next));

// Product variations
router.get('/:id/variations', (req, res, next) => productController.getProductVariations(req, res, next));
router.post('/:id/variations', (req, res, next) => productController.createProductVariation(req, res, next));
router.put('/:productId/variations/:variationId', (req, res, next) => productController.updateProductVariation(req, res, next));
router.delete('/:productId/variations/:variationId', (req, res, next) => productController.deleteProductVariation(req, res, next));

// Stock management
router.put('/:id/stock', (req, res, next) => productController.updateStock(req, res, next));
router.get('/reports/low-stock', (req, res, next) => productController.getLowStockProducts(req, res, next));
router.post('/:id/restock', (req, res, next) => productController.restockProduct(req, res, next));
router.get('/:id/stock-history', (req, res, next) => productController.getStockHistory(req, res, next));

// Image management
router.post('/:id/images', (req, res, next) => productController.uploadProductImages(req, res, next));
router.delete('/:productId/images/:imageId', (req, res, next) => productController.deleteProductImage(req, res, next));

export default router;
