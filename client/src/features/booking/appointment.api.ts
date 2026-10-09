import { z } from 'zod';
import { apiClient } from '@/config/api';
import type { BookingDraft } from './types';

export const appointmentResponseSchema = z.object({
  id: z.string().min(1), ref: z.string().min(1), doctorId: z.string(),
  doctorName: z.string(), department: z.string(), date: z.string(),
  slotId: z.string(), slotLabel: z.string(), timeSlot: z.string(),
  reason: z.string().optional(), status: z.enum(['BOOKED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED']),
  patientId: z.string(), familyMemberId: z.string().optional(), createdAt: z.string(),
});
const envelope = z.object({ success: z.literal(true), data: z.object({ appointment: appointmentResponseSchema }) });

export async function createAppointmentRequest(input: BookingDraft) {
  const body = {
    doctorId: input.doctorId, date: input.date, slotId: input.slotId, slotLabel: input.slotLabel,
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    ...(input.familyMemberId ? { familyMemberId: input.familyMemberId } : {}),
    ...(input.familyMemberId && input.familyMemberName ? { familyMemberName: input.familyMemberName } : {}),
  };
  const { data } = await apiClient.post<unknown>('/appointments', body);
  return envelope.parse(data).data.appointment;
}

export async function getAppointmentRequest(id: string) {
  const { data } = await apiClient.get<unknown>(`/appointments/${encodeURIComponent(id)}`);
  return envelope.parse(data).data.appointment;
}
