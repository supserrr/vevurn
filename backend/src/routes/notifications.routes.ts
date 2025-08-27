import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/better-auth.middleware';

const router = Router();
const notificationsController = new NotificationsController();

// Apply auth middleware to all routes
router.use(requireAuth);

// GET /api/notifications - Get user notifications
router.get('/', (req, res, next) => notificationsController.getNotifications(req, res, next));

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', (req, res, next) => notificationsController.markAllAsRead(req, res, next));

export default router;
