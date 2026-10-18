import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Department } from '../src/models/Department.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { QueueService } from '../src/services/queue.service.js';
import { hospitalDate } from '../src/utils/hospitalDate.js';
import bcrypt from 'bcryptjs';

async function main() {
  await connectDatabase();
  const todayStr = hospitalDate();
  console.log('Today in Colombo:', todayStr);

  // 1. Pick a Doctor (e.g. Dr. Nirmal Bandara - Cardiology)
  const doctor = await Doctor.findOne({ isActive: true });
  if (!doctor) throw new Error('No active doctor found');
  console.log(`Using Doctor: ${doctor.name} (${doctor._id})`);

  // 2. Ensure today (todayStr) has availability slots
  const todaySlots = [
    { startTime: '09:00', endTime: '09:30', capacity: 10, bookedCount: 0 },
    { startTime: '10:00', endTime: '10:30', capacity: 10, bookedCount: 0 },
    { startTime: '11:00', endTime: '11:30', capacity: 10, bookedCount: 0 },
    { startTime: '14:00', endTime: '14:30', capacity: 10, bookedCount: 0 },
    { startTime: '15:00', endTime: '15:30', capacity: 10, bookedCount: 0 },
    { startTime: '16:00', endTime: '16:30', capacity: 10, bookedCount: 0 }
  ];

  const slotDateObj = new Date(`${todayStr}T00:00:00.000Z`);

  // Remove existing slots for today to avoid duplicate keys, and add fresh ones
  doctor.availabilitySlots = doctor.availabilitySlots.filter(
    s => s.date.toISOString().slice(0, 10) !== todayStr
  );
  for (const s of todaySlots) {
    doctor.availabilitySlots.push({
      date: slotDateObj,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      bookedCount: 0
    });
  }
  await doctor.save();
  console.log(`Added availability slots for ${todayStr} to ${doctor.name}`);

  // 3. Define the 5 patients
  const phones = [
    '0771234005',
    '0771234006',
    '0771234007',
    '0771234008',
    '0771234009'
  ];
  const names = [
    'Kasun Perera',
    'Amali Silva',
    'Nuwan Pradeep',
    'Dilani Jayasinghe',
    'Chathura Bandara'
  ];
  const passwordPlain = 'password123';
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  const createdTickets = [];

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];
    const name = names[i];
    const email = `patient${phone.slice(-4)}@meditrack.lk`;

    // Upsert User
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        name,
        phone,
        email,
        password: hashedPassword,
        role: 'PATIENT',
        isActive: true
      });
      await user.save();
      console.log(`Created Patient: ${name} (${phone})`);
    } else {
      user.password = hashedPassword;
      user.isActive = true;
      user.name = name;
      await user.save();
      console.log(`Updated Patient: ${name} (${phone})`);
    }

    // Clean up existing appointments/tickets for today to allow fresh booking & check-in
    const oldAppointments = await Appointment.find({
      patient: user._id,
      appointmentDate: slotDateObj
    });
    for (const appt of oldAppointments) {
      if (appt.queueTicket) {
        await QueueTicket.deleteMany({ _id: appt.queueTicket });
      }
      await Appointment.deleteOne({ _id: appt._id });
    }
    await QueueTicket.deleteMany({ patient: user._id });

    // Pick time slot for each patient (09:00, 10:00, 11:00, 14:00, 15:00)
    const slot = todaySlots[i % todaySlots.length];
    const time = slot.startTime;
    const label = `${time} - ${slot.endTime}`;

    const appointment = new Appointment({
      patient: user._id,
      doctor: doctor._id,
      appointmentDate: slotDateObj,
      timeSlot: time,
      slotId: `${todayStr}-${time}-${slot.endTime}`,
      slotLabel: label,
      reason: 'OPD Regular Consultation',
      status: 'BOOKED'
    });
    appointment.ref = `OPD-${todayStr.replace(/-/g, '')}-${appointment._id.toString().slice(-6).toUpperCase()}`;
    appointment.referenceId = appointment.ref;
    await appointment.save();

    console.log(`Booked appointment for ${name}: Ref ${appointment.ref} at ${time}`);

    // Check in to generate Queue Ticket
    const ticket = await QueueService.checkIn(user._id.toString(), appointment._id.toString());
    console.log(`Checked In ${name}: Ticket #${ticket.ticketNumber} (Pos: ${ticket.currentPosition}, Status: ${ticket.status})`);
    createdTickets.push({
      name,
      phone,
      password: passwordPlain,
      ticketNumber: ticket.ticketNumber,
      position: ticket.currentPosition,
      status: ticket.status
    });
  }

  console.log('\n=============================================');
  console.log('SUCCESSFULLY SEEDED 5 PATIENTS & QUEUE TICKETS:');
  console.log('Doctor:', doctor.name, '| Room:', doctor.roomNumber);
  console.table(createdTickets);
  console.log('=============================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('ERROR SEEDING PATIENTS:', err);
  process.exit(1);
});
