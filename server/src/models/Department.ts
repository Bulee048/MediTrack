import { Schema, model, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  icon?: string;
  description?: string;
  roomNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department = model<IDepartment>('Department', departmentSchema);
