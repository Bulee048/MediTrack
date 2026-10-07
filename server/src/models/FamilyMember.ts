import { Schema, model, Document, Types } from 'mongoose';

export interface IFamilyMember extends Document {
  owner: Types.ObjectId;
  name: string;
  relationship: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  nic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const familyMemberSchema = new Schema<IFamilyMember>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    nic: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FamilyMember = model<IFamilyMember>('FamilyMember', familyMemberSchema);
