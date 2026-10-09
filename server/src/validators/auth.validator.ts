import { z } from 'zod';

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
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 characters').optional(),
  nic: z.string().trim().optional(),
  dateOfBirth: z.union([z.string().trim().refine(value => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && Date.parse(value) <= Date.now()), 'Date of birth must be a valid date in the past'), z.date().max(new Date())]).optional(),
  gender: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
