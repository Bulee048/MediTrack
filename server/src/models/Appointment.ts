import { Schema, model, Document, Types } from 'mongoose';

export type AppointmentStatus = 'BOOKED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface IAppointment extends Document {
  patient: Types.ObjectId;
  familyMember?: Types.ObjectId;
  doctor: Types.ObjectId;
  appointmentDate: Date;
  timeSlot: string;
  reason?: string;
  status: AppointmentStatus;
  queueTicket?: Types.ObjectId;
  ref?: string;
  referenceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    familyMember: {
      type: Schema.Types.ObjectId,
      ref: 'FamilyMember',
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['BOOKED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'],
      default: 'BOOKED',
      index: true,
    },
    queueTicket: {
      type: Schema.Types.ObjectId,
      ref: 'QueueTicket',
    },
    ref: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
