import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string({ required_error: 'Department name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  code: z.string({ required_error: 'Department code is required' }).trim().min(2, 'Code must be at least 2 characters').toUpperCase(),
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  roomNumber: z.string().trim().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  code: z.string().trim().min(2).toUpperCase().optional(),
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  roomNumber: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
