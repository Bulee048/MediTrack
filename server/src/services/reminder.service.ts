import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AppointmentReminder } from '../models/AppointmentReminder.js';
import { defaultPreferences } from './preferences.service.js';
const offsets = { '30m':30, '1h':60, '1d':1440 };
export function reminderSchedule(id:string, date:Date, time:string, offset:keyof typeof offsets) {
  const appointmentAt = new Date(`${date.toISOString().slice(0,10)}T${time.slice(0,5)}:00+05:30`);
  return { key:`${id}:${appointmentAt.toISOString()}:${offset}`, appointmentAt, dueAt:new Date(appointmentAt.getTime()-offsets[offset]*60000) };
}
export class ReminderService {
  static async run(now = new Date(), userId?: string) {
    await Promise.all([AppointmentReminder.init(),Notification.init()]);
    const scope = userId ? {user:userId} : {};
    const appointments = await Appointment.find({ ...(userId ? {patient:userId} : {}), status:{$in:['BOOKED','RESCHEDULED']} });
    const desired:string[]=[];
    for (const appointment of appointments) {
      const user=await User.findOne({_id:appointment.patient,isActive:true});
      if (!user || !(user.notificationPreferences?.reminders ?? defaultPreferences.reminders)) continue;
      const schedule=reminderSchedule(String(appointment._id),appointment.appointmentDate,appointment.timeSlot,user.notificationPreferences?.reminderOffset ?? '1h');
      if (schedule.appointmentAt <= now) continue;
      desired.push(schedule.key);
      try { await AppointmentReminder.updateOne({key:schedule.key},{$setOnInsert:{...schedule,appointment:appointment._id,user:user._id,status:'PENDING'}},{upsert:true}); } catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) throw error; }
      await AppointmentReminder.updateOne({key:schedule.key,status:'CANCELLED'},{$set:{status:'PENDING'}});
    }
    await AppointmentReminder.updateMany({...scope,status:'PENDING',key:{$nin:desired}},{$set:{status:'CANCELLED'}});
    const due=await AppointmentReminder.find({...scope,status:'PENDING',dueAt:{$lte:now},appointmentAt:{$gt:now}}).limit(100);
    for (const job of due) await mongoose.connection.transaction(async session => {
      const locked=await AppointmentReminder.findOneAndUpdate({_id:job._id,status:'PENDING'},{$inc:{__v:1}},{new:true,session});
      if (!locked) return;
      // Serialize delivery against cancellation and rescheduling, then revalidate authoritative state.
      const appointment=await Appointment.findOneAndUpdate({_id:job.appointment,status:{$in:['BOOKED','RESCHEDULED']}},{$inc:{__v:1}},{session,new:true,timestamps:false});
      const user=await User.findOneAndUpdate({_id:job.user,isActive:true},{$inc:{__v:1}},{session,new:true,timestamps:false});
      const valid=appointment && user && (user.notificationPreferences?.reminders ?? true)
        && reminderSchedule(String(appointment._id),appointment.appointmentDate,appointment.timeSlot,user.notificationPreferences?.reminderOffset ?? '1h').key===job.key;
      if (!valid || job.appointmentAt <= now) { locked.status='CANCELLED'; await locked.save({session}); return; }
      await new Notification({user:job.user,appointment:job.appointment,category:'APPOINTMENT_REMINDER',deliveryKey:job.key,title:'Appointment reminder',message:`Your OPD appointment is on ${appointment.appointmentDate.toISOString().slice(0,10)} at ${appointment.timeSlot.slice(0,5)} (Asia/Colombo).`,isRead:false}).save({session});
      locked.status='DELIVERED'; locked.deliveredAt=now; await locked.save({session});
    });
    return due.length;
  }
}
export function startReminderWorker() {
  let running=false;
  const tick=async()=>{if(running)return;running=true;try{await ReminderService.run();}catch(error){console.error('[Reminders] Delivery failed; persisted jobs will retry',error instanceof Error ? error.message : 'Unknown error');}finally{running=false;}};
  void tick(); const timer=setInterval(()=>void tick(),30000);timer.unref();return()=>clearInterval(timer);
}
