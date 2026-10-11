import { Schema, model, Types } from 'mongoose';
interface Reminder { key:string; appointment:Types.ObjectId; user:Types.ObjectId; dueAt:Date; appointmentAt:Date; status:'PENDING'|'DELIVERED'|'CANCELLED'; deliveredAt?:Date }
const schema = new Schema<Reminder>({ key:{type:String,required:true,unique:true}, appointment:{type:Schema.Types.ObjectId,ref:'Appointment',required:true}, user:{type:Schema.Types.ObjectId,ref:'User',required:true}, dueAt:{type:Date,required:true}, appointmentAt:{type:Date,required:true}, status:{type:String,enum:['PENDING','DELIVERED','CANCELLED'],default:'PENDING'}, deliveredAt:Date },{timestamps:true});
schema.index({status:1,dueAt:1});
export const AppointmentReminder = model<Reminder>('AppointmentReminder',schema);
