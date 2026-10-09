import { z } from 'zod';
export const dateOfBirthSchema = z.string().trim().refine(value =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value && Date.parse(value) <= Date.now(),
  'Date of birth must be a valid date in the past');
export const patientPhoneSchema = z.string().trim().regex(/^\+?[\d ()-]+$/, 'Invalid phone number')
  .refine(value => { const digits = value.replace(/\D/g, ''); return digits.length >= 8 && digits.length <= 15; }, 'Phone must contain 8 to 15 digits');
export const patientGenderSchema = z.enum(['Male', 'Female', 'Other']);
