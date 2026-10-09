import { apiClient } from '@/config/api';
import { getCurrentPatient } from '@/features/auth/auth.api';
import { getDoctor, getDoctorAvailability } from '@/features/doctors/doctors.api';
import type { BookingAppointment, BookingDraft, BookingQuote } from './types';

interface AppointmentDocument {
  _id: string;
  ref?: string;
  referenceId?: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'BOOKED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  doctor: { _id: string; name: string; roomNumber?: string; consultationFee?: number; department?: { name: string } };
}

function toBooking(appointment: AppointmentDocument, patientName: string): BookingAppointment {
  const date = appointment.appointmentDate.slice(0, 10);
  return {
    id: appointment._id, ref: appointment.ref ?? appointment.referenceId ?? appointment._id,
    doctorId: appointment.doctor._id, doctorName: appointment.doctor.name, room: appointment.doctor.roomNumber,
    department: appointment.doctor.department?.name ?? 'Department not listed', date,
    slotId: `${date}-${appointment.timeSlot}`, slotLabel: appointment.timeSlot, patientName,
    amount: appointment.doctor.consultationFee ?? 0,
    status: appointment.status === 'CANCELLED' ? 'cancelled' : appointment.status === 'COMPLETED' ? 'completed' : 'confirmed',
    paymentStatus: 'pending',
  };
}

export async function getBookingQuote(doctorId: string, _slotId: string): Promise<BookingQuote> {
  const doctor = await getDoctor(doctorId);
  // No platform fee or payment API exists. Show the published consultation fee.
  return { consultationFee: doctor.fee, platformFee: 0, total: doctor.fee, currency: 'LKR' };
}

export async function createBooking(draft: BookingDraft): Promise<BookingAppointment> {
  const availability = await getDoctorAvailability(draft.doctorId, draft.date);
  const slot = availability.slots.find(item => `${item.date}-${item.startTime}-${item.endTime}` === draft.slotId && item.date === draft.date);
  if (!slot) throw new Error('The selected slot is no longer available. Please choose a time again.');
  const { data } = await apiClient.post<{ data: { appointment: AppointmentDocument } }>('/appointments', {
    doctorId: draft.doctorId, date: draft.date, time: slot.startTime,
    reason: draft.reason, familyMemberId: draft.familyMemberId,
  });
  return toBooking(data.data.appointment, draft.familyMemberName ?? 'Patient');
}

export async function getBooking(id: string): Promise<BookingAppointment> {
  const [{ data }, user] = await Promise.all([
    apiClient.get<{ data: { appointment: AppointmentDocument } }>(`/appointments/${id}`), getCurrentPatient(),
  ]);
  return toBooking(data.data.appointment, user.name);
}
