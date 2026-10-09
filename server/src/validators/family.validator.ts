import { z } from 'zod';
import { dateOfBirthSchema, patientPhoneSchema, patientGenderSchema } from './patientFields.js';
export const createFamilyMemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relationship: z.string().trim().min(2).max(40),
  dateOfBirth: dateOfBirthSchema,
  gender: patientGenderSchema,
  phone: patientPhoneSchema.optional(),
}).strict();
export const updateFamilyMemberSchema = createFamilyMemberSchema.partial().strict()
  .refine(data => Object.keys(data).length > 0, 'At least one editable field is required');
export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
