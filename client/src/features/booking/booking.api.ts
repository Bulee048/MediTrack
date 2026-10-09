import { apiClient } from '@/config/api';
import type { BookingAppointment, BookingDraft, BookingQuote } from './types';

export async function getBookingQuote(doctorId: string, slotId: string) {
  const { data } = await apiClient.post<BookingQuote>('/appointments/quote', { doctorId, slotId });
  return data;
}

export async function createBooking(draft: BookingDraft) {
  const { data } = await apiClient.post<BookingAppointment>('/appointments', draft);
  return data;
}