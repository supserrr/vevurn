import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware, requireRole } from '../middleware/better-auth.middleware';
import { handleValidationErrors } from '../middlewares/express-validator.middleware';
import { body, query, param } from 'express-validator';

const router: Router = Router();
const inventoryController = new InventoryController();

// Protect all routes
router.use(authMiddleware);

/**
 * @route GET /api/inventory/summary
 * @desc Get inventory summary statistics
 * @access Private (All roles)
 */
router.get('/summary', inventoryController.getInventorySummary);

/**
 * @route GET /api/inventory/alerts
 * @desc Get stock alerts (low stock and out of stock)
 * @access Private (All roles)
 */
router.get('/alerts', [
  query('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a positive integer')
], handleValidationErrors, inventoryController.getStockAlerts);

/**
 * @route GET /api/inventory/low-stock
 * @desc Get products with low stock
 * @access Private (All roles)
 */
router.get('/low-stock', [
  query('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a positive integer')
], handleValidationErrors, inventoryController.getLowStock);

/**
 * @route GET /api/inventory/movements
 * @desc Get inventory movement history
 * @access Private (All roles)
 */
router.get('/movements', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('productId').optional().isString().withMessage('Product ID must be a string'),
  query('type').optional().isIn(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'TRANSFER', 'DAMAGED', 'EXPIRED']).withMessage('Invalid movement type'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  query('sortBy').optional().isIn(['createdAt', 'quantity', 'type']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], handleValidationErrors, inventoryController.getMovementHistory);

/**
 * @route POST /api/inventory/adjust/:productId
 * @desc Adjust stock for a specific product
 * @access Private (MANAGER, ADMIN)
 */
router.post('/adjust/:productId', [
  requireRole('MANAGER', 'ADMIN'),
  param('productId').isString().notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('type').isIn(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED']).withMessage('Invalid movement type'),
  body('reason').isString().notEmpty().withMessage('Reason is required'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number')
], handleValidationErrors, inventoryController.adjustStock);

/**
 * @route POST /api/inventory/restock/:productId
 * @desc Restock a specific product
 * @access Private (MANAGER, ADMIN)
 */
router.post('/restock/:productId', [
  requireRole('MANAGER', 'ADMIN'),
  param('productId').isString().notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('supplier').optional().isString().withMessage('Supplier must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], handleValidationErrors, inventoryController.restockProduct);

/**
 * @route POST /api/inventory/transfer
 * @desc Transfer stock between locations (future feature)
 * @access Private (MANAGER, ADMIN)
 */
router.post('/transfer', [
  requireRole('MANAGER', 'ADMIN'),
  body('fromLocationId').isString().notEmpty().withMessage('From location ID is required'),
  body('toLocationId').isString().notEmpty().withMessage('To location ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.productId').isString().notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer for each item')
], handleValidationErrors, inventoryController.transferStock);

export { router as inventoryRoutes };
