import 'dotenv/config';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { setServers } from 'node:dns';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Department } from '../src/models/Department.js';
import { Doctor } from '../src/models/Doctor.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { QueueCounter } from '../src/models/QueueCounter.js';
import { Notification } from '../src/models/Notification.js';
import { AppointmentReminder } from '../src/models/AppointmentReminder.js';
import { hospitalDate } from '../src/utils/hospitalDate.js';
async function main(){
 if(process.env.RUN_ATLAS_TESTS!=='true'||env.MONGODB_DB_NAME!=='meditrack_demo'||env.NODE_ENV==='production')throw new Error('Explicit isolated Atlas test configuration required');
 if(process.env.TEST_DNS_SERVERS)setServers(process.env.TEST_DNS_SERVERS.split(','));
 await mongoose.connect(env.MONGODB_URI,{dbName:'meditrack_demo',serverSelectionTimeoutMS:20000});
 const staffId=new mongoose.Types.ObjectId(),doctorId=new mongoose.Types.ObjectId(),departmentId=new mongoose.Types.ObjectId();const owners=[staffId];const code=`T${departmentId}`;const password=randomBytes(20).toString('hex');let checks=0;
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api`;
 const request=async(path:string,token='',method='GET',body?:object)=>{const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:response.status===204?null:await response.json()};};
 const check=(value:unknown,message:string)=>{assert.ok(value,message);checks++;console.log(`PASS ${message}`);};
 try{
 await User.create({_id:staffId,name:'Staff Verification',phone:`2${Date.now()}`,passwordHash:await bcrypt.hash(password,10),role:'STAFF'});const staffUser=await User.findById(staffId);const staff=(await request('/auth/login','','POST',{phone:staffUser!.phone,password})).body.data.token;
 const phone=`3${Date.now()}`;const created=await request('/staff/patients',staff,'POST',{name:'Walk-in Verification',phone,password});if(created.body?.data?.patient?.id)owners.push(new mongoose.Types.ObjectId(created.body.data.patient.id));check(created.status===201,'staff walk-in registration persists real patient');
 const patient=(await request('/auth/login','','POST',{phone,password})).body.data.token;check(Boolean(patient),'walk-in patient can authenticate with chosen password');
 check((await request(`/staff/patients?search=${phone}`,staff)).body.data.patients.some((p:{_id:string})=>p._id===String(owners[1])),'staff patient search');check((await request(`/staff/patients?search=${phone}`,patient)).status===403,'patient cannot search staff directory');
 check((await request('/preferences',staff)).status===403,'staff cannot mutate patient preference API');
 check((await request('/preferences',patient,'PATCH',{promoEmailOptIn:true,reminderOffset:'1d'})).status===200,'account preferences saved');check((await request('/preferences',patient)).body.data.preferences.reminderOffset==='1d','account preferences survive refetch');check((await request('/preferences',patient,'PATCH',{userId:String(staffId),reminders:false})).status===400,'preference ownership injection rejected');
 await Department.create({_id:departmentId,name:'Staff Test Department',code});const today=hospitalDate();const date=new Date(`${today}T00:00:00Z`);const slot={date,startTime:'23:00',endTime:'23:30',capacity:1,bookedCount:0};await Doctor.create({_id:doctorId,name:'Staff Test Doctor',department:departmentId,availabilitySlots:[slot]});
 const booked=await request('/staff/appointments',staff,'POST',{patientId:String(owners[1]),doctorId:String(doctorId),date:today,time:'23:00'});check(booked.status===201,'staff books actual slot for patient');const appointmentId=booked.body.data.appointment._id;
 check((await request('/queue/staff/check-in',patient,'POST',{appointmentId})).status===403,'patient cannot use staff check-in');check((await request('/queue/staff/check-in',staff,'POST',{appointmentId})).status===201,'staff same-day check-in uses official queue service');
 const called=await request('/queue/call-next',staff,'POST',{doctorId:String(doctorId)});check(called.status===200,'staff calls newly checked-in patient');const ticketId=called.body.data.ticket._id;check((await request('/queue/me',patient)).body.data.ticket.status==='CALLING','patient observes staff call state');
 check((await request(`/queue/${ticketId}/start-consultation`,staff,'PATCH')).status===200,'staff starts consultation');check((await request(`/queue/${ticketId}/complete`,staff,'PATCH')).status===200,'staff completes consultation');check((await request(`/appointments/${appointmentId}`,patient)).body.data.appointment.status==='COMPLETED','appointment completion persists across portals');
 check((await request(`/departments/${departmentId}`,staff,'DELETE')).status===403,'staff rejected by admin-only department endpoint');
 check((await request(`/doctors/${doctorId}/availability`,patient,'PATCH',{slots:[]})).status===403,'patient cannot change schedules');check((await request(`/doctors/${doctorId}/availability`,staff,'PATCH',{slots:[]})).status===409,'booked schedule slot cannot be deleted');check((await request(`/doctors/${doctorId}/availability`,staff,'PATCH',{slots:[{...slot,date:today,capacity:0}]})).status===409,'capacity cannot drop below booked count');check((await request(`/doctors/${doctorId}/availability`,staff,'PATCH',{slots:[{date:today,startTime:'23:00',endTime:'23:30',capacity:2}]})).status===200,'valid schedule edit preserves booked count');check((await Doctor.findById(doctorId))!.availabilitySlots[0].bookedCount===1,'schedule capacity preserves reservations');
 const revision=(await Doctor.findById(doctorId))!.__v;check((await request(`/doctors/${doctorId}/availability`,staff,'PATCH',{expectedVersion:revision-1,slots:[{date:today,startTime:'23:00',endTime:'23:30',capacity:2}]})).status===409,'stale schedule edit rejected');
 console.log(`${checks} staff/settings checks passed`);
 }finally{await Promise.all([AppointmentReminder.deleteMany({user:{$in:owners}}),Notification.deleteMany({user:{$in:owners}}),QueueTicket.deleteMany({patient:{$in:owners}}),Appointment.deleteMany({patient:{$in:owners}}),User.deleteMany({_id:{$in:owners}}),Doctor.deleteOne({_id:doctorId}),Department.deleteOne({_id:departmentId}),QueueCounter.deleteMany({scopeKey:{$regex:`^DEPT:${code}:`}})]);await new Promise<void>(r=>server.close(()=>r()));await mongoose.disconnect();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Test failed');process.exitCode=1;});
