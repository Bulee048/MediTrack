import { hospitalDate } from '@/lib/hospitalDate';
import { getDoctor, getDoctorAvailability, listDoctors } from './doctors.api';
import type {
  DoctorAvailabilityView,
  DoctorListFilters,
  DoctorProfileResult,
  DoctorSummary,
  DoctorsResult,
} from './types';



export async function fetchDoctors(filters: DoctorListFilters = {}): Promise<DoctorsResult> {
  return { doctors: await listDoctors(filters), source: 'api' };
}

export async function fetchDoctor(id: string): Promise<DoctorSummary | null> {
  return getDoctor(id);
}

export async function fetchDoctorProfile(id: string): Promise<DoctorProfileResult> {
  return { doctor: await getDoctor(id), source: 'api' };
}

export async function fetchDoctorAvailability(id: string, date: string): Promise<DoctorAvailabilityView | null> {
  const data = await getDoctorAvailability(id, date);
  const grouped = data.slots.reduce<Record<string, typeof data.slots>>((acc, slot) => {
    const key = slot.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const days = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([day, slots]) => {
    const convertedSlots = slots.map((slot) => ({
      id: `${slot.date}-${slot.startTime}-${slot.endTime}`,
      label: `${slot.startTime} - ${slot.endTime}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      available: slot.bookedCount < slot.capacity && data.availabilityStatus !== 'UNAVAILABLE' && day >= hospitalDate(),
    }));
    const totalCapacity = convertedSlots.reduce((sum, slot) => sum + slot.capacity, 0);
    const bookedCount = convertedSlots.reduce((sum, slot) => sum + slot.bookedCount, 0);

    return {
      date: day,
      label: new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      capacityLeft: Math.max(0, totalCapacity - bookedCount),
      totalCapacity,
      available: convertedSlots.some((slot) => slot.available),
      slots: convertedSlots,
    };
  });

  return {
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    availabilityStatus: data.availabilityStatus,
    source: 'api',
    days,
  };
}
