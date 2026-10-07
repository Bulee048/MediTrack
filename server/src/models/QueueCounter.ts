import { Schema, model, Document } from 'mongoose';

export interface IQueueCounter extends Document {
  scopeKey: string;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const queueCounterSchema = new Schema<IQueueCounter>(
  {
    scopeKey: {
      type: String,
      required: [true, 'Scope key is required'],
      unique: true,
      trim: true,
    },
    sequence: {
      type: Number,
      default: 0,
      min: [0, 'Sequence cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const QueueCounter = model<IQueueCounter>('QueueCounter', queueCounterSchema);
