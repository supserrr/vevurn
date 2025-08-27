import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/response';

export class NotificationsController {
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getUserNotifications(userId, page, limit);

      res.json(
        ApiResponse.success('Notifications retrieved successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notificationId = req.params.id;
      const userId = req.user!.id;

      await NotificationService.markAsRead(notificationId, userId);

      res.json(
        ApiResponse.success('Notification marked as read')
      );
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      await NotificationService.markAllAsRead(userId);

      res.json(
        ApiResponse.success('All notifications marked as read')
      );
    } catch (error) {
      next(error);
    }
  }
}
