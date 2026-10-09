export type BookingStepKey = 'doctor' | 'date' | 'time' | 'review';

export interface BookingDraft {
  doctorId: string;
  date: string;
  slotId: string;
  slotLabel: string;
  reason?: string;
  familyMemberId?: string;
  familyMemberName?: string;
}

export interface BookingAppointment {
  id: string;
  ref: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  slotId: string;
  slotLabel: string;
  timeSlot: string;
  reason?: string;
  status: 'BOOKED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  patientId: string;
  familyMemberId?: string;
  createdAt: string;
}

export interface BookingStep {
  key: BookingStepKey;
  label: string;
  path: string;
}

export interface BookingDoctorRef {
  id: string;
  name: string;
  department: string;
  title?: string;
  experienceYears?: number;
  room?: string;
  fee?: number;
  availabilityStatus?: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
}

export interface BookingDateSelection {
  doctor: BookingDoctorRef;
  date: string;
}

export interface BookingTimeSelection extends BookingDateSelection {
  slotId: string;
  slotLabel: string;
}