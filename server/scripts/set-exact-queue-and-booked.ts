import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { Notification } from '../src/models/Notification.js';
import { Doctor } from '../src/models/Doctor.js';
import { hospitalDate } from '../src/utils/hospitalDate.js';

async function updateState() {
  await connectDatabase();
  const todayStr = hospitalDate();
  console.log('Today is:', todayStr);

  const nethshan = await User.findOne({ phone: '0771234004' });
  if (!nethshan) throw new Error('User 0771234004 not found');
  console.log(`Found Nethshan Dulmin (${nethshan._id})`);

  // 1. Clear out Nethshan's previous appointments, tickets, and notifications
  await QueueTicket.deleteMany({ patient: nethshan._id });
  await Appointment.deleteMany({ patient: nethshan._id });
  await Notification.deleteMany({ recipient: nethshan._id });
  console.log('Cleared all previous appointments, tickets, and notifications for Nethshan Dulmin (0771234004).');

  // 2. Doctor (e.g. Dr. Nirmal Bandara)
  const doctor = await Doctor.findOne({ isActive: true });
  if (!doctor) throw new Error('No active doctor found');
  console.log(`Using Doctor: ${doctor.name} (${doctor._id})`);

  // 3. Remove queue tickets for 0771234005 and 0771234006 so they are ONLY BOOKED (not checked in)
  const p5 = await User.findOne({ phone: '0771234005' });
  const p6 = await User.findOne({ phone: '0771234006' });
  
  if (p5) {
    await QueueTicket.deleteMany({ patient: p5._id });
    await Appointment.updateMany({ patient: p5._id }, { $unset: { queueTicket: 1 } });
    console.log('Removed queue tickets for Kasun Perera (0771234005) -> Only Booked');
  }

  if (p6) {
    await QueueTicket.deleteMany({ patient: p6._id });
    await Appointment.updateMany({ patient: p6._id }, { $unset: { queueTicket: 1 } });
    console.log('Removed queue tickets for Amali Silva (0771234006) -> Only Booked');
  }

  // Ensure remaining 3 queue tickets for today are properly re-indexed and WAITING
  // Active patients in queue: 0771234009, 0771234008, 0771234007
  const activeTodayTickets = await QueueTicket.find({
    date: todayStr,
    doctor: doctor._id,
    status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING'] }
  }).sort({ ticketNumber: 1 });

  console.log(`\nRemaining in-queue tickets count: ${activeTodayTickets.length}`);
  for (let idx = 0; idx < activeTodayTickets.length; idx++) {
    const t = activeTodayTickets[idx];
    t.currentPosition = idx + 1;
    t.status = 'WAITING';
    t.estimatedWaitMins = idx * 10;
    await t.save();
    console.log(`Ticket ${t.ticketNumber}: Position ${t.currentPosition}, Status: ${t.status}`);
  }

  // 4. Create a fresh clean BOOKED appointment for Nethshan Dulmin (0771234004) for today
  const slotDateObj = new Date(`${todayStr}T00:00:00.000Z`);
  const nethshanAppt = new Appointment({
    patient: nethshan._id,
    doctor: doctor._id,
    appointmentDate: slotDateObj,
    timeSlot: '11:30',
    slotId: `${todayStr}-11:30-12:00`,
    slotLabel: '11:30 - 12:00',
    reason: 'Cardiology General Consultation',
    status: 'BOOKED'
  });
  nethshanAppt.ref = `OPD-${todayStr.replace(/-/g, '')}-${nethshanAppt._id.toString().slice(-6).toUpperCase()}`;
  nethshanAppt.referenceId = nethshanAppt.ref;
  await nethshanAppt.save();

  console.log(`Created fresh BOOKED appointment for Nethshan Dulmin: Ref ${nethshanAppt.ref} at 11:30 (Checked in: NO).`);

  // Verification summaries
  const allTodayAppointments = await Appointment.find({ appointmentDate: slotDateObj }).populate('patient');
  console.log('\n================ TODAY APPOINTMENTS ================');
  for (const a of allTodayAppointments) {
    const p = a.patient as any;
    console.log(`- Patient: ${p?.name} (${p?.phone}) | Ref: ${a.ref || a.referenceId} | Slot: ${a.timeSlot} | CheckedIn: ${Boolean(a.queueTicket)} | Status: ${a.status}`);
  }

  const allTodayQueue = await QueueTicket.find({ date: todayStr }).populate('patient');
  console.log('\n================ TODAY LIVE QUEUE TICKETS (EXACTLY 3) ================');
  for (const q of allTodayQueue) {
    const p = q.patient as any;
    console.log(`- Ticket #${q.ticketNumber} | Patient: ${p?.name} (${p?.phone}) | Position: ${q.currentPosition} | Status: ${q.status}`);
  }

  await disconnectDatabase();
  console.log('\nAll requirements completed successfully!');
  process.exit(0);
}

updateState().catch(err => {
  console.error('Error updating state:', err);
  process.exit(1);
});
