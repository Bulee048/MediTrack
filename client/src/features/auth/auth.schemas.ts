import { z } from 'zod';

export const loginFormSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
});

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Enter a valid email address').or(z.literal('')).optional(),
    phone: z.string().trim().regex(/^\+?\d{8,15}$/, 'Enter 8–15 phone digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;