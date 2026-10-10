import { z } from 'zod';
import { apiClient } from '@/config/api';
import { mapAppointment } from '@/features/appointments/api/appointmentResponse';
import type { BookingAppointment, BookingDraft } from './types';
const envelope = z.object({ success: z.literal(true), data: z.object({ appointment: z.unknown() }) });
export function mapBookingResponse(response: unknown): BookingAppointment {
  const raw = envelope.parse(response).data.appointment;
  const appointment = mapAppointment(raw);
  const metadata = z.object({ slotId: z.string().optional(), slotLabel: z.string().optional() }).parse(raw);
  const status = { confirmed: 'BOOKED', rescheduled: 'RESCHEDULED', cancelled: 'CANCELLED', completed: 'COMPLETED' } as const;
  return { id: appointment.id, ref: appointment.ref, doctorId: appointment.doctorId, doctorName: appointment.doctorName,
    department: appointment.department, date: appointment.date, slotId: metadata.slotId ?? appointment.slotId,
    slotLabel: metadata.slotLabel ?? appointment.time, timeSlot: appointment.time, status: status[appointment.status],
    patientId: appointment.patientId, patientName: appointment.familyMemberName ?? appointment.patientName,
    familyMemberId: appointment.familyMemberId, room: appointment.room, reason: appointment.reason, createdAt: appointment.createdAt };
}
export async function createAppointmentRequest(input: BookingDraft) {
  const { data } = await apiClient.post<unknown>('/appointments', {
    doctorId: input.doctorId, date: input.date, slotId: input.slotId, slotLabel: input.slotLabel,
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    ...(input.familyMemberId ? { familyMemberId: input.familyMemberId } : {}),
  });
  return mapBookingResponse(data);
}
export async function getAppointmentRequest(id: string) {
  const { data } = await apiClient.get<unknown>(`/appointments/${encodeURIComponent(id)}`);
  return mapBookingResponse(data);
}
