import { Schema, model, Document } from 'mongoose';

export type UserRole = 'PATIENT' | 'STAFF' | 'ADMIN';
export type StaffRole = 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';

export interface NotificationPreferences { inAppAlerts: boolean; queueAlerts: boolean; promoEmailOptIn: boolean; reminders: boolean; reminderOffset: '30m' | '1h' | '1d'; }

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  staffRole?: StaffRole;
  staffId?: string;
  nic?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  notificationPreferences?: NotificationPreferences;
  staffPreferences?: { refreshSeconds: 15 | 30 | 60; showCompletedTickets: boolean };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['PATIENT', 'STAFF', 'ADMIN'],
      default: 'PATIENT',
      required: true,
    },
    staffRole: {
      type: String,
      enum: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'],
    },
    staffId: {
      type: String,
      trim: true,
      sparse: true,
    },
    nic: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notificationPreferences: { type: new Schema({ inAppAlerts:{type:Boolean,default:true}, queueAlerts:{type:Boolean,default:true}, promoEmailOptIn:{type:Boolean,default:false}, reminders:{type:Boolean,default:true}, reminderOffset:{type:String,enum:['30m','1h','1d'],default:'1h'} },{_id:false}), default:()=>({}) },
    staffPreferences: { type: new Schema({ refreshSeconds: { type: Number, enum: [15, 30, 60], default: 15 }, showCompletedTickets: { type: Boolean, default: true } }, { _id: false }), default: () => ({}) },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
