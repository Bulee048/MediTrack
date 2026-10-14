import { hospitalDate } from '@/lib/hospitalDate';
import { apiClient } from '@/config/api';
import type { Appointment, Slot } from '../types';
import { mapAppointment, type BackendAppointment } from './appointmentResponse';
interface Envelope<T> { success: boolean; data: T }
interface AvailabilitySlot { date: string; startTime: string; endTime: string; capacity: number; bookedCount: number }
interface Availability { availabilityStatus: string; slots: AvailabilitySlot[] }
async function availability(doctorId: string): Promise<Availability> {
  const res = await apiClient.get<Envelope<Availability>>(`/doctors/${encodeURIComponent(doctorId)}/availability`);
  if (!res.data.success || !Array.isArray(res.data.data?.slots)) throw new Error('Invalid availability response');
  return res.data.data;
}
export const appointmentsApi = {
  list: async (tab: 'upcoming' | 'past' | 'cancelled' = 'upcoming'): Promise<Appointment[]> => {
    const params = tab === 'cancelled' ? { status: 'CANCELLED' } : { [tab]: 'true' };
    const res = await apiClient.get<Envelope<{ appointments: BackendAppointment[] }>>('/appointments/my', { params });
    if (!res.data.success || !Array.isArray(res.data.data?.appointments)) throw new Error('Invalid appointments response');
    const items = res.data.data.appointments.map(mapAppointment);
    return tab === 'upcoming' ? items.filter(a => a.status === 'confirmed' || a.status === 'rescheduled') : tab === 'past' ? items.filter(a => a.status !== 'cancelled') : items;
  },
  detail: async (id: string): Promise<Appointment> => {
    const res = await apiClient.get<Envelope<{ appointment: BackendAppointment }>>(`/appointments/${encodeURIComponent(id)}`);
    if (!res.data.success) throw new Error('Could not load appointment');
    return mapAppointment(res.data.data.appointment);
  },
  reschedule: async (id: string, body: { date: string; slotId: string; timeLabel?: string; reason?: string }): Promise<Appointment> => {
    const appointment = await appointmentsApi.detail(id);
    const slots = await appointmentsApi.getAvailableSlots(appointment.doctorId, body.date);
    const slot = slots.find(s => s.id === body.slotId && s.enabled);
    if (!slot) throw new Error('The selected slot is no longer available');
    const res = await apiClient.patch<Envelope<{ appointment: BackendAppointment }>>(
      `/appointments/${encodeURIComponent(id)}/reschedule`, { date: body.date, time: slot.id });
    if (!res.data.success) throw new Error('Could not reschedule appointment');
    return mapAppointment(res.data.data.appointment);
  },
  cancel: async (id: string): Promise<{ appointment: Appointment }> => {
    const res = await apiClient.patch<Envelope<{ appointment: BackendAppointment }>>(`/appointments/${encodeURIComponent(id)}/cancel`);
    if (!res.data.success) throw new Error('Could not cancel appointment');
    const cancelled = res.data.data?.appointment;
    if (cancelled?._id !== id || cancelled.status !== 'CANCELLED') throw new Error('Invalid cancellation response');
    return { appointment: mapAppointment(cancelled) };
  },
  getAvailableSlots: async (doctorId: string, date: string): Promise<Slot[]> => {
    const data = await availability(doctorId);
    return data.slots.filter(s => typeof s.date === 'string' && s.date.slice(0, 10) === date).map<Slot>(s => ({
      id: s.startTime, label: `${s.startTime} - ${s.endTime}`,
      period: Number(s.startTime.slice(0, 2)) < 12 ? 'morning' : Number(s.startTime.slice(0, 2)) < 17 ? 'afternoon' : 'evening',
      enabled: data.availabilityStatus !== 'UNAVAILABLE' && date >= hospitalDate()
        && Number.isFinite(s.bookedCount) && Number.isFinite(s.capacity) && s.bookedCount < s.capacity,
    })).sort((a, b) => a.id.localeCompare(b.id));
  },
  getAvailableDates: async (doctorId: string): Promise<string[]> => {
    const data = await availability(doctorId);
    if (data.availabilityStatus === 'UNAVAILABLE') return [];
    return [...new Set(data.slots.filter(s => typeof s.date === 'string' && s.date.slice(0, 10) >= hospitalDate()
      && Number.isFinite(s.bookedCount) && Number.isFinite(s.capacity) && s.bookedCount < s.capacity).map(s => s.date.slice(0, 10)))].sort();
  },
};
