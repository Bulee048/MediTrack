import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Department } from '../src/models/Department.js';
import { FamilyMember } from '../src/models/FamilyMember.js';
import { Appointment } from '../src/models/Appointment.js';

async function main() {
  if (process.env.TEST_DNS_SERVERS) setServers(process.env.TEST_DNS_SERVERS.split(','));
  // Opt-in real database/API tests. Every fixture has an exact, fresh ID; cleanup
  // never relies on broad name/date filters or modifies existing doctors' slots.
  if (process.env.RUN_ATLAS_TESTS !== 'true') throw new Error('Set RUN_ATLAS_TESTS=true to authorize isolated database fixtures');
  const ids = Array.from({ length: 4 }, () => new mongoose.Types.ObjectId());
  const [patientA, patientB, doctorId, departmentId] = ids;
  const password = randomBytes(20).toString('hex');
  const phones = ['8', '9'].map(prefix => prefix + Date.now().toString());
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  let base = '';
  let checks = 0;
  const server = app.listen(process.env.BROWSER_FIXTURE_PATH ? 5004 : 0, '127.0.0.1');
  async function request(path: string, token = '', method = 'GET', body?: object) {
    const response = await fetch(`${base}/api${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() as any };
  }
  function check(condition: unknown, name: string) { assert.ok(condition, name); checks++; console.log(`PASS ${name}`); }
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
    await User.create(ids.slice(0, 2).map((_id, i) => ({ _id, name: `Appointment audit patient ${i + 1}`, phone: phones[i],
      role: 'PATIENT', passwordHash: bcrypt.hashSync(password, 10), isActive: true })));
    await Department.create({ _id: departmentId, name: 'Appointment Audit Department', code: `AUDIT-${randomUUID()}`, isActive: true });
    await Doctor.create({ _id: doctorId, name: 'Appointment Audit Doctor', department: departmentId, title: 'Consultant',
      consultationFee: 1500, roomNumber: 'Audit room', isActive: true, availabilityStatus: 'AVAILABLE',
      availabilitySlots: times.map((time, i) => ({ date: new Date(date), startTime: time, endTime: `${String(i + 8).padStart(2, '0')}:30`, capacity: i === 4 ? 1 : 4, bookedCount: 0 })) });
    const loginA = await request('/auth/login', '', 'POST', { phone: phones[0], password });
    const loginB = await request('/auth/login', '', 'POST', { phone: phones[1], password });
    const a = loginA.body.data.token, b = loginB.body.data.token;
    check(loginA.status === 200 && loginB.status === 200 && a && b, 'real patient login');
    check((await request('/appointments/my?upcoming=true', a)).body.data.appointments.length === 0, 'new account has an authentic empty appointment list');
    const book = (token: string, time: string, familyMemberId?: string) => request('/appointments', token, 'POST', { doctorId: String(doctorId), date, time, ...(familyMemberId ? { familyMemberId } : {}) });
    const own = await book(a, times[0]);
    const foreign = await book(b, times[1]);
    check(own.status === 201 && foreign.status === 201, 'booking persists real appointments');
    const ownId = own.body.data.appointment._id, foreignId = foreign.body.data.appointment._id;
    check((await request(`/appointments/${ownId}`)).status === 401, 'unauthenticated details rejected');
    check((await request(`/appointments/${ownId}/cancel`, '', 'PATCH')).status === 401, 'unauthenticated cancel rejected');
    check((await request(`/appointments/${ownId}/reschedule`, '', 'PATCH', { date, time: times[2] })).status === 401, 'unauthenticated reschedule rejected');
    check((await request('/appointments/my')).status === 401, 'unauthenticated listing rejected');
    check((await request(`/appointments/${foreignId}`, a)).status === 403, 'foreign appointment read rejected');
    check((await request(`/appointments/${foreignId}/cancel`, a, 'PATCH')).status === 403, 'foreign cancellation rejected');
    check((await request(`/appointments/${foreignId}/reschedule`, a, 'PATCH', { date, time: times[2] })).status === 403, 'foreign reschedule rejected');
    const listed = await request('/appointments/my?upcoming=true', a);
    check(listed.status === 200 && listed.body.data.appointments.every((item: any) => item.patient === String(patientA)), 'list scoped to authenticated account');
    check((await request('/appointments', a, 'POST', { doctorId: String(doctorId), date, time: times[2], patientId: String(patientB) })).status === 400, 'browser ownership field rejected');
    check((await request('/appointments', a, 'POST', { doctorId: String(doctorId), date: '2027-02-30', time: times[2] })).status === 400, 'invalid calendar date rejected');
    check((await request('/appointments', a, 'POST', { doctorId: String(doctorId), date: '2000-01-01', time: times[2] })).status === 400, 'past date rejected');
    const familyInput = { name: 'Audit Relative', relationship: 'Caregiver', dateOfBirth: '1990-01-01', gender: 'Other' };
    const fa = await request('/family-members', a, 'POST', familyInput);
    const fb = await request('/family-members', b, 'POST', familyInput);
    check(fa.status === 201 && fb.status === 201, 'family/caregiver creation');
    const faId = fa.body.data.familyMember._id, fbId = fb.body.data.familyMember._id;
    check((await request('/family-members', a)).body.data.familyMembers.every((m: any) => m.owner === String(patientA)), 'family list scoped to account');
    check((await request(`/family-members/${fbId}`, a, 'PATCH', { name: 'Illegal edit' })).status === 404, 'foreign family edit rejected');
    check((await request(`/family-members/${fbId}`, a, 'DELETE')).status === 404, 'foreign family delete rejected');
    check((await request('/family-members')).status === 401, 'unauthenticated family access rejected');
    check((await request(`/family-members/${faId}`, a, 'PATCH', { phone: '' })).status === 200, 'optional family phone can be cleared');
    check((await book(a, times[2], fbId)).status === 403, 'foreign family booking rejected');
    check((await request(`/appointments/${ownId}/reschedule`, a, 'PATCH', { date, time: times[2], familyMemberId: fbId })).status === 400, 'reschedule cannot replace family/ownership fields');
    const familyBooking = await book(a, times[0], faId);
    check(familyBooking.status === 201 && familyBooking.body.data.appointment.familyMember._id === faId, 'self and owned family can share a multi-capacity slot');
    const familyAppointmentId = familyBooking.body.data.appointment._id;
    await FamilyMember.updateOne({ _id: faId }, { $set: { owner: patientB } });
    check((await request(`/appointments/${familyAppointmentId}/reschedule`, a, 'PATCH', { date, time: times[2] })).status === 403, 'reschedule revalidates existing family ownership');
    await FamilyMember.updateOne({ _id: faId }, { $set: { owner: patientA } });
    check((await request(`/family-members/${faId}`, a, 'DELETE')).status === 409, 'family history cannot be orphaned');
    check((await request(`/appointments/${familyAppointmentId}/reschedule`, a, 'PATCH', { date, time: times[2] })).status === 200, 'authorized family reschedule');
    const duplicate = await Promise.all([book(a, times[3]), book(a, times[3])]);
    check(duplicate.map(r => r.status).sort().join(',') === '201,409', 'concurrent duplicate booking admits exactly one');
    const competing = await Promise.all([book(a, times[4]), book(b, times[4])]);
    check(competing.map(r => r.status).sort().join(',') === '201,409', 'concurrent last-slot booking admits exactly one');
    const before = await Doctor.findById(doctorId).lean();
    const failed = await request(`/appointments/${ownId}/reschedule`, a, 'PATCH', { date, time: times[4] });
    check(failed.status === 409, 'full-slot reschedule rejected');
    check((await Appointment.findById(ownId))?.timeSlot === times[0], 'failed reschedule preserves original appointment');
    const after = await Doctor.findById(doctorId).lean();
    check(JSON.stringify(before?.availabilitySlots) === JSON.stringify(after?.availabilitySlots), 'failed reschedule leaves all capacities unchanged');
    const moved = await request(`/appointments/${ownId}/reschedule`, a, 'PATCH', { date, time: times[5] });
    check(moved.status === 200 && moved.body.data.appointment.status === 'RESCHEDULED' && moved.body.data.appointment.timeSlot === times[5], 'reschedule returns authoritative populated appointment');
    const cancelled = await Promise.all([request(`/appointments/${ownId}/cancel`, a, 'PATCH'), request(`/appointments/${ownId}/cancel`, a, 'PATCH')]);
    check(cancelled.map(r => r.status).sort().join(',') === '200,409', 'duplicate cancellation releases slot once');
    check((await Doctor.findById(doctorId))?.availabilitySlots.find(s => s.startTime === times[5])?.bookedCount === 0, 'cancel capacity release');
    check((await request(`/appointments/${ownId}/reschedule`, a, 'PATCH', { date, time: times[6] })).status === 409, 'terminal appointment reschedule rejected');
    await Doctor.updateOne({ _id: doctorId }, { $set: { availabilityStatus: 'UNAVAILABLE' } });
    check((await book(a, times[9])).status === 400, 'unavailable doctor cannot be booked');
    await Doctor.updateOne({ _id: doctorId }, { $set: { availabilityStatus: 'AVAILABLE' } });
    const disposable = await request('/family-members', a, 'POST', { ...familyInput, name: 'Deletion race relative' });
    const disposableId = disposable.body.data.familyMember._id;
    const familyRace = await Promise.all([book(a, times[9], disposableId), request(`/family-members/${disposableId}`, a, 'DELETE')]);
    check((familyRace[0].status === 201 && familyRace[1].status === 409) || (familyRace[0].status === 403 && familyRace[1].status === 200), 'family booking/delete race cannot orphan an appointment');
    const raceA = await book(a, times[6]), raceB = await book(b, times[7]);
    await Doctor.updateOne({ _id: doctorId }, { $set: { 'availabilitySlots.8.capacity': 1 } });
    const rescheduleRace = await Promise.all([request(`/appointments/${raceA.body.data.appointment._id}/reschedule`, a, 'PATCH', { date, time: times[8] }), request(`/appointments/${raceB.body.data.appointment._id}/reschedule`, b, 'PATCH', { date, time: times[8] })]);
    check(rescheduleRace.map(r => r.status).sort().join(',') === '200,409', 'concurrent last-slot reschedule admits exactly one');
    const completed = await Appointment.create({ patient: patientA, doctor: doctorId, appointmentDate: new Date(), timeSlot: '07:00', status: 'COMPLETED' });
    const past = await request('/appointments/my?past=true', a), upcoming = await request('/appointments/my?upcoming=true', a);
    check(past.body.data.appointments.some((item: any) => item._id === String(completed._id)), 'completed today appears in Past');
    check(upcoming.body.data.appointments.every((item: any) => ['BOOKED', 'RESCHEDULED'].includes(item.status)), 'Upcoming contains only active bookings');
    const later = await Appointment.create({ patient: patientA, doctor: doctorId, appointmentDate: new Date(Date.now() + 14 * 86400000), timeSlot: '07:00', status: 'BOOKED' });
    const sorted = (await request('/appointments/my?upcoming=true', a)).body.data.appointments;
    check(sorted.at(-1)._id === String(later._id), 'Upcoming nearest date first');
    const queueId = new mongoose.Types.ObjectId();
    await Appointment.updateOne({ _id: familyAppointmentId }, { $set: { queueTicket: queueId } });
    check((await request(`/appointments/${familyAppointmentId}/cancel`, a, 'PATCH')).status === 409, 'checked-in cancel remains blocked without touching queue');
    check((await request(`/appointments/${familyAppointmentId}/reschedule`, a, 'PATCH', { date, time: times[9] })).status === 409, 'checked-in reschedule remains blocked');
    await Appointment.updateOne({ _id: familyAppointmentId }, { $unset: { queueTicket: '' } });
    console.log(`RESULT ${checks} API/Atlas assertions passed`);
    if (process.env.BROWSER_FIXTURE_PATH) {
      await writeFile(process.env.BROWSER_FIXTURE_PATH, JSON.stringify({ phone: phones[0], password, date,
        doctorId: String(doctorId), appointmentId: familyAppointmentId, foreignId, familyMemberId: faId }));
      console.log('BROWSER_FIXTURES_READY (send cleanup on stdin when done)');
      await new Promise<void>(resolve => {
        const finish = () => { process.removeListener('SIGINT', finish); process.removeListener('SIGTERM', finish); resolve(); };
        process.once('SIGINT', finish); process.once('SIGTERM', finish); process.stdin.once('data', finish);
      });
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await Appointment.deleteMany({ patient: { $in: ids.slice(0, 2) } });
      await FamilyMember.deleteMany({ owner: { $in: ids.slice(0, 2) } });
      await Doctor.deleteOne({ _id: doctorId });
      await Department.deleteOne({ _id: departmentId });
      await User.deleteMany({ _id: { $in: ids.slice(0, 2) } });
      assert.equal(await Appointment.countDocuments({ patient: { $in: ids.slice(0, 2) } }), 0);
      assert.equal(await FamilyMember.countDocuments({ owner: { $in: ids.slice(0, 2) } }), 0);
      assert.equal(await Doctor.countDocuments({ _id: doctorId }), 0);
      assert.equal(await Department.countDocuments({ _id: departmentId }), 0);
      assert.equal(await User.countDocuments({ _id: { $in: ids.slice(0, 2) } }), 0);
      console.log('CLEANUP: isolated fixture records removed');
    }
    await new Promise<void>(resolve => server.close(() => resolve()));
    await mongoose.disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
