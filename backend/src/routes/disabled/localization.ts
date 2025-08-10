import { Router } from 'express';
import { LocalizationController } from '../controllers/LocalizationController';
import { authMiddleware } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Public endpoints (no authentication required)
router.get('/locales', LocalizationController.getSupportedLocales);
router.get('/currencies', LocalizationController.getSupportedCurrencies);
router.get('/timezones', LocalizationController.getSupportedTimezones);
router.post('/timezone/convert', LocalizationController.convertTimeZone);

// Authenticated endpoints
router.use(authMiddleware);

// User configuration endpoints
router.get('/config', LocalizationController.getUserConfig);
router.put('/config', LocalizationController.updateUserConfig);

// Formatting endpoints
router.post('/format/date', LocalizationController.formatDate);
router.post('/format/number', LocalizationController.formatNumber);
router.post('/format/duration', LocalizationController.formatDuration);
router.post('/format/address', LocalizationController.formatAddress);
router.post('/format/phone', LocalizationController.formatPhoneNumber);
router.post('/format/filesize', LocalizationController.formatFileSize);

// Parsing endpoints
router.post('/parse/number', LocalizationController.parseNumber);

// Localized data endpoints
router.get('/days', LocalizationController.getDayNames);
router.get('/months', LocalizationController.getMonthNames);
router.get('/validation-rules', LocalizationController.getValidationRules);
router.get('/business-hours', LocalizationController.getBusinessHours);
router.get('/error-messages', LocalizationController.getErrorMessages);
router.get('/text-direction', LocalizationController.getTextDirection);

// Export endpoint
router.get('/export', LocalizationController.exportLocalizationData);

export default router;
