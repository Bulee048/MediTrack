export type AppointmentStatus =
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'unknown';

export interface QueueStatusSummary {
  id: string;
  token: string;
  status: 'waiting' | 'in_consultation' | 'completed' | 'not_in_queue';
  nowServing: string;
  position: number;
  estWaitMins: number;
  patientsAhead: number;
}

export interface Appointment {
  id: string;
  ref: string;
  patientId: string;
  patientName: string;
  patientIdRef: string;
  bookedForSelf: boolean;
  familyMemberId?: string;
  familyMemberName?: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  department: string;
  room: string;
  date: string;
  time: string;
  slotId: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  reason?: string;
  cancelReason?: string;
  doctor?: {
    title: string;
    rating: number;
    reviews: number;
  };
  queueEntry?: QueueStatusSummary;
  checkedIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  label: string;
  period: 'morning' | 'afternoon' | 'evening';
  enabled: boolean;
}
