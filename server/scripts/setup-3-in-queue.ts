import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Department } from '../src/models/Department.js';
import { hospitalDate } from '../src/utils/hospitalDate.js';
import { QueueCalculationService } from '../src/services/queueCalculation.service.js';

async function setupExactState() {
  await connectDatabase();
  const todayStr = hospitalDate();
  const slotDateObj = new Date(`${todayStr}T00:00:00.000Z`);
  console.log('Today in Colombo:', todayStr);

  const doctor = await Doctor.findOne({ isActive: true });
  if (!doctor) throw new Error('No active doctor found');
  const department = await Department.findById(doctor.department);
  if (!department) throw new Error('No department found');

  // 1. Clean up user 0771234004 (Nethshan Dulmin)
  const nethshan = await User.findOne({ phone: '0771234004' });
  if (nethshan) {
    await QueueTicket.deleteMany({ patient: nethshan._id });
    await Appointment.deleteMany({ patient: nethshan._id });
    console.log('Reset Nethshan Dulmin (0771234004).');
  }

  // 2. We want EXACTLY 3 patients in Queue:
  // Patient 1: Chathura Bandara (0771234009) -> IN QUEUE
  // Patient 2: Dilani Jayasinghe (0771234008) -> IN QUEUE
  // Patient 3: Nuwan Pradeep (0771234007)     -> IN QUEUE

  // And the remaining patients BOOKED ONLY (NOT in queue):
  // Patient 4: Amali Silva (0771234006)       -> BOOKED ONLY
  // Patient 5: Kasun Perera (0771234005)      -> BOOKED ONLY
  // Patient 6: Nethshan Dulmin (0771234004)   -> BOOKED ONLY

  const inQueuePhones = ['0771234009', '0771234008', '0771234007'];
  const bookedOnlyPhones = ['0771234006', '0771234005', '0771234004'];

  // Clear existing queue tickets for today for clean sequence
  const todayRange = QueueCalculationService.getQueueDayRange();
  await QueueTicket.deleteMany({ createdAt: todayRange });
  await Appointment.updateMany({ appointmentDate: slotDateObj }, { $unset: { queueTicket: 1 } });

  // Create Tickets for the 3 IN-QUEUE patients
  for (let i = 0; i < inQueuePhones.length; i++) {
    const phone = inQueuePhones[i];
    const user = await User.findOne({ phone });
    if (!user) continue;

    let appt = await Appointment.findOne({ patient: user._id, appointmentDate: slotDateObj });
    if (!appt) {
      appt = new Appointment({
        patient: user._id,
        doctor: doctor._id,
        appointmentDate: slotDateObj,
        timeSlot: `0${9 + i}:00`,
        slotId: `${todayStr}-0${9 + i}:00-0${9 + i}:30`,
        slotLabel: `0${9 + i}:00 - 0${9 + i}:30`,
        reason: 'Regular Consultation',
        status: 'BOOKED'
      });
      appt.ref = `OPD-${todayStr.replace(/-/g, '')}-${appt._id.toString().slice(-6).toUpperCase()}`;
      appt.referenceId = appt.ref;
      await appt.save();
    }

    const ticketNumber = `${department.code}-${String(i + 1).padStart(3, '0')}`;
    const ticket = new QueueTicket({
      ticketNumber,
      sequenceNumber: i + 1,
      appointment: appt._id,
      patient: user._id,
      doctor: doctor._id,
      department: department._id,
      status: 'WAITING',
      currentPosition: i + 1,
      estimatedWaitMins: i * 10,
      checkedInAt: new Date()
    });
    await ticket.save();

    appt.queueTicket = ticket._id;
    await appt.save();
    console.log(`[IN QUEUE #${i + 1}] Patient: ${user.name} (${phone}) -> Ticket: ${ticketNumber}`);
  }

  // Ensure BOOKED ONLY appointments exist for Amali, Kasun, and Nethshan
  const bookedSlots = ['14:00', '15:00', '11:30'];
  for (let j = 0; j < bookedOnlyPhones.length; j++) {
    const phone = bookedOnlyPhones[j];
    const user = await User.findOne({ phone });
    if (!user) continue;

    // Delete any lingering tickets
    await QueueTicket.deleteMany({ patient: user._id });

    let appt = await Appointment.findOne({ patient: user._id, appointmentDate: slotDateObj });
    if (!appt) {
      appt = new Appointment({
        patient: user._id,
        doctor: doctor._id,
        appointmentDate: slotDateObj,
        timeSlot: bookedSlots[j],
        slotId: `${todayStr}-${bookedSlots[j]}-30`,
        slotLabel: `${bookedSlots[j]} - Consultation`,
        reason: 'OPD Regular Consultation',
        status: 'BOOKED'
      });
      appt.ref = `OPD-${todayStr.replace(/-/g, '')}-${appt._id.toString().slice(-6).toUpperCase()}`;
      appt.referenceId = appt.ref;
    } else {
      appt.queueTicket = undefined;
      appt.status = 'BOOKED';
    }
    await appt.save();
    console.log(`[BOOKED ONLY] Patient: ${user.name} (${phone}) -> Appt: ${appt.ref} at ${appt.timeSlot} (Checked in: NO)`);
  }

  console.log('\n================ VERIFICATION ================');
  const activeTickets = await QueueTicket.find({
    status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] }
  }).populate('patient');
  console.log(`Active Tickets in Queue: ${activeTickets.length}`);
  activeTickets.forEach(t => {
    const p = t.patient as any;
    console.log(` - Ticket ${t.ticketNumber} | Pos: ${t.currentPosition} | Status: ${t.status} | Patient: ${p?.name} (${p?.phone})`);
  });

  const bookedAppts = await Appointment.find({ appointmentDate: slotDateObj }).populate('patient');
  console.log(`\nTotal Appointments for Today: ${bookedAppts.length}`);
  bookedAppts.forEach(a => {
    const p = a.patient as any;
    console.log(` - Patient: ${p?.name} (${p?.phone}) | Slot: ${a.timeSlot} | HasTicket: ${Boolean(a.queueTicket)}`);
  });

  await disconnectDatabase();
  process.exit(0);
}

setupExactState().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
