import type { BookingAppointment, BookingDraft, BookingQuote } from './types';

export interface AppointmentQuoteInput {
  doctorId: string;
  slotId: string;
  consultationFee: number;
}

export interface AppointmentSubmission extends BookingDraft {
  amount: number;
  patientName: string;
}

export interface AppointmentApi {
  quote(input: AppointmentQuoteInput): Promise<BookingQuote>;
  create(input: AppointmentSubmission): Promise<BookingAppointment>;
}

// Temporary mock appointment API until POST /api/appointments exists on the server.
export const temporaryAppointmentApi: AppointmentApi | null = null;