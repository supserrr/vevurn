import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { demoDataController } from '../controllers/demo-data.controller';
import { authMiddleware } from '../middlewares';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  createCustomerSchema, 
  updateCustomerSchema, 
  customerFilterSchema 
} from '../validators/customers.schemas';

const router: Router = Router();
const customersController = new CustomersController();

// Apply auth middleware to all routes (disabled for demo)
// router.use(authMiddleware);

// GET /api/customers/search?q=query (must be before /:id route)
router.get('/search', (req, res, next) => customersController.searchCustomers(req, res, next));

// GET /api/customers/top?limit=10
router.get('/top', (req, res, next) => customersController.getTopCustomers(req, res, next));

// GET /api/customers - List customers with demo fallback
router.get('/', 
  (req, res, next) => demoDataController.getCustomers(req, res, next)
);

// GET /api/customers/:id - Get customer details
router.get('/:id', (req, res, next) => customersController.getCustomerById(req, res, next));

// POST /api/customers - Create new customer
router.post('/', 
  validateRequest({ body: createCustomerSchema }), 
  (req, res, next) => customersController.createCustomer(req, res, next)
);

// PUT /api/customers/:id - Update customer
router.put('/:id', 
  validateRequest({ body: updateCustomerSchema }), 
  (req, res, next) => customersController.updateCustomer(req, res, next)
);

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete('/:id', (req, res, next) => customersController.deleteCustomer(req, res, next));

// GET /api/customers/:id/stats - Get customer statistics
router.get('/:id/stats', (req, res, next) => customersController.getCustomerStats(req, res, next));

// PUT /api/customers/:id/metrics - Update customer metrics
router.put('/:id/metrics', (req, res, next) => customersController.updateCustomerMetrics(req, res, next));

// PUT /api/customers/:id/activate - Activate customer
router.put('/:id/activate', (req, res, next) => customersController.activateCustomer(req, res, next));

// PUT /api/customers/:id/deactivate - Deactivate customer
router.put('/:id/deactivate', (req, res, next) => customersController.deactivateCustomer(req, res, next));

export default router;
