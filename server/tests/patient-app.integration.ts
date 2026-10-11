import { hospitalDate } from '../src/utils/hospitalDate.js';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { setServers } from 'node:dns';
import { writeFile, unlink } from 'node:fs/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Department } from '../src/models/Department.js';
import { Appointment } from '../src/models/Appointment.js';
import { FamilyMember } from '../src/models/FamilyMember.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { QueueCounter } from '../src/models/QueueCounter.js';
import { AppointmentReminder } from '../src/models/AppointmentReminder.js';
import { Notification } from '../src/models/Notification.js';

async function main() {
  if (process.env.RUN_ATLAS_TESTS !== 'true') throw new Error('Explicit RUN_ATLAS_TESTS=true opt-in required');
  if (process.env.TEST_DNS_SERVERS) setServers(process.env.TEST_DNS_SERVERS.split(','));
  const ownerIds: mongoose.Types.ObjectId[] = [];
  const doctorId = new mongoose.Types.ObjectId(), departmentId = new mongoose.Types.ObjectId();
  const staffId = new mongoose.Types.ObjectId();
  const code = `INT${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const password = randomBytes(20).toString('hex');
  const today = hospitalDate();
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const phones = Array.from({ length: 4 }, (_, i) => `${i + 5}${Date.now()}`);
  let checks = 0;
  const server = app.listen(process.env.BROWSER_FIXTURE_PATH ? 5004 : 0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api`;
  async function request(path: string, token = '', method = 'GET', body?: object) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  const check = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; console.log(`PASS ${message}`); };
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 20000, ...(env.MONGODB_DB_NAME ? {dbName:env.MONGODB_DB_NAME} : {}) });
    for (const [index, phone] of phones.entries()) {
      const registered = await request('/auth/register', '', 'POST', { name: `Integration Patient ${index + 1}`, phone, password });
      if (registered.body?.data?.user?.id) ownerIds.push(new mongoose.Types.ObjectId(registered.body.data.user.id));
      check(registered.status === 201 && registered.body.data.user.role === 'PATIENT', `real registration ${index + 1}`);
    }
    check((await request('/auth/register', '', 'POST', { name: 'Duplicate', phone: phones[0], password })).status === 409, 'duplicate registration rejected');
    check((await request('/auth/register', '', 'POST', { name: 'Escalation', phone: phones[0], password, role: 'ADMIN' })).status === 400, 'registration role injection rejected');
    const tokens: string[] = [];
    for (const phone of phones) {
      const login = await request('/auth/login', '', 'POST', { phone, password });
      check(login.status === 200 && login.body.data.token, 'real login'); tokens.push(login.body.data.token);
    }
    const [a, b, c, d] = tokens;
    check((await request('/auth/me', a)).body.data.user.id === String(ownerIds[0]), 'auth/me uses JWT identity');
    check((await request('/auth/me', 'invalid-token')).status === 401, 'expired/invalid session rejected');
    await User.create({ _id: staffId, name: 'Integration Staff API fixture', phone: `4${Date.now()}`, role: 'STAFF',
      passwordHash: bcrypt.hashSync(password, 10), isActive: true });
    const staffUser = await User.findById(staffId);
    const staffLogin = await request('/auth/login', '', 'POST', { phone: staffUser!.phone, password });
    const staff = staffLogin.body.data.token;
    await Department.create({ _id: departmentId, name: 'Patient Integration Department', code, isActive: true });
    await Doctor.create({ _id: doctorId, name: 'Patient Integration Doctor', title: 'Consultant', department: departmentId,
      roomNumber: 'Integration room', isActive: true, availabilityStatus: 'AVAILABLE', consultationFee: 1500,
      availabilitySlots: [today, future].flatMap(date => Array.from({ length: 10 }, (_, i) => ({ date: new Date(date),
        startTime: `${String(i + 8).padStart(2, '0')}:00`, endTime: `${String(i + 8).padStart(2, '0')}:30`, capacity: 4, bookedCount: 0 }))) });
    for (const path of ['/auth/me', '/appointments/my', '/family-members', '/queue/me', '/notifications'])
      check((await request(path)).status === 401, `unauthenticated ${path} rejected`);
    const profile = await request('/auth/profile', a, 'PATCH', { name: 'Integration Patient Updated', address: 'Test address' });
    check(profile.status === 200 && profile.body.data.user.id === String(ownerIds[0]), 'profile persists current identity');
    check((await request('/auth/me', a)).body.data.user.address === 'Test address', 'profile update authoritative refetch');
    check((await request('/auth/me', b)).body.data.user.address !== 'Test address', 'second profile untouched');
    check((await request('/auth/profile', a, 'PATCH', { name: 'Illegal', patientId: String(ownerIds[1]) })).status === 400, 'profile ownership injection rejected');
    check((await request('/auth/profile', staff, 'PATCH', { name: 'Illegal' })).status === 403, 'staff cannot use patient profile mutation');
    const book = (token: string, time: string, date = today, familyMemberId?: string) => request('/appointments', token, 'POST', {
      doctorId: String(doctorId), date, slotId: `${date}-${time}-${time.slice(0, 2)}:30`, slotLabel: `${time} - ${time.slice(0, 2)}:30`,
      ...(familyMemberId ? { familyMemberId } : {}) });
    const bookings = await Promise.all(tokens.map((token, i) => book(token, `${String(i + 9).padStart(2, '0')}:00`)));
    check(bookings.every(item => item.status === 201), 'real slot-ID booking contract accepted');
    const ids = bookings.map(item => item.body.data.appointment._id);
    check(bookings[0].body.data.appointment.timeSlot === '09:00', 'canonical time works across booking and appointment modules');
    check((await request('/appointments/my?upcoming=true', a)).body.data.appointments.some((item: { _id: string }) => item._id === ids[0]), 'booking appears in My Appointments');
    const createdNotification = await Notification.findOne({ user: ownerIds[0], appointment: ids[0], category: 'APPOINTMENT_CREATED' });
    check(createdNotification, 'booking produces real appointment notification');
    check((await book(a, '09:00')).status === 409, 'duplicate slot-ID booking rejected');
    check(await Notification.countDocuments({ user: ownerIds[0], appointment: ids[0], category: 'APPOINTMENT_CREATED' }) === 1, 'rejected duplicate does not duplicate alerts');
    check((await request('/appointments', a, 'POST', { doctorId: String(doctorId), date: today, slotId: `${today}-09:00-09:30`, slotLabel: '10:00 - 10:30' })).status === 409, 'forged slot label rejected');
    check((await request(`/appointments/${ids[1]}`, a)).status === 403, 'foreign appointment rejected');
    check((await request('/appointments/not-an-id', a)).status === 400, 'invalid appointment ID handled');
    const fa = await request('/family-members', a, 'POST', { name: 'Integration Caregiver', relationship: 'Caregiver', dateOfBirth: '1990-01-01', gender: 'Other' });
    const fb = await request('/family-members', b, 'POST', { name: 'Foreign Caregiver', relationship: 'Caregiver', dateOfBirth: '1990-01-01', gender: 'Other' });
    check(fa.status === 201 && fb.status === 201, 'family CRUD real creation');
    const familyId = fa.body.data.familyMember._id, foreignFamilyId = fb.body.data.familyMember._id;
    check((await request(`/family-members/${familyId}`, a, 'PATCH', { name: 'Integration Caregiver Edited' })).status === 200, 'family edit');
    check((await book(a, '14:00', future, foreignFamilyId)).status === 403, 'foreign family slot-ID booking rejected');
    check((await request('/family-members', a)).body.data.familyMembers.every((item: { owner: string }) => item.owner === String(ownerIds[0])), 'family list ownership');
    const familyBooking = await book(a, '14:00', future, familyId);
    check(familyBooking.status === 201 && familyBooking.body.data.appointment.familyMember.name === 'Integration Caregiver Edited', 'family booking identity comes from backend');
    check((await request('/queue/check-in', a, 'POST', { appointmentId: familyBooking.body.data.appointment._id })).status === 409, 'future appointment check-in rejected');
    check((await request('/queue/check-in', a, 'POST', { appointmentId: ids[1] })).status === 403, 'foreign queue check-in rejected');
    check((await request('/queue/check-in', a, 'POST', { appointmentId: ids[0], patientId: String(ownerIds[1]) })).status === 400, 'queue ownership field rejected');
    // Establish the counter before testing transactional concurrent check-in.
    const duplicateCheckIn = await Promise.all([request('/queue/check-in', a, 'POST', { appointmentId: ids[0] }), request('/queue/check-in', a, 'POST', { appointmentId: ids[0] })]);
    check(duplicateCheckIn.map(item => item.status).sort().join(',') === '201,409', 'concurrent duplicate check-in admits one ticket');
    const ticketA = duplicateCheckIn.find(item => item.status === 201)!.body.data.ticket;
    check(await QueueTicket.countDocuments({ appointment: ids[0] }) === 1, 'one persisted ticket per appointment');
    check(await Notification.countDocuments({ user: ownerIds[0], category: 'QUEUE_CREATED' }) === 1, 'one queue-created alert');
    for (let i = 1; i < tokens.length; i++) check((await request('/queue/check-in', tokens[i], 'POST', { appointmentId: ids[i] })).status === 201, 'patient check-in');
    const tickets = await QueueTicket.find({ patient: { $in: ownerIds } }).sort({ sequenceNumber: 1 });
    check(new Set(tickets.map(item => item.ticketNumber)).size === 4 && tickets.every((item, i) => item.sequenceNumber === i + 1), 'sequential unique stable ticket numbers');
    const old = await QueueTicket.create({ patient: ownerIds[3], doctor: doctorId, department: departmentId, appointment: ids[3],
      sequenceNumber: 999, ticketNumber: 'PREVIOUS-DAY', status: 'CALLING', createdAt: new Date(Date.now() - 86400000) });
    const liveC = (await request('/queue/me', c)).body.data.ticket;
    check(liveC.currentPosition === 3 && liveC.patientsAhead === 2 && liveC.estimatedWaitMins === 12, 'dynamic position and wait calculation');
    check(liveC.nowServing === null, 'previous-day calling excluded');
    check((await request('/queue/me', a)).body.data.ticket.ticketId === ticketA._id, 'patient sees own ticket only');
    await Promise.all(Array.from({ length: 4 }, () => request('/queue/me', a)));
    check(await Notification.countDocuments({ user: ownerIds[0], category: 'ALMOST_TURN' }) === 1, 'polling almost-turn deduplication');
    for (const [path, method, body] of [['/queue', 'GET', undefined], ['/queue/call-next', 'POST', { doctorId: String(doctorId) }],
      [`/queue/${ticketA._id}/start-consultation`, 'PATCH', undefined], [`/queue/${ticketA._id}/complete`, 'PATCH', undefined],
      [`/queue/${ticketA._id}/hold`, 'PATCH', undefined], [`/queue/${ticketA._id}/skip`, 'PATCH', undefined]] as const)
      check((await request(path, a, method, body)).status === 403, `patient staff action ${path} rejected`);
    check((await request(`/queue/${ticketA._id}/start-consultation`, staff, 'PATCH')).status === 409, 'waiting start rejected');
    check((await request('/queue', staff)).body.data.tickets.every((item: { createdAt: string }) => hospitalDate(new Date(item.createdAt)) === today), 'staff queue date scope');
    check((await request('/queue/call-next', staff, 'POST', { doctorId: String(doctorId) })).body.data.ticket._id === ticketA._id, 'staff calls next in sequence');
    const liveB = (await request('/queue/me', b)).body.data.ticket;
    check(liveB.nowServing === ticketA.ticketNumber && liveB.currentPosition === 1 && liveB.status === 'ALMOST_TURN', 'calling shown separately from waiting position one');
    check((await request(`/queue/${ticketA._id}/complete`, staff, 'PATCH')).status === 409, 'calling complete rejected');
    check((await request(`/queue/${ticketA._id}/start-consultation`, staff, 'PATCH')).status === 200, 'calling starts consultation');
    check((await request(`/queue/${ticketA._id}/complete`, staff, 'PATCH')).status === 200, 'consultation completes');
    check((await Appointment.findById(ids[0]))?.status === 'COMPLETED', 'queue completion updates appointment history');
    for (const action of ['hold', 'skip', 'start-consultation', 'complete'])
      check((await request(`/queue/${ticketA._id}/${action}`, staff, 'PATCH')).status === 409, `terminal ${action} rejected`);
    check((await request(`/queue/${tickets[2]._id}/hold`, staff, 'PATCH')).status === 200, 'waiting hold');
    check((await request(`/queue/${tickets[3]._id}/skip`, staff, 'PATCH')).status === 200, 'waiting skip');
    check((await request('/queue/me', c)).body.data.ticket.currentPosition === 0, 'held ticket excluded from positions');
    check((await request('/queue/me', d)).body.data.ticket.status === 'SKIPPED', 'skipped state retained');
    check((await QueueTicket.findById(ticketA._id))?.ticketNumber === ticketA.ticketNumber, 'ticket number stable through transitions');
    check(await Notification.countDocuments({ user: ownerIds[0], category: 'YOUR_TURN' }) === 1, 'one your-turn notification');
    check(await Notification.countDocuments({ user: ownerIds[0], category: 'QUEUE_UPDATE' }) === 2, 'queue transitions produce real updates');
    const foreignNotice = await Notification.findOne({ user: ownerIds[1] });
    check((await request(`/notifications/${foreignNotice!._id}/read`, a, 'PATCH')).status === 403, 'foreign notification read rejected');
    check((await request('/notifications', a)).body.data.notifications.every((item: { user: string }) => item.user === String(ownerIds[0])), 'notification listing ownership');
    check((await request(`/notifications/${createdNotification!._id}/read`, a, 'PATCH')).status === 200, 'mark own notification read');
    check((await request('/notifications/read-all', a, 'PATCH')).status === 200, 'mark all own read');
    check(await Notification.countDocuments({ user: ownerIds[0], isRead: false }) === 0 && await Notification.countDocuments({ user: ownerIds[1], isRead: false }) > 0, 'read-all does not modify second patient');
    const unusedFamily = await request('/family-members', a, 'POST', { name: 'Unused caregiver', relationship: 'Caregiver', dateOfBirth: '1990-01-01', gender: 'Other' });
    check(unusedFamily.status === 201 && (await request(`/family-members/${unusedFamily.body.data.familyMember._id}`, a, 'DELETE')).status === 204, 'unused owned family can be deleted');
    check((await request('/family-members/not-an-id', a, 'PATCH', { name: 'Invalid' })).status === 400, 'invalid family ID rejected');
    const familyAppointmentId = familyBooking.body.data.appointment._id;
    check((await request(`/appointments/${familyAppointmentId}/reschedule`, a, 'PATCH', { date: future, time: '15:00' })).status === 200, 'family reschedule across shared API');
    check(await Notification.countDocuments({ appointment: familyAppointmentId, category: 'APPOINTMENT_UPDATED' }) === 1, 'reschedule notification');
    const cancellations = await Promise.all([request(`/appointments/${familyAppointmentId}/cancel`, a, 'PATCH'), request(`/appointments/${familyAppointmentId}/cancel`, a, 'PATCH')]);
    check(cancellations.map(item => item.status).sort().join(',') === '200,409', 'cancel duplicate guarded');
    check(await Notification.countDocuments({ appointment: familyAppointmentId, category: 'APPOINTMENT_CANCELLED' }) === 1, 'cancel notification deduplicated by successful transaction');
    await QueueTicket.deleteOne({ _id: old._id });
    console.log(`RESULT ${checks} patient application API/Atlas assertions passed`);
    if (process.env.BROWSER_FIXTURE_PATH) {
      await writeFile(process.env.BROWSER_FIXTURE_PATH, JSON.stringify({ phone: phones[0], password, date: today, future,
        doctorId: String(doctorId), departmentId: String(departmentId), familyMemberId: familyId, foreignId: ids[1], staffToken: staff }));
      console.log('BROWSER_FIXTURES_READY');
      await new Promise<void>(resolve => process.stdin.once('data', () => { process.stdin.pause(); resolve(); }));
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await AppointmentReminder.deleteMany({ user: { $in: ownerIds } });
      await Notification.deleteMany({ user: { $in: ownerIds } });
      await QueueTicket.deleteMany({ patient: { $in: ownerIds } });
      await QueueCounter.deleteMany({ scopeKey: { $in: [today, future].map(day => `DEPT:${code}:${day}`) } });
      await Appointment.deleteMany({ patient: { $in: ownerIds } });
      await FamilyMember.deleteMany({ owner: { $in: ownerIds } });
      await User.deleteMany({ _id: { $in: [...ownerIds, staffId] } });
      await Doctor.deleteOne({ _id: doctorId }); await Department.deleteOne({ _id: departmentId });
      for (const [model, filter] of [[Notification, { user: { $in: ownerIds } }], [QueueTicket, { patient: { $in: ownerIds } }],
        [Appointment, { patient: { $in: ownerIds } }], [FamilyMember, { owner: { $in: ownerIds } }]] as const)
        assert.equal(await model.countDocuments(filter), 0);
      assert.equal(await User.countDocuments({ _id: { $in: [...ownerIds, staffId] } }), 0);
      assert.equal(await Doctor.countDocuments({ _id: doctorId }), 0); assert.equal(await Department.countDocuments({ _id: departmentId }), 0);
      assert.equal(await QueueCounter.countDocuments({ scopeKey: `DEPT:${code}:${today}` }), 0);
      console.log('CLEANUP: all isolated patient-app fixtures removed and verified');
    }
    if (process.env.BROWSER_FIXTURE_PATH) await unlink(process.env.BROWSER_FIXTURE_PATH).catch(() => {});
    await new Promise<void>(resolve => server.close(() => resolve())); await mongoose.disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
