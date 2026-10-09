import type {
  DoctorAvailability,
  DoctorAvailabilityDayView,
  DoctorAvailabilityGroup,
  DoctorAvailabilitySlot,
  DoctorAvailabilityView,
  DoctorDepartment,
  DoctorDetails,
  DoctorListFilters,
} from './types';

export const doctorMockDepartments: DoctorDepartment[] = [
  { id: 'dept-cardiology', name: 'Cardiology', code: 'CARD', icon: 'heart-pulse', description: 'Heart and vascular care', roomNumber: 'C-12', doctorCount: 6, isActive: true },
  { id: 'dept-medicine', name: 'General Medicine', code: 'GEN', icon: 'stethoscope', description: 'Primary outpatient consults', roomNumber: 'A-04', doctorCount: 10, isActive: true },
  { id: 'dept-paediatrics', name: 'Paediatrics', code: 'PED', icon: 'baby', description: 'Child health and follow-up care', roomNumber: 'B-07', doctorCount: 4, isActive: true },
];

export const doctorMockData: DoctorDetails[] = [
  {
    id: 'doc-anjali',
    name: 'Dr. Anjali Perera',
    departmentId: 'dept-cardiology',
    department: 'Cardiology',
    title: 'Consultant Cardiologist',
    experienceYears: 12,
    rating: 4.9,
    reviews: 318,
    patientsTreated: '2.8k+',
    fee: 3200,
    about: 'Cardiac OPD and preventive heart care.',
    room: 'C-12',
    languages: ['Sinhala', 'English'],
    active: true,
    availabilityStatus: 'AVAILABLE',
    nextSlot: { label: '09:20 AM', slotId: 'slot-anjali-0920' },
    slotsLeftToday: 4,
    bookedToday: 18,
    shifts: { morning: true, afternoon: true, evening: false },
    roster: { 1: 'active', 2: 'active', 3: 'busy', 4: 'leave', 5: 'active', 6: 'active', 0: 'leave' },
  },
  {
    id: 'doc-madushika',
    name: 'Dr. Madushika Silva',
    departmentId: 'dept-medicine',
    department: 'General Medicine',
    title: 'Consultant Physician',
    experienceYears: 9,
    rating: 4.7,
    reviews: 241,
    patientsTreated: '3.4k+',
    fee: 2500,
    about: 'Acute illness, chronic disease review, and referrals.',
    room: 'A-04',
    languages: ['Sinhala', 'English', 'Tamil'],
    active: true,
    availabilityStatus: 'LIMITED',
    nextSlot: { label: '10:00 AM', slotId: 'slot-madushika-1000' },
    slotsLeftToday: 6,
    bookedToday: 11,
    shifts: { morning: true, afternoon: true, evening: true },
    roster: { 1: 'active', 2: 'busy', 3: 'active', 4: 'active', 5: 'active', 6: 'leave', 0: 'leave' },
  },
  {
    id: 'doc-nimal',
    name: 'Dr. Nimal Fernando',
    departmentId: 'dept-paediatrics',
    department: 'Paediatrics',
    title: 'Senior Paediatrician',
    experienceYears: 15,
    rating: 4.8,
    reviews: 206,
    patientsTreated: '1.9k+',
    fee: 2800,
    about: 'Child health, vaccination, and growth follow-up clinics.',
    room: 'B-07',
    languages: ['Sinhala', 'English'],
    active: true,
    availabilityStatus: 'UNAVAILABLE',
    nextSlot: { label: '11:40 AM', slotId: 'slot-nimal-1140' },
    slotsLeftToday: 3,
    bookedToday: 14,
    shifts: { morning: true, afternoon: false, evening: true },
    roster: { 1: 'active', 2: 'active', 3: 'active', 4: 'busy', 5: 'leave', 6: 'active', 0: 'leave' },
  },
];

export function filterDoctors(filters: DoctorListFilters = {}) {
  const q = filters.q?.trim().toLowerCase();

  return doctorMockData.filter((doctor) => {
    const matchesDepartment = !filters.departmentId || doctor.departmentId === filters.departmentId;
    const matchesRating = !filters.minRating || doctor.rating >= filters.minRating;
    const matchesAvailability = !filters.available || doctor.availabilityStatus !== 'UNAVAILABLE';
    const matchesQuery = !q || [doctor.name, doctor.department, doctor.title, doctor.about].some((value) => value.toLowerCase().includes(q));

    return matchesDepartment && matchesRating && matchesAvailability && matchesQuery;
  });
}

export function getDoctorById(id: string) {
  return doctorMockData.find((doctor) => doctor.id === id) ?? null;
}

export function buildMockAvailabilityView(id: string): DoctorAvailabilityView | null {
  const doctor = getDoctorById(id);
  if (!doctor) return null;

  const days: DoctorAvailabilityDayView[] = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().split('T')[0];
    const dayAvailability = buildDoctorAvailability(id, iso);
    const slots = dayAvailability.groups.flatMap((group) =>
      group.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        startTime: slot.label,
        endTime: slot.label,
        capacity: slot.enabled ? 20 : 20,
        bookedCount: slot.enabled ? 4 : 20,
        available: slot.enabled,
      })),
    );

    const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0);
    const bookedCount = slots.reduce((sum, slot) => sum + slot.bookedCount, 0);

    return {
      date: iso,
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      capacityLeft: Math.max(0, totalCapacity - bookedCount),
      totalCapacity,
      available: dayAvailability.available,
      slots,
    };
  });

  return {
    doctorId: doctor.id,
    doctorName: doctor.name,
    availabilityStatus: doctor.availabilityStatus ?? 'AVAILABLE',
    source: 'mock' as const,
    days,
  };
}

export function buildDoctorAvailability(id: string, date: string): DoctorAvailability {
  const doctor = getDoctorById(id);
  const seed = [...`${id}:${date}`].reduce((total, character) => total + character.charCodeAt(0), 0);

  const buildSlots = (period: DoctorAvailabilityGroup['period'], labels: string[]): DoctorAvailabilitySlot[] =>
    labels.map((label, index) => {
      const enabled = (seed + index + period.length) % 4 !== 0;

      return {
        id: `${id}-${period}-${label.replace(/[^0-9]/g, '')}`,
        label,
        minutes: period === 'morning' ? 15 : period === 'afternoon' ? 20 : 15,
        period,
        enabled,
      };
    });

  const groups: DoctorAvailabilityGroup[] = [
    { period: 'morning', label: 'Morning', slots: buildSlots('morning', ['08:30', '08:45', '09:00', '09:20']) },
    { period: 'afternoon', label: 'Afternoon', slots: buildSlots('afternoon', ['12:30', '12:50', '01:10']) },
    { period: 'evening', label: 'Evening', slots: buildSlots('evening', ['04:00', '04:20', '04:40']) },
  ];

  const capacityLeft = groups.flatMap((group) => group.slots).filter((slot) => slot.enabled).length;

  return {
    date,
    available: Boolean(doctor) && capacityLeft > 0,
    reason: !doctor ? 'Doctor not found' : capacityLeft > 0 ? null : 'Fully booked for the selected date',
    busy: capacityLeft < 4,
    capacityLeft,
    groups,
  };
}