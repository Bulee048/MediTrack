import 'dotenv/config';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { setServers } from 'node:dns';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Department } from '../src/models/Department.js';
import { Doctor } from '../src/models/Doctor.js';
import { Appointment } from '../src/models/Appointment.js';
import { Notification } from '../src/models/Notification.js';
import { AppointmentReminder } from '../src/models/AppointmentReminder.js';
import { ReminderService, reminderSchedule } from '../src/services/reminder.service.js';
import { PreferencesService } from '../src/services/preferences.service.js';
const userId=new mongoose.Types.ObjectId(),departmentId=new mongoose.Types.ObjectId(),doctorId=new mongoose.Types.ObjectId();
let checks=0;
const check=(condition:unknown,message:string)=>{assert.ok(condition,message);checks++;console.log(`PASS ${message}`);};
async function main(){
  if(process.env.RUN_ATLAS_TESTS!=='true'||env.MONGODB_DB_NAME!=='meditrack_demo'||env.NODE_ENV==='production')throw new Error('Require explicit isolated demo Atlas test configuration');
  if(process.env.TEST_DNS_SERVERS)setServers(process.env.TEST_DNS_SERVERS.split(','));
  await mongoose.connect(env.MONGODB_URI,{dbName:'meditrack_demo',serverSelectionTimeoutMS:20000});
  const run = (now: Date) => ReminderService.run(now, String(userId));
  try{
    await User.create({_id:userId,name:'Reminder Test',phone:`test-${userId}`,role:'PATIENT',isActive:true});
    await Department.create({_id:departmentId,name:'Reminder test',code:`TEST${departmentId}`});
    await Doctor.create({_id:doctorId,name:'Reminder Test Doctor',department:departmentId});
    const date=new Date(Date.now()+30*86400000);const day=date.toISOString().slice(0,10);
    const appointment=await Appointment.create({patient:userId,doctor:doctorId,appointmentDate:new Date(day),timeSlot:'10:00',status:'BOOKED'});
    const schedule=reminderSchedule(String(appointment._id),appointment.appointmentDate,'10:00','1h');
    for(const [offset,minutes] of [['30m',30],['1h',60],['1d',1440]] as const){const timed=reminderSchedule(String(appointment._id),appointment.appointmentDate,'10:00',offset);check(timed.appointmentAt.getTime()-timed.dueAt.getTime()===minutes*60000,`exact ${offset} reminder offset`);}
    check(schedule.appointmentAt.toISOString()===`${day}T04:30:00.000Z`,'Asia/Colombo appointment time');
    await run(new Date(schedule.dueAt.getTime()-1));
    check(await Notification.countDocuments({user:userId,category:'APPOINTMENT_REMINDER'})===0,'not delivered before due time');
    check(await AppointmentReminder.countDocuments({user:userId,status:'PENDING'})===1,'job persists before delivery');
    await run(schedule.dueAt);await run(schedule.dueAt);
    check(await Notification.countDocuments({user:userId,category:'APPOINTMENT_REMINDER'})===1,'due delivery survives repeated worker execution without duplication');
    check(await AppointmentReminder.countDocuments({user:userId,status:'DELIVERED'})===1,'delivery recorded');
    await PreferencesService.update(String(userId),{reminderOffset:'30m',promoEmailOptIn:true});
    check((await PreferencesService.get(String(userId))).promoEmailOptIn===true,'account preference persists');
    const later=reminderSchedule(String(appointment._id),appointment.appointmentDate,'10:00','30m');
    await run(new Date(later.dueAt.getTime()-1));
    await Appointment.updateOne({_id:appointment._id},{$set:{status:'CANCELLED'}});
    await run(later.dueAt);
    check(await Notification.countDocuments({user:userId,category:'APPOINTMENT_REMINDER'})===1,'cancelled appointment does not send');
    await Appointment.updateOne({_id:appointment._id},{$set:{status:'RESCHEDULED',timeSlot:'12:00'}});
    const moved=reminderSchedule(String(appointment._id),appointment.appointmentDate,'12:00','30m');
    await run(later.dueAt);
    check(await Notification.countDocuments({user:userId,category:'APPOINTMENT_REMINDER'})===1,'rescheduled appointment does not send at old time');
    await run(moved.dueAt);
    check(await Notification.countDocuments({user:userId,category:'APPOINTMENT_REMINDER'})===2,'rescheduled appointment delivers at new time');
    await PreferencesService.update(String(userId),{reminders:false});
    await Appointment.updateOne({_id:appointment._id},{$set:{timeSlot:'14:00'}});
    await run(new Date(`${day}T08:00:00Z`));
    check(await AppointmentReminder.countDocuments({user:userId,status:'PENDING'})===0,'disabled reminders do not retain pending jobs');
    await PreferencesService.update(String(userId),{reminders:true});
    await run(new Date(`${day}T20:00:00Z`));
    check(await Notification.countDocuments({user:userId,category:'APPOINTMENT_REMINDER'})===2,'past appointment never sends new reminder');
    console.log(`${checks} reminder checks passed`);
  }finally{
    await Promise.all([AppointmentReminder.deleteMany({user:userId}),Notification.deleteMany({user:userId}),Appointment.deleteMany({patient:userId}),User.deleteOne({_id:userId}),Doctor.deleteOne({_id:doctorId}),Department.deleteOne({_id:departmentId})]);
    await mongoose.disconnect();
  }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Test failed');process.exitCode=1;});
