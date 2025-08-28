import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { requireAuth, requireManagerOrAdmin } from '../middleware/better-auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { businessSetupSchema, businessUpdateSchema } from '../validators/business.schemas';

const router = Router();
const businessController = new BusinessController();

// POST /api/business/setup - Complete business onboarding
router.post('/setup',
  requireAuth,
  upload.single('logo'),
  validateRequest({ body: businessSetupSchema }),
  (req, res, next) => businessController.setupBusiness(req, res, next)
);

// GET /api/business - Get business details
router.get('/',
  requireAuth,
  (req, res, next) => businessController.getBusiness(req, res, next)
);

// PUT /api/business - Update business details
router.put('/',
  requireManagerOrAdmin,
  upload.single('logo'),
  validateRequest({ body: businessUpdateSchema }),
  (req, res, next) => businessController.updateBusiness(req, res, next)
);

export default router;
