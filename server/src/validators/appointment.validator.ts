import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

// YYYY-MM-DD format regex
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
// HH:MM 24-hour format regex
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const dateString = z
  .string({ required_error: 'Date is required' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Invalid calendar date');

export const createAppointmentSchema = z.object({
  doctorId: z.string({ required_error: 'Doctor ID is required' }).trim().min(1, 'Doctor ID is required'),
  date: dateString,
  slotId: z.string({ required_error: 'Slot ID is required' }).trim().min(1, 'Slot ID is required'),
  slotLabel: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  familyMemberId: z.string().trim().optional(),
  familyMemberName: z.string().trim().optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid Doctor ID' }),
  date: z
    .string({ required_error: 'Appointment date is required' })
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  time: z
    .string()
    .optional(),
  slotId: z.string().optional(),
  slotLabel: z.string().optional(),
  familyMemberId: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || isValidObjectId(val), { message: 'Invalid Family Member ID' }),
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export const rescheduleAppointmentSchema = z.object({
  date: z
    .string({ required_error: 'New appointment date is required' })
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  time: z
    .string({ required_error: 'New time slot is required' })
    .regex(timeRegex, 'Time must be in HH:MM (24-hour) format'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['BOOKED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid appointment status',
  }),
});

export const getMyAppointmentsQuerySchema = z.object({
  status: z.enum(['BOOKED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
  upcoming: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  past: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const getStaffAppointmentsQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  doctorId: z
    .string()
    .optional()
    .refine((val) => !val || isValidObjectId(val), { message: 'Invalid Doctor ID' }),
  departmentId: z
    .string()
    .optional()
    .refine((val) => !val || isValidObjectId(val), { message: 'Invalid Department ID' }),
  status: z.enum(['BOOKED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type GetMyAppointmentsQuery = z.infer<typeof getMyAppointmentsQuerySchema>;
export type GetStaffAppointmentsQuery = z.infer<typeof getStaffAppointmentsQuerySchema>;

