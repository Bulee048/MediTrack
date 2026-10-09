import { Schema, model, Document, Types } from 'mongoose';

export type QueueTicketStatus =
  | 'WAITING'
  | 'ALMOST_TURN'
  | 'CALLING'
  | 'IN_CONSULTATION'
  | 'HELD'
  | 'SKIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IQueueTicket extends Document {
  ticketNumber: string;
  sequenceNumber: number;
  appointment: Types.ObjectId;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  department: Types.ObjectId;
  currentPosition: number;
  estimatedWaitMins: number;
  status: QueueTicketStatus;
  checkedInAt?: Date;
  calledAt?: Date;
  arrivedAt?: Date;
  resumeHistory: { at: Date; by: Types.ObjectId }[];
  consultationStartedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const queueTicketSchema = new Schema<IQueueTicket>(
  {
    ticketNumber: {
      type: String,
      required: [true, 'Ticket number is required'],
      trim: true,
    },
    sequenceNumber: {
      type: Number,
      required: [true, 'Sequence number is required'],
      min: [1, 'Sequence number must be positive'],
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    currentPosition: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current position cannot be negative'],
    },
    estimatedWaitMins: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Estimated wait time cannot be negative'],
    },
    status: {
      type: String,
      enum: [
        'WAITING',
        'ALMOST_TURN',
        'CALLING',
        'IN_CONSULTATION',
        'HELD',
        'SKIPPED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'WAITING',
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    // Arrival acknowledges presence; it never starts consultation or changes order.
    arrivedAt: { type: Date },
    resumeHistory: [{ at: { type: Date, required: true }, by: { type: Schema.Types.ObjectId, ref: 'User', required: true }, _id: false }],
    consultationStartedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

queueTicketSchema.index({ department: 1, createdAt: 1 });
queueTicketSchema.index({ doctor: 1, status: 1, createdAt: 1 });

export const QueueTicket = model<IQueueTicket>('QueueTicket', queueTicketSchema);
