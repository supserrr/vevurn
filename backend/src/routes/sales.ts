import { Router, Request, Response } from 'express'
import { SalesController } from '../controllers/SalesController'
import { authMiddleware } from '../middleware/auth'
import { roleMiddleware } from '../middleware/roleMiddleware'

const router = Router()

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'sales' })
})

// All routes require authentication
router.use(authMiddleware)

// Public authenticated routes (all staff can access)
router.get('/', SalesController.getSales)
router.get('/analytics', SalesController.getSalesAnalytics)
router.get('/daily-summary', SalesController.getDailySummary)
router.get('/:id', SalesController.getSaleById)
router.get('/:id/receipt', SalesController.getReceipt)

// Create sale (all authenticated users can create sales)
router.post('/', SalesController.createSale)

// Export sales (requires supervisor/manager/admin role)
router.get('/export/csv', 
  roleMiddleware(['supervisor', 'manager', 'admin']), 
  SalesController.exportSales
)

// Update sale status (requires supervisor/manager/admin role)
router.patch('/:id/status', 
  roleMiddleware(['supervisor', 'manager', 'admin']), 
  SalesController.updateSaleStatus
)

// MTN Mobile Money payment update (webhook or internal update)
router.patch('/:id/mtn-payment', 
  roleMiddleware(['supervisor', 'manager', 'admin']),
  SalesController.updateMtnPayment
)

export default router
