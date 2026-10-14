import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

export const checkInSchema = z.object({
  appointmentId: z
    .string({ required_error: 'Appointment ID is required' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid Appointment ID' }),
}).strict();

export type CheckInInput = z.infer<typeof checkInSchema>;

const queueObjectId = z.string().refine(isValidObjectId, 'Invalid queue scope ID');
export const callNextSchema = z.object({ doctorId: queueObjectId.optional(), departmentId: queueObjectId.optional() })
  .strict().refine(value => Boolean(value.doctorId || value.departmentId), 'Select a doctor or department');
export const queueFiltersSchema = z.object({
  doctorId: queueObjectId.optional(), departmentId: queueObjectId.optional(),
  status: z.enum(['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD', 'SKIPPED', 'COMPLETED', 'CANCELLED']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Invalid queue date').optional(),
}).strict();
