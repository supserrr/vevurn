import { Router, Request, Response } from 'express'
import { CustomerController } from '../controllers/CustomerController'
import { authMiddleware } from '../middleware/auth'
import { roleMiddleware } from '../middleware/roleMiddleware'

const router = Router()

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'customers' })
})

// Public routes (search for POS interface)
router.get('/search', CustomerController.searchCustomers)

// All other routes require authentication
router.use(authMiddleware)

// Basic CRUD operations
router.get('/', CustomerController.getCustomers)
router.get('/analytics', 
  roleMiddleware(['supervisor', 'manager', 'admin']), 
  CustomerController.getCustomerAnalytics
)
router.get('/export', 
  roleMiddleware(['manager', 'admin']), 
  CustomerController.exportCustomers
)
router.get('/:id', CustomerController.getCustomerById)

// Create customer (all authenticated users can create customers)
router.post('/', CustomerController.createCustomer)

// Update customer (all authenticated users can update customers)
router.put('/:id', CustomerController.updateCustomer)

// Delete customer (requires manager/admin role)
router.delete('/:id', 
  roleMiddleware(['manager', 'admin']), 
  CustomerController.deleteCustomer
)

export default router
