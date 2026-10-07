import { Schema, model, Document, Types } from 'mongoose';

export type NotificationCategory =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELLED'
  | 'QUEUE_CREATED'
  | 'QUEUE_UPDATE'
  | 'ALMOST_TURN'
  | 'YOUR_TURN'
  | 'SYSTEM';

export interface INotification extends Document {
  user: Types.ObjectId;
  queueTicket?: Types.ObjectId;
  appointment?: Types.ObjectId;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    queueTicket: {
      type: Schema.Types.ObjectId,
      ref: 'QueueTicket',
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'APPOINTMENT_CREATED',
        'APPOINTMENT_UPDATED',
        'APPOINTMENT_CANCELLED',
        'QUEUE_CREATED',
        'QUEUE_UPDATE',
        'ALMOST_TURN',
        'YOUR_TURN',
        'SYSTEM',
      ],
      required: [true, 'Category is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
