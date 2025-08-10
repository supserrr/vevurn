// backend/src/routes/exports.ts

import { Router } from 'express';
import { ExportController } from '../controllers/ExportController';
import { requireBetterAuth } from '../middleware/betterAuth';
import { roleMiddleware, managerOrAdmin, adminOnly } from '../middleware/roleMiddleware';

const router = Router();

// Apply authentication middleware to all export routes
router.use(requireBetterAuth);

/**
 * @route GET /api/exports/templates
 * @description Get available export templates and options
 * @access Private (All authenticated users)
 */
router.get('/templates', 
  ExportController.getExportTemplates
);

/**
 * @route POST /api/exports/generate
 * @description Generate and download a report
 * @body {format, type, dateRange?, filters?, columns?, groupBy?, includeCharts?, template?}
 * @access Private (Manager, Admin)
 */
router.post('/generate',
  managerOrAdmin,
  ExportController.generateReport
);

/**
 * @route GET /api/exports/scheduled
 * @description Get all scheduled reports
 * @access Private (Manager, Admin)
 */
router.get('/scheduled',
  managerOrAdmin,
  ExportController.getScheduledReports
);

/**
 * @route POST /api/exports/schedule
 * @description Schedule a report for automated generation
 * @body {name, schedule, exportOptions, recipients}
 * @access Private (Admin only)
 */
router.post('/schedule',
  adminOnly,
  ExportController.scheduleReport
);

/**
 * @route PUT /api/exports/scheduled/:id
 * @description Update a scheduled report
 * @params id - Scheduled export ID
 * @body {name, schedule, exportOptions, recipients, enabled?}
 * @access Private (Admin only)
 */
router.put('/scheduled/:id',
  adminOnly,
  ExportController.updateScheduledReport
);

/**
 * @route DELETE /api/exports/scheduled/:id
 * @description Delete a scheduled report
 * @params id - Scheduled export ID
 * @access Private (Admin only)
 */
router.delete('/scheduled/:id',
  adminOnly,
  ExportController.deleteScheduledReport
);

/**
 * @route POST /api/exports/test/:id
 * @description Test a scheduled export (development only)
 * @params id - Scheduled export ID
 * @access Private (Admin only)
 */
router.post('/test/:id',
  adminOnly,
  ExportController.testScheduledExport
);

export { router as exportsRoutes };
