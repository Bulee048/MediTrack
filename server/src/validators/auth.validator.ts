import { z } from 'zod';
import { dateOfBirthSchema, patientPhoneSchema, patientGenderSchema } from './patientFields.js';

export const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string({ required_error: 'Phone number is required' }).trim().min(8, 'Phone number must be at least 8 characters'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone number is required to login',
  path: ['email'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: patientPhoneSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional().or(z.literal('')),
  gender: patientGenderSchema.optional().or(z.literal('')),
  address: z.string().trim().max(500).optional(),
}).strict().refine(data => Object.keys(data).length > 0, 'At least one editable field is required');
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
