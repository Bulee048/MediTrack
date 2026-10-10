import type { BookingAppointment, BookingQuote } from './types';
import { createBooking, getBookingQuote } from './booking.api';
import type { AppointmentQuoteInput, AppointmentSubmission } from './appointment.api';


export async function getAppointmentQuote(input: AppointmentQuoteInput): Promise<BookingQuote> {
  return getBookingQuote(input.doctorId, input.slotId);
}

export async function createAppointment(input: AppointmentSubmission): Promise<BookingAppointment> {
  return createBooking(input);
}
