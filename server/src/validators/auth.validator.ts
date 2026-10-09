import { z } from 'zod';

const phone = z.string().trim().regex(/^\+?\d{8,15}$/, 'Enter a valid phone number (8–15 digits)');
const email = z.string().trim().email('Invalid email address');
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100), email: email.optional().or(z.literal('')),
  phone, password: z.string().min(8).max(128),
}).strict();
export const loginSchema = z.object({ email: email.optional(), phone: phone.optional(),
  password: z.string().min(1).max(128),
}).strict().refine(data => Boolean(data.email) !== Boolean(data.phone), { message: 'Provide one email or phone number' });
const dob = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
    && value <= new Date().toISOString().slice(0, 10), 'Enter a valid past date of birth');
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(), email: email.optional().or(z.literal('')),
  phone: phone.optional(), dateOfBirth: dob.optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(), address: z.string().trim().max(500).optional(),
}).strict().refine(data => Object.keys(data).length > 0, 'Provide a field to update');
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
