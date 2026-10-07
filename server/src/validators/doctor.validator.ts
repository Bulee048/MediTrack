import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

export const createDoctorSchema = z.object({
  name: z.string({ required_error: 'Doctor name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  departmentId: objectIdString,
  title: z.string().trim().optional(),
  experienceYears: z.number().min(0, 'Experience years cannot be negative').optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
  roomNumber: z.string().trim().optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).default('AVAILABLE'),
});

export const updateDoctorSchema = z.object({
  name: z.string().trim().min(2).optional(),
  departmentId: objectIdString.optional(),
  title: z.string().trim().optional(),
  experienceYears: z.number().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  roomNumber: z.string().trim().optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).optional(),
  isActive: z.boolean().optional(),
});

export const slotSchema = z.object({
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  startTime: z.string().trim().min(1, 'Start time is required'),
  endTime: z.string().trim().min(1, 'End time is required'),
  capacity: z.number().min(0, 'Capacity cannot be negative'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be later than start time',
  path: ['endTime'],
});

export const updateAvailabilitySchema = z.object({
  availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).optional(),
  slots: z.array(slotSchema),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
