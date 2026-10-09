import type { BookingAppointment, BookingQuote } from './types';
import { createBooking, getBookingQuote } from './booking.api';
import { mockCreateBooking, mockGetBookingQuote } from './mock';
import type { AppointmentQuoteInput, AppointmentSubmission } from './appointment.api';

const useMockData = import.meta.env.VITE_USE_FEATURE_MOCKS === 'true';

export async function getAppointmentQuote(input: AppointmentQuoteInput): Promise<BookingQuote> {
  return useMockData ? mockGetBookingQuote() : getBookingQuote(input.doctorId, input.slotId);
}

export async function createAppointment(input: AppointmentSubmission): Promise<BookingAppointment> {
  return useMockData ? mockCreateBooking(input) : createBooking(input);
}
