import { Router } from 'express'
import { ReportsController } from '../controllers/ReportsController'
import { authMiddleware } from '../middleware/auth'
import { roleMiddleware } from '../middleware/roleMiddleware'

const router = Router()

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'reports' })
})

// All routes require authentication and supervisor+ role
router.use(authMiddleware)
router.use(roleMiddleware(['supervisor', 'manager', 'admin']))

// Dashboard summary (lighter permissions)
router.get('/dashboard', ReportsController.getDashboardSummary)

// Detailed reports
router.get('/sales', ReportsController.getSalesReport)
router.get('/inventory', ReportsController.getInventoryReport)
router.get('/staff', 
  roleMiddleware(['manager', 'admin']), 
  ReportsController.getStaffReport
)
router.get('/financial', 
  roleMiddleware(['manager', 'admin']), 
  ReportsController.getFinancialSummary
)

// Export reports
router.get('/export', 
  roleMiddleware(['manager', 'admin']), 
  ReportsController.exportReportCSV
)

// Custom reports
router.post('/custom', 
  roleMiddleware(['manager', 'admin']), 
  ReportsController.getCustomReport
)

// Cache management
router.delete('/cache', 
  roleMiddleware(['admin']), 
  ReportsController.clearReportCache
)

export default router
