import { z } from 'zod';
import type { Appointment, AppointmentStatus } from '../types';
const person = z.union([z.string().min(1), z.object({ _id: z.string().min(1), name: z.string().optional() })]);
const schema = z.object({
  _id: z.string().min(1), ref: z.string().optional(), referenceId: z.string().optional(),
  patient: person, familyMember: person.nullable().optional(),
  doctor: z.object({ _id: z.string(), name: z.string(), roomNumber: z.string().optional(), consultationFee: z.number().optional(),
    department: z.object({ _id: z.string(), name: z.string() }).nullable().optional() }).nullable(),
  appointmentDate: z.string().refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value.slice(0, 10), 'Invalid appointment date'),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  status: z.enum(['BOOKED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED']),
  queueTicket: z.unknown().optional(), reason: z.string().optional(), createdAt: z.string(), updatedAt: z.string(),
});
export type BackendAppointment = z.infer<typeof schema>;
const statuses: Record<BackendAppointment['status'], AppointmentStatus> = {
  BOOKED: 'confirmed', RESCHEDULED: 'rescheduled', CANCELLED: 'cancelled', COMPLETED: 'completed',
};
const personId = (p: z.infer<typeof person>) => typeof p === 'string' ? p : p._id;
const personName = (p: z.infer<typeof person>) => typeof p === 'string' ? '' : p.name ?? '';
export function mapAppointment(response: unknown): Appointment {
  const parsed = schema.safeParse(response);
  if (!parsed.success) throw new Error('Invalid appointment response. Please try again.');
  const a = parsed.data;
  return {
    id: a._id, ref: a.ref ?? a.referenceId ?? a._id, patientId: personId(a.patient), patientName: personName(a.patient),
    patientIdRef: personId(a.patient), bookedForSelf: !a.familyMember,
    familyMemberId: a.familyMember ? personId(a.familyMember) : undefined,
    familyMemberName: a.familyMember ? personName(a.familyMember) : undefined,
    doctorId: a.doctor?._id ?? '', doctorName: a.doctor?.name ?? 'Doctor no longer available',
    departmentId: a.doctor?.department?._id ?? '', department: a.doctor?.department?.name ?? 'Department not provided',
    room: a.doctor?.roomNumber ?? 'Not provided', date: a.appointmentDate.slice(0, 10),
    time: a.timeSlot, slotId: a.timeSlot, status: statuses[a.status], checkedIn: Boolean(a.queueTicket),
    paymentStatus: 'unknown', amount: a.doctor?.consultationFee ?? 0,
    reason: a.reason, createdAt: a.createdAt, updatedAt: a.updatedAt,
  };
}
