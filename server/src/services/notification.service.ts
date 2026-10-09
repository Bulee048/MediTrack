import { Notification, INotification, NotificationCategory } from '../models/Notification.js';
import { validateObjectId } from '../utils/objectId.js';
import { AppError } from '../utils/AppError.js';
import { ClientSession } from 'mongoose';

export class NotificationService {
  /**
   * Create a notification; turn alerts are unique per patient, ticket and category.
   */
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    queueTicketId?: string;
    appointmentId?: string;
  }, session?: ClientSession): Promise<INotification> {
    validateObjectId(data.userId, 'user ID');

    if (data.queueTicketId) validateObjectId(data.queueTicketId, 'queue ticket ID');
    if (data.appointmentId) validateObjectId(data.appointmentId, 'appointment ID');

    const fields = {
      user: data.userId,
      title: data.title,
      message: data.message,
      category: data.category,
      queueTicket: data.queueTicketId,
      appointment: data.appointmentId,
      isRead: false,
    };

    if (['ALMOST_TURN', 'YOUR_TURN'].includes(data.category)) {
      if (!data.queueTicketId) throw new AppError('Queue ticket ID is required for turn notifications', 400);

      // Wait for the schema's unique index before allowing concurrent inserts.
      await Notification.init();
      const scope = { user: data.userId, queueTicket: data.queueTicketId, category: data.category };
      try {
        return (await Notification.findOneAndUpdate(
          scope,
          { $setOnInsert: fields },
          { upsert: true, new: true, runValidators: true }
        ))!;
      } catch (error: unknown) {
        // A concurrent upsert may win the unique-index race. Return its notification.
        if ((error as { code?: number }).code === 11000) {
          const existing = await Notification.findOne(scope);
          if (existing) return existing;
        }
        throw error;
      }
    }

    return await new Notification(fields).save({ session });
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId: string, unreadOnly?: boolean): Promise<INotification[]> {
    validateObjectId(userId, 'user ID');

    const filter: Record<string, unknown> = { user: userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    return await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    validateObjectId(notificationId, 'notification ID');
    validateObjectId(userId, 'user ID');

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user.toString() !== userId) {
      throw new AppError('Access forbidden: You do not own this notification', 403);
    }

    notification.isRead = true;
    return await notification.save();
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    validateObjectId(userId, 'user ID');
    await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
  }
}
