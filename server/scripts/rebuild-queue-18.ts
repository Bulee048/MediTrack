import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Department } from '../src/models/Department.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { QueueCounter } from '../src/models/QueueCounter.js';
import { QueueCalculationService } from '../src/services/queueCalculation.service.js';
import bcrypt from 'bcryptjs';

async function rebuildQueueFor18th() {
  await connectDatabase();
  const targetDateStr = '2026-10-18';
  console.log(`Setting up clean Queue for Date: ${targetDateStr}...`);

  // 1. Doctor: Dr. Nirmal Bandara (Cardiology)
  const doctor = await Doctor.findOne({ isActive: true });
  if (!doctor) throw new Error('No doctor found');
  const department = await Department.findById(doctor.department);
  if (!department) throw new Error('No department found');
  console.log(`Doctor: ${doctor.name} (${department.name})`);

  // 2. Add availability slots on 2026-10-18
  const dateObj = new Date(`${targetDateStr}T00:00:00.000Z`);
  const dailySlots = [
    { startTime: '09:00', endTime: '09:30', capacity: 20, bookedCount: 0 },
    { startTime: '10:00', endTime: '10:30', capacity: 20, bookedCount: 0 },
    { startTime: '11:00', endTime: '11:30', capacity: 20, bookedCount: 0 },
    { startTime: '14:00', endTime: '14:30', capacity: 20, bookedCount: 0 },
    { startTime: '15:00', endTime: '15:30', capacity: 20, bookedCount: 0 },
    { startTime: '16:00', endTime: '16:30', capacity: 20, bookedCount: 0 }
  ];

  doctor.availabilitySlots = doctor.availabilitySlots.filter(
    s => s.date.toISOString().slice(0, 10) !== targetDateStr
  );
  for (const s of dailySlots) {
    doctor.availabilitySlots.push({
      date: dateObj,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      bookedCount: 0
    });
  }
  await doctor.save();
  console.log(`Slots for ${targetDateStr} ensured for ${doctor.name}`);

  // 3. Clear existing active queue tickets for this doctor / department to create a fresh clean queue
  const delQueueRes = await QueueTicket.deleteMany({
    doctor: doctor._id,
    status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] }
  });
  console.log(`Cleared ${delQueueRes.deletedCount} old active queue tickets for ${doctor.name}`);

  // Reset sequence counter for this date
  const scopeKey = `DEPT:${department.code.toUpperCase()}:${targetDateStr}`;
  await QueueCounter.deleteMany({ scopeKey });

  // 4. Ensure 0771234004 exists and is 1st in the list
  const hashedPassword = await bcrypt.hash('password123', 10);
  let p004 = await User.findOne({ phone: '0771234004' });
  if (!p004) {
    p004 = new User({
      name: 'Nimal Perera',
      phone: '0771234004',
      email: 'patient004@meditrack.lk',
      passwordHash: hashedPassword,
      role: 'PATIENT',
      isActive: true
    });
    await p004.save();
    console.log('Created Patient 0771234004 (Nimal Perera)');
  } else {
    p004.passwordHash = hashedPassword;
    p004.isActive = true;
    await p004.save();
    console.log('Found Patient 0771234004 (Nimal Perera)');
  }

  // Retrieve ALL active patients from DB and ensure their passwordHash is password123
  const allOtherPatients = await User.find({
    role: 'PATIENT',
    phone: { $ne: '0771234004' },
    isActive: true
  }).sort({ createdAt: -1 });

  for (const p of allOtherPatients) {
    p.passwordHash = hashedPassword;
    await p.save();
  }

  // 0771234004 MUST BE 1ST
  const patientList = [p004, ...allOtherPatients];
  console.log(`Total patients being queued: ${patientList.length}. 1st is: ${patientList[0].name} (${patientList[0].phone})`);

  // Clear previous tickets/appointments on 2026-10-18 for these patients
  for (const p of patientList) {
    const oldAppts = await Appointment.find({ patient: p._id, appointmentDate: dateObj });
    for (const a of oldAppts) {
      if (a.queueTicket) await QueueTicket.deleteOne({ _id: a.queueTicket });
      await Appointment.deleteOne({ _id: a._id });
    }
  }

  // 5. Generate appointments & tickets
  const queueResult = [];
  const fakeTicketCreatedAt = new Date(`${targetDateStr}T09:00:00+05:30`);

  for (let i = 0; i < patientList.length; i++) {
    const patient = patientList[i];
    const slot = dailySlots[i % dailySlots.length];
    const time = slot.startTime;
    const label = `${time} - ${slot.endTime}`;

    const appointment = new Appointment({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: dateObj,
      timeSlot: time,
      slotId: `${targetDateStr}-${time}-${slot.endTime}`,
      slotLabel: label,
      reason: 'OPD Consultation',
      status: 'BOOKED'
    });
    appointment.ref = `OPD-${targetDateStr.replace(/-/g, '')}-${appointment._id.toString().slice(-6).toUpperCase()}`;
    appointment.referenceId = appointment.ref;
    await appointment.save();

    // Generate sequence
    const { sequence, ticketNumber } = await QueueCalculationService.getNextSequence(department.code, targetDateStr);

    const ticket = new QueueTicket({
      ticketNumber,
      sequenceNumber: sequence,
      appointment: appointment._id,
      patient: patient._id,
      doctor: doctor._id,
      department: department._id,
      status: sequence <= 2 ? 'ALMOST_TURN' : 'WAITING',
      currentPosition: sequence,
      estimatedWaitMins: (sequence - 1) * 10,
      checkedInAt: fakeTicketCreatedAt,
      createdAt: fakeTicketCreatedAt,
      updatedAt: fakeTicketCreatedAt
    });

    await ticket.save();
    appointment.queueTicket = ticket._id;
    await appointment.save();

    queueResult.push({
      Pos: ticket.currentPosition,
      Ticket: ticket.ticketNumber,
      Name: patient.name,
      Phone: patient.phone,
      Status: ticket.status
    });
  }

  console.log('\n======================================================');
  console.log(`NEW QUEUE FOR ${targetDateStr} CREATED SUCCESSFULLY:`);
  console.log(`Doctor: ${doctor.name} (${department.name} - Room ${doctor.roomNumber})`);
  console.table(queueResult.slice(0, 15));
  if (queueResult.length > 15) console.log(`... and ${queueResult.length - 15} more patients in queue.`);
  console.log('======================================================\n');

  process.exit(0);
}

rebuildQueueFor18th().catch(err => {
  console.error('Error rebuilding queue:', err);
  process.exit(1);
});
