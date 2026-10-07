import { Schema, model, Document, Types } from 'mongoose';

export type AvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';

export interface IAvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}

export interface IDoctor extends Document {
  name: string;
  department: Types.ObjectId;
  title?: string;
  experienceYears?: number;
  consultationFee?: number;
  roomNumber?: string;
  availabilityStatus: AvailabilityStatus;
  availabilitySlots: IAvailabilitySlot[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: [0, 'Capacity cannot be negative'],
  },
  bookedCount: {
    type: Number,
    default: 0,
    min: [0, 'Booked count cannot be negative'],
  },
});

const doctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience years cannot be negative'],
    },
    consultationFee: {
      type: Number,
      min: [0, 'Consultation fee cannot be negative'],
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'LIMITED', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    availabilitySlots: [availabilitySlotSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Doctor = model<IDoctor>('Doctor', doctorSchema);
