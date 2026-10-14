import { z } from 'zod';
import { registerSchema } from './auth.validator.js';
export const staffProfileSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().optional().or(z.literal('')) }).strict();
export const staffPreferencesSchema = z.object({ refreshSeconds: z.union([z.literal(15), z.literal(30), z.literal(60)]).optional(), showCompletedTickets: z.boolean().optional() }).strict().refine(value => Object.keys(value).length > 0, 'Provide an operational preference');
export const createStaffSchema = registerSchema.extend({ staffRole: z.enum(['RECEPTIONIST', 'DOCTOR']), staffId: z.string().trim().min(1).max(50) }).strict();
export const updateStaffSchema = z.object({ name: z.string().trim().min(2).max(100).optional(), staffRole: z.enum(['RECEPTIONIST', 'DOCTOR']).optional(), isActive: z.boolean().optional() }).strict().refine(value => Object.keys(value).length > 0, 'Provide a team field');
