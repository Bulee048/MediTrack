import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

export const checkInSchema = z.object({
  appointmentId: z
    .string({ required_error: 'Appointment ID is required' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid Appointment ID' }),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
