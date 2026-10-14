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
  date: z.string().or(z.date()).transform((val) => new Date(val)).refine(value=>!Number.isNaN(value.getTime()),'Invalid date'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'),
  capacity: z.number().int().min(0, 'Capacity cannot be negative'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be later than start time',
  path: ['endTime'],
});

export const updateAvailabilitySchema = z.object({
  expectedVersion: z.number().int().min(0).optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).optional(),
  slots: z.array(slotSchema).refine(slots=>new Set(slots.map(s=>`${s.date.toISOString().slice(0,10)}_${s.startTime}`)).size===slots.length,'Duplicate slot start time').refine(slots => slots.every((slot, index) => slots.slice(index + 1).every(other => slot.date.toISOString().slice(0,10) !== other.date.toISOString().slice(0,10) || slot.endTime <= other.startTime || other.endTime <= slot.startTime)), 'Schedule slots cannot overlap'),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
