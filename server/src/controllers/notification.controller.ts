import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  static async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unread === 'true';

      const notifications = await NotificationService.getUserNotifications(userId, unreadOnly);

      res.status(200).json({
        success: true,
        message: 'Notifications fetched successfully',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationId = req.params.id as string;
      const userId = req.user!.id;

      const notification = await NotificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}
