import { apiClient } from '@/config/api';
import type { Appointment, AppointmentStatus, Slot } from '../types';
type Person = string | { _id: string; name: string };
interface BackendAppointment {
  _id: string; patient: Person; familyMember?: Person;
  doctor: string | { _id: string; name: string; roomNumber?: string; consultationFee?: number;
    department: { _id: string; name: string } };
  appointmentDate: string; timeSlot: string;
  status: 'BOOKED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  queueTicket?: string; reason?: string; createdAt: string; updatedAt: string;
}
interface Envelope<T> { success: boolean; data: T }
interface AvailabilitySlot { date: string; startTime: string; endTime: string; capacity: number; bookedCount: number }
const statuses: Record<BackendAppointment['status'], AppointmentStatus> = {
  BOOKED: 'confirmed', RESCHEDULED: 'rescheduled', CANCELLED: 'cancelled', COMPLETED: 'completed',
};
const personId = (p: Person) => typeof p === 'string' ? p : p._id;
const personName = (p: Person) => typeof p === 'string' ? '' : p.name;
// Payment and live queue data are not supplied by the appointment contract.
function mapAppointment(a: BackendAppointment): Appointment {
  if (!a?._id || !statuses[a.status] || typeof a.doctor !== 'object' || !a.doctor?._id) throw new Error('Invalid appointment response');
  return {
    id: a._id, ref: a._id, patientId: personId(a.patient), patientName: personName(a.patient),
    patientIdRef: personId(a.patient), bookedForSelf: !a.familyMember,
    familyMemberId: a.familyMember ? personId(a.familyMember) : undefined,
    familyMemberName: a.familyMember ? personName(a.familyMember) : undefined,
    doctorId: a.doctor._id, doctorName: a.doctor.name,
    departmentId: a.doctor.department._id, department: a.doctor.department.name,
    room: a.doctor.roomNumber ?? 'Not provided', date: a.appointmentDate.slice(0, 10),
    time: a.timeSlot, slotId: a.timeSlot, status: statuses[a.status],
    checkedIn: Boolean(a.queueTicket),
    paymentStatus: 'unknown', amount: a.doctor.consultationFee ?? 0,
    reason: a.reason, createdAt: a.createdAt, updatedAt: a.updatedAt,
  };
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
    const current = await appointmentsApi.detail(id);
    const res = await apiClient.patch<Envelope<{ appointment: BackendAppointment }>>(`/appointments/${encodeURIComponent(id)}/cancel`);
    if (!res.data.success) throw new Error('Could not cancel appointment');
    const cancelled = res.data.data?.appointment;
    if (cancelled?._id !== id || cancelled.status !== 'CANCELLED') throw new Error('Invalid cancellation response');
    // Cancellation returns an unpopulated document; preserve the previously fetched display data.
    return { appointment: { ...current, status: 'cancelled', updatedAt: cancelled.updatedAt } };
  },
  getAvailableSlots: async (doctorId: string, date: string): Promise<Slot[]> => {
    const res = await apiClient.get<Envelope<{ slots: AvailabilitySlot[] }>>(`/doctors/${encodeURIComponent(doctorId)}/availability`);
    if (!res.data.success || !Array.isArray(res.data.data?.slots)) throw new Error('Invalid availability response');
    return res.data.data.slots.filter(s => s.date.slice(0, 10) === date).map(s => ({
      id: s.startTime, label: `${s.startTime} - ${s.endTime}`,
      period: Number(s.startTime.slice(0, 2)) < 12 ? 'morning' : Number(s.startTime.slice(0, 2)) < 17 ? 'afternoon' : 'evening',
      enabled: s.bookedCount < s.capacity,
    }));
  },
};
