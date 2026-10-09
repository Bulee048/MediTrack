import { apiClient } from '@/config/api';

export interface NotificationData {
  _id: string;
  user: string;
  queueTicket?: string;
  appointment?: string;
  title: string;
  message: string;
  category:
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_UPDATED'
    | 'APPOINTMENT_CANCELLED'
    | 'QUEUE_CREATED'
    | 'QUEUE_UPDATE'
    | 'ALMOST_TURN'
    | 'YOUR_TURN'
    | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: NotificationData[];
  };
}

export class NotificationApiService {
  static async getUserNotifications(unreadOnly?: boolean): Promise<NotificationData[]> {
    const response = await apiClient.get<NotificationsResponse>('/notifications', {
      params: { unread: unreadOnly ? 'true' : undefined },
    });
    return response.data.data.notifications;
  }

  static async markAsRead(notificationId: string): Promise<NotificationData> {
    const response = await apiClient.patch<{ success: boolean; data: { notification: NotificationData } }>(
      `/notifications/${notificationId}/read`
    );
    return response.data.data.notification;
  }

  static async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }
}
