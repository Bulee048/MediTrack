import type { BookingAppointment, BookingDraft, BookingQuote, BookingStep } from './types';

export const bookingMockSteps: BookingStep[] = [
  { key: 'doctor', label: 'Select Doctor', path: '/doctors' },
  { key: 'date', label: 'Choose Date', path: '/booking/date' },
  { key: 'time', label: 'Pick Time', path: '/booking/time' },
  { key: 'review', label: 'Review', path: '/booking/review' },
];

export async function mockGetBookingQuote(): Promise<BookingQuote> {
  return {
    consultationFee: 2800,
    platformFee: 20,
    total: 2820,
    currency: 'LKR',
  };
}

export async function mockCreateBooking(draft: BookingDraft): Promise<BookingAppointment> {
  return {
    id: `appt-${draft.doctorId}-${draft.slotId}`,
    ref: `OPD-${draft.date.replace(/-/g, '')}-${draft.slotId.slice(-4)}`,
    doctorId: draft.doctorId,
    doctorName: draft.doctorName,
    department: draft.department,
    date: draft.date,
    slotId: draft.slotId,
    slotLabel: draft.slotLabel,
    patientName: draft.familyMemberName ?? 'Nayana Perera',
    amount: 2820,
    status: 'confirmed',
    paymentStatus: 'pending',
  };
}