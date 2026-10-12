import 'dotenv/config';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { setServers } from 'node:dns';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { databaseLookup } from '../src/config/databaseLookup.js';
import { hospitalDate } from '../src/utils/hospitalDate.js';
import { User } from '../src/models/User.js';
import { Department } from '../src/models/Department.js';
import { Doctor } from '../src/models/Doctor.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { Notification } from '../src/models/Notification.js';
import { QueueCalculationService } from '../src/services/queueCalculation.service.js';
import { QueueService } from '../src/services/queue.service.js';
import { NotificationService } from '../src/services/notification.service.js';

async function main() {
  if (process.env.RUN_ATLAS_TESTS !== 'true' || env.MONGODB_DB_NAME !== 'meditrack_demo' || env.NODE_ENV === 'production') throw new Error('Explicit isolated Atlas test configuration required');
  if (process.env.TEST_DNS_SERVERS) setServers(process.env.TEST_DNS_SERVERS.split(','));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'meditrack_demo', lookup: databaseLookup, serverSelectionTimeoutMS: 20000 });
  const users = Array.from({length: 12}, () => new mongoose.Types.ObjectId());
  const departments: string[] = [], doctors: string[] = [];
  const password = randomBytes(20).toString('hex'), today = hospitalDate();
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api`;
  let checks = 0;
  const check = (value: unknown, label: string) => { assert.ok(value, label); checks++; console.log(`PASS ${label}`); };
  async function request(path: string, token = '', method = 'GET', body?: object) {
    const response = await fetch(base + path, {method, headers: {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
    return {status:response.status, body:await response.json()};
  }
  const originalNotify = NotificationService.createNotification;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.insertMany(users.map((_id, i) => ({_id, name:`Queue Audit ${i}`, phone:`7${Date.now()}${i}`, passwordHash, role:i === 0 ? 'ADMIN' : 'PATIENT'})));
    const adminUser = await User.findById(users[0]);
    const admin = (await request('/auth/login', '', 'POST', {phone:adminUser!.phone, password})).body.data.token;
    const created = await request('/departments', admin, 'POST', {name:'Queue Audit Department', code:`QA${users[0]}`});
    if (created.body?.data?.department?._id) departments.push(created.body.data.department._id);
    check(created.status === 201 && departments.length === 1, 'department API create');
    const department = departments[0];
    check((await request(`/departments/${department}`)).status === 200, 'department API read');
    check((await request(`/departments/${department}`, admin, 'PATCH', {roomNumber:'QA2'})).status === 200 && (await Department.findById(department))?.roomNumber === 'QA2', 'department update persists');
    check((await request('/departments?search=%5B')).status === 200, 'department literal punctuation search does not throw');
    for (const name of ['Queue Audit Doctor', 'Other Queue Audit Doctor']) {
      const result = await request('/doctors', admin, 'POST', {name, departmentId:department, roomNumber:'QA2'});
      if (result.body?.data?.doctor?._id) doctors.push(result.body.data.doctor._id);
      check(result.status === 201, 'doctor API create');
    }
    const doctor = doctors[0];
    check((await request(`/doctors/${doctor}`)).status === 200, 'doctor API read');
    check((await request(`/doctors/${doctor}`, admin, 'PATCH', {title:'Audit Consultant'})).status === 200 && (await Doctor.findById(doctor))?.title === 'Audit Consultant', 'doctor update persists');
    check((await request(`/doctors/${doctor}/availability`, admin, 'PATCH', {slots:[{date:today,startTime:'23:00',endTime:'23:30',capacity:10}]})).status === 200, 'doctor schedule API update');
    check((await request(`/doctors/${doctor}/availability`)).body.data.slots[0].capacity === 10, 'doctor schedule API read persists capacity');

    // Controlled persisted fixtures include legacy simultaneous active service
    // states to verify deterministic nowServing precedence and isolation.
    const statuses = ['ALMOST_TURN','CALLING','WAITING','IN_CONSULTATION','WAITING','HELD','SKIPPED','COMPLETED','CANCELLED','CALLING','CALLING'] as const;
    const tickets = [];
    for (let i = 0; i < statuses.length; i++) {
      const scopeDoctor = i === 9 ? doctors[1] : doctor;
      const appointment = await Appointment.create({patient:users[i+1],doctor:scopeDoctor,appointmentDate:new Date(today),timeSlot:'23:00',status:i === 7 ? 'COMPLETED' : i === 8 ? 'CANCELLED' : 'BOOKED'});
      const ticket = await QueueTicket.create({patient:users[i+1],doctor:scopeDoctor,department,appointment:appointment._id,sequenceNumber:i+1,ticketNumber:`AUDIT-${i+1}`,status:statuses[i],createdAt:i === 10 ? new Date(Date.now()-86400000) : new Date(),consultationStartedAt:i === 3 ? new Date(Date.now()-3*60000) : undefined});
      await Appointment.updateOne({_id:appointment._id},{$set:{queueTicket:ticket._id}});
      tickets.push(ticket);
    }
    let live = await QueueCalculationService.calculateLiveQueueState(tickets[4]);
    check(live.patientsAhead === 2 && live.currentPosition === 3, 'positions count only WAITING and ALMOST_TURN');
    check(live.nowServingTicket === 'AUDIT-2' && live.nowServingStatus === 'CALLING', 'same-day CALLING preferred over consultation, other doctor and previous day');
    check(live.estimatedWaitMins === 18, 'two waiting patients plus current call estimate is eighteen minutes');
    for (const i of [1,3,5,6,7,8]) {
      const state = await QueueCalculationService.calculateLiveQueueState(tickets[i]);
      check(state.currentPosition === 0 && state.estimatedWaitMins === 0 && state.status === statuses[i], `${statuses[i]} is not rewritten or counted as waiting`);
    }
    await QueueService.skip(String(tickets[1]._id));
    live = await QueueCalculationService.calculateLiveQueueState(tickets[4]);
    check(live.nowServingStatus === 'IN_CONSULTATION' && live.estimatedWaitMins > 12 && live.estimatedWaitMins <= 15, 'remaining consultation contributes at most three minutes');
    const reassigned = await request('/departments', admin, 'POST', {name:'Owned reassignment department', code:`QM${users[0]}`});
    if (reassigned.body?.data?.department?._id) departments.push(reassigned.body.data.department._id);
    assert.equal(reassigned.status,201);
    const newDepartment = departments[1];
    assert.equal((await request(`/doctors/${doctor}`,admin,'PATCH',{departmentId:newDepartment})).status,200);
    const movedTicket = await QueueTicket.create({patient:users[11],doctor,department:newDepartment,appointment:tickets[10].appointment,sequenceNumber:12,ticketNumber:'OWNED-MOVED',status:'WAITING'});
    check((await request('/queue/call-next',admin,'POST',{doctorId:doctor,departmentId:newDepartment})).status===409, 'doctor reassignment cannot admit a second service in another department');
    await QueueTicket.deleteOne({_id:movedTicket._id});
    assert.equal((await request(`/doctors/${doctor}`,admin,'PATCH',{departmentId:department})).status,200);
    check((await request('/queue/call-next',admin,'POST',{})).status === 400, 'unscoped call rejected');
    check((await request('/queue/call-next',admin,'POST',{doctorId:doctor,patientId:String(users[1])})).status === 400, 'call scope injection rejected');
    check((await request('/queue?date=2026-02-30',admin)).status === 400, 'invalid queue calendar date rejected');
    check((await request('/queue?status=UNKNOWN',admin)).status === 400, 'invalid queue status rejected');
    let queueReads = 0;
    const previousDebug = mongoose.get('debug');
    mongoose.set('debug', (collection, method) => {
      if (collection === QueueTicket.collection.name && ['find', 'findOne', 'countDocuments'].includes(method)) queueReads++;
    });
    const started = performance.now();
    let scoped;
    try { scoped = await request(`/queue?doctorId=${doctor}`,admin); }
    finally { mongoose.set('debug', previousDebug); }
    console.log(`MEASURE staff queue: ${queueReads} ticket reads for nine tickets, ${(performance.now()-started).toFixed(1)} ms API duration`);
    check(queueReads === 2, 'staff queue uses one list read and one shared calculation snapshot');
    check(scoped.status === 200 && scoped.body.data.tickets.length === 9 && scoped.body.data.tickets.every((t:{doctor:{_id:string};createdAt:string})=>t.doctor._id===doctor && hospitalDate(new Date(t.createdAt))===today), 'staff list excludes other doctor and previous day');
    const waitingOnly = await request(`/queue?doctorId=${doctor}&status=WAITING`, admin);
    check(waitingOnly.body.data.tickets.find((t:{ticketNumber:string})=>t.ticketNumber==='AUDIT-5').currentPosition===3, 'filtered staff snapshot still includes almost-turn patients ahead');

    // Failure injection proves completion is all-or-nothing, including its
    // appointment and notification. Restore the service even after failure.
    NotificationService.createNotification = async () => { throw new Error('Owned audit notification failure'); };
    await assert.rejects(QueueService.completeConsultation(String(tickets[3]._id)), /Owned audit notification failure/);
    NotificationService.createNotification = originalNotify;
    check((await QueueTicket.findById(tickets[3]._id))?.status === 'IN_CONSULTATION' && (await Appointment.findById(tickets[3].appointment))?.status === 'BOOKED', 'failed completion rolls back ticket and appointment');
    await QueueService.completeConsultation(String(tickets[3]._id));
    live = await QueueCalculationService.calculateLiveQueueState(tickets[4]);
    check(live.nowServingTicket === null && live.estimatedWaitMins === 12, 'completed service releases its estimated remaining time');
    check((await QueueTicket.findById(tickets[3]._id))?.ticketNumber === 'AUDIT-4', 'completion retains ticket number');
    check((await request(`/doctors/${doctor}`,admin,'PATCH',{isActive:false})).status === 200 && (await request(`/doctors/${doctor}`)).status === 404, 'doctor deactivation removes public lookup without deleting history');
    check((await request(`/departments/${department}`,admin,'DELETE')).status === 200 && (await request(`/departments/${department}`)).status === 404 && Boolean(await Department.findById(department)), 'department DELETE is persisted deactivation, not hard deletion');
    console.log(`RESULT ${checks} queue/CRUD/atomicity assertions passed`);
  } finally {
    NotificationService.createNotification = originalNotify;
    await Notification.deleteMany({user:{$in:users}});
    await QueueTicket.deleteMany({patient:{$in:users}});
    await Appointment.deleteMany({patient:{$in:users}});
    await User.deleteMany({_id:{$in:users}});
    await Doctor.deleteMany({_id:{$in:doctors}});
    await Department.deleteMany({_id:{$in:departments}});
    assert.equal(await QueueTicket.countDocuments({patient:{$in:users}}),0);
    assert.equal(await Appointment.countDocuments({patient:{$in:users}}),0);
    assert.equal(await Notification.countDocuments({user:{$in:users}}),0);
    assert.equal(await User.countDocuments({_id:{$in:users}}),0);
    assert.equal(await Doctor.countDocuments({_id:{$in:doctors}}),0);
    assert.equal(await Department.countDocuments({_id:{$in:departments}}),0);
    await new Promise<void>(resolve=>server.close(()=>resolve())); await mongoose.disconnect();
    console.log('CLEANUP: queue audit fixtures removed and verified');
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
