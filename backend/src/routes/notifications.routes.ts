import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/better-auth.middleware';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const router: Router = Router();

// Get user notifications
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { limit = 50 } = req.query as any;

    const result = await NotificationService.getUserNotifications(userId, Number(limit));

    res.json(
      ApiResponse.success('Notifications retrieved successfully', result)
    );
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json(
        ApiResponse.error('Notification not found', 404)
      );
    }

    await NotificationService.markAsRead(id, userId);

    res.json(
      ApiResponse.success('Notification marked as read')
    );
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    next(error);
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    await NotificationService.markAllAsRead(userId);

    res.json(
      ApiResponse.success('All notifications marked as read')
    );
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    next(error);
  }
});

// Get unread count
router.get('/unread-count', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json(
      ApiResponse.success('Unread count retrieved successfully', { unreadCount })
    );
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    next(error);
  }
});

export default router;
