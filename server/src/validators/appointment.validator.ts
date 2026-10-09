import { z } from 'zod';

// YYYY-MM-DD format validation
const dateString = z
  .string({ required_error: 'Date is required' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Invalid calendar date');

export const createAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required' })
    .trim()
    .min(1, 'Doctor ID is required'),
  date: dateString,
  // slotId encodes "date-startTime-endTime" as produced by the client availability service
  slotId: z
    .string({ required_error: 'Slot ID is required' })
    .trim()
    .min(1, 'Slot ID is required'),
  // Human-readable label, e.g. "09:00 - 09:30"
  slotLabel: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  // Optional family member booking
  familyMemberId: z.string().trim().optional(),
  familyMemberName: z.string().trim().optional(),
}).strict();

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
