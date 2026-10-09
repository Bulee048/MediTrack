import type { BookingAppointment, BookingQuote } from './types';
import { temporaryAppointmentApi, type AppointmentQuoteInput, type AppointmentSubmission } from './appointment.api';

export async function getAppointmentQuote(input: AppointmentQuoteInput): Promise<BookingQuote> {
  if (temporaryAppointmentApi) {
    return temporaryAppointmentApi.quote(input);
  }

  return {
    consultationFee: input.consultationFee,
    platformFee: 20,
    total: input.consultationFee + 20,
    currency: 'LKR',
  };
}

export async function createAppointment(input: AppointmentSubmission): Promise<BookingAppointment> {
  if (temporaryAppointmentApi) {
    return temporaryAppointmentApi.create(input);
  }

  return {
    id: `appt-${input.doctorId}-${input.slotId}`,
    ref: `OPD-${input.date.replace(/-/g, '')}-${input.slotId.slice(-4)}`,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    department: input.department,
    date: input.date,
    slotId: input.slotId,
    slotLabel: input.slotLabel,
    patientName: input.patientName,
    amount: input.amount,
    status: 'confirmed',
    paymentStatus: 'pending',
  };
}