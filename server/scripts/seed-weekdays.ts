import { connectDatabase } from '../src/config/database.js';
import { Doctor } from '../src/models/Doctor.js';

async function seedDoctorWeekdays() {
  await connectDatabase();

  // Upcoming 5 weekdays:
  // Mon 2026-10-19, Tue 2026-10-20, Wed 2026-10-21, Thu 2026-10-22, Fri 2026-10-23
  const weekdays = [
    '2026-10-19', // Monday
    '2026-10-20', // Tuesday
    '2026-10-21', // Wednesday
    '2026-10-22', // Thursday
    '2026-10-23'  // Friday
  ];

  const dailyTimeSlots = [
    { startTime: '09:00', endTime: '09:30', capacity: 10, bookedCount: 0 },
    { startTime: '10:00', endTime: '10:30', capacity: 10, bookedCount: 0 },
    { startTime: '11:00', endTime: '11:30', capacity: 10, bookedCount: 0 },
    { startTime: '14:00', endTime: '14:30', capacity: 10, bookedCount: 0 },
    { startTime: '15:00', endTime: '15:30', capacity: 10, bookedCount: 0 },
    { startTime: '16:00', endTime: '16:30', capacity: 10, bookedCount: 0 }
  ];

  const doctors = await Doctor.find({ isActive: true });
  console.log(`Found ${doctors.length} doctors to update with upcoming weekdays...`);

  for (const doc of doctors) {
    // Retain existing slots that are not in the new target dates
    const existingFiltered = doc.availabilitySlots.filter(
      slot => !weekdays.includes(slot.date.toISOString().slice(0, 10))
    );

    for (const dateStr of weekdays) {
      const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
      for (const slot of dailyTimeSlots) {
        existingFiltered.push({
          date: dateObj,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          bookedCount: 0
        });
      }
    }

    doc.availabilitySlots = existingFiltered;
    doc.availabilityStatus = 'AVAILABLE';
    await doc.save();
    console.log(`Updated ${doc.name} with 5 weekdays (${weekdays.join(', ')})`);
  }

  console.log('\n=============================================');
  console.log('Successfully added 5 upcoming weekdays to all active doctors:');
  weekdays.forEach(d => console.log(' - ' + d + ' (' + new Date(d).toLocaleDateString('en-US', { weekday: 'long' }) + ')'));
  console.log('=============================================\n');

  process.exit(0);
}

seedDoctorWeekdays().catch(err => {
  console.error('Error seeding weekdays:', err);
  process.exit(1);
});
