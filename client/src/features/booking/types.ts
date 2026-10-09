export type BookingStepKey = 'doctor' | 'date' | 'time' | 'review';

export interface BookingDraft {
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  slotId: string;
  slotLabel: string;
  reason?: string;
  forSelf?: boolean;
  familyMemberId?: string;
  familyMemberName?: string;
}

export interface BookingQuote {
  consultationFee: number;
  platformFee: number;
  total: number;
  currency: 'LKR';
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
  patientName: string;
  amount: number;
  status: 'confirmed';
  paymentStatus: 'pending' | 'paid';
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