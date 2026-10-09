import { bookingMockSteps, mockCreateBooking, mockGetBookingQuote } from './mock';
import { createBooking as createBookingApi, getBookingQuote as getBookingQuoteApi } from './booking.api';
import type { BookingAppointment, BookingDraft, BookingQuote, BookingStep } from './types';

const useMockData = import.meta.env.VITE_USE_FEATURE_MOCKS === 'true';

export async function fetchBookingQuote(doctorId: string, slotId: string): Promise<BookingQuote> {
  return useMockData ? mockGetBookingQuote() : getBookingQuoteApi(doctorId, slotId);
}

export async function submitBooking(draft: BookingDraft): Promise<BookingAppointment> {
  return useMockData ? mockCreateBooking(draft) : createBookingApi(draft);
}

export function getBookingSteps(): BookingStep[] {
  return bookingMockSteps;
}