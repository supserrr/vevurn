import { Router } from 'express';
import { GDPRController } from '../controllers/GDPRController';
import { requireBetterAuth } from '../middleware/betterAuth';
import { managerOrAdmin, adminOnly } from '../middleware/roleMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireBetterAuth);

/**
 * @route POST /api/gdpr/export/request
 * @desc Request data export (GDPR Article 20 - Right to data portability)
 * @access Private (Self or Admin)
 */
router.post('/export/request', GDPRController.requestDataExport);

/**
 * @route GET /api/gdpr/export/:requestId
 * @desc Get data export request status
 * @access Private (Self or Admin)
 */
router.get('/export/:requestId', GDPRController.getDataExportStatus);

/**
 * @route POST /api/gdpr/deletion/request
 * @desc Request data deletion (GDPR Article 17 - Right to erasure)
 * @access Private (Self or Admin)
 */
router.post('/deletion/request', GDPRController.requestDataDeletion);

/**
 * @route DELETE /api/gdpr/deletion/:requestId/cancel
 * @desc Cancel data deletion request
 * @access Private (Self only)
 */
router.delete('/deletion/:requestId/cancel', GDPRController.cancelDataDeletion);

/**
 * @route GET /api/gdpr/deletion/:requestId
 * @desc Get data deletion request status
 * @access Private (Self or Admin)
 */
router.get('/deletion/:requestId', GDPRController.getDataDeletionStatus);

/**
 * @route POST /api/gdpr/consent
 * @desc Record user consent
 * @access Private (Self only)
 */
router.post('/consent', GDPRController.recordConsent);

/**
 * @route GET /api/gdpr/consent/:userId
 * @desc Get user consents
 * @access Private (Self or Admin)
 */
router.get('/consent/:userId', GDPRController.getUserConsents);

/**
 * @route POST /api/gdpr/retention-policy
 * @desc Set audit retention policy
 * @access Admin only
 */
router.post('/retention-policy', adminOnly, GDPRController.setRetentionPolicy);

/**
 * @route POST /api/gdpr/retention-policy/apply
 * @desc Apply retention policies manually
 * @access Admin only
 */
router.post('/retention-policy/apply', adminOnly, GDPRController.applyRetentionPolicies);

/**
 * @route GET /api/gdpr/compliance-info
 * @desc Get GDPR compliance information
 * @access Public (authenticated)
 */
router.get('/compliance-info', GDPRController.getComplianceInfo);

export { router as gdprRoutes };
export default router;
