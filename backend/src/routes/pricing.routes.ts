import { Router } from 'express';
import { PricingController } from '../controllers/pricing.controller';

const router = Router();

/**
 * Pricing and Discount Management Routes
 */

// Price validation
router.post('/validate', PricingController.validatePrice);

// Maximum discount calculation
router.get('/max-discount/:staffId/:productId', PricingController.getMaxDiscount);

// Check approval requirements
router.post('/check-approval', PricingController.checkApprovalRequired);

// Bulk discount application
router.post('/bulk-discount', PricingController.applyBulkDiscount);

// Product pricing information
router.get('/product/:productId', PricingController.getProductPricing);

// Approval management
router.post('/request-approval', PricingController.requestApproval);
router.get('/approvals/pending', PricingController.getPendingApprovals);
router.put('/approvals/:approvalId', PricingController.processApproval);

export default router;
