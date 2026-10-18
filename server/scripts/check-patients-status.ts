import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
import { QueueEvent } from '../src/models/QueueEvent.js';
import { Notification } from '../src/models/Notification.js';

async function main() {
  await connectDatabase();

  const user = await User.findOne({ phone: '0771234004' });
  console.log('User found:', user ? `${user.name} (${user.phone}) [ID: ${user._id}]` : 'NOT FOUND');

  const phones = [
    '0771234004',
    '0771234005',
    '0771234006',
    '0771234007',
    '0771234008',
    '0771234009'
  ];

  for (const p of phones) {
    const u = await User.findOne({ phone: p });
    if (u) {
      const appts = await Appointment.find({ patient: u._id });
      const tickets = await QueueTicket.find({ patient: u._id });
      console.log(`\nPatient ${u.name} (${p}):`);
      console.log(`  Appointments (${appts.length}):`, appts.map(a => ({ id: a._id, status: a.status, ref: a.ref || a.referenceId, slot: a.timeSlot, ticket: a.queueTicket })));
      console.log(`  QueueTickets (${tickets.length}):`, tickets.map(t => ({ id: t._id, num: t.ticketNumber, status: t.status })));
    }
  }

  await disconnectDatabase();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
