export type AppointmentStatus =
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

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

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_101',
    ref: 'OPD-8821',
    patientId: 'usr_pat_01',
    patientName: 'Nimal Perera',
    patientIdRef: 'P-8902',
    bookedForSelf: true,
    doctorId: 'doc_cardio_01',
    doctorName: 'Dr. Sarah Jenkins',
    departmentId: 'dept_cardio',
    department: 'Cardiology',
    room: 'Room 204, Floor 2',
    date: new Date().toISOString().slice(0, 10), // Today
    time: '09:30 AM',
    slotId: 'slot_0930',
    status: 'confirmed',
    paymentStatus: 'paid',
    amount: 2500,
    reason: 'Follow-up blood pressure check and chest discomfort evaluation',
    doctor: {
      title: 'Senior Consultant Cardiologist',
      rating: 4.9,
      reviews: 128,
    },
    queueEntry: {
      id: 'q_entry_01',
      token: 'Q-12',
      status: 'waiting',
      nowServing: 'Q-09',
      position: 3,
      estWaitMins: 18,
      patientsAhead: 2,
    },
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-09T08:00:00.000Z',
  },
  {
    id: 'apt_102',
    ref: 'OPD-9104',
    patientId: 'usr_pat_01',
    patientName: 'Nimal Perera',
    patientIdRef: 'P-8902',
    bookedForSelf: false,
    familyMemberId: 'fam_02',
    familyMemberName: 'Sunil Perera',
    doctorId: 'doc_ortho_02',
    doctorName: 'Dr. Rajesh Sharma',
    departmentId: 'dept_ortho',
    department: 'Orthopedics',
    room: 'Room 105, Floor 1',
    date: '2026-10-14',
    time: '11:15 AM',
    slotId: 'slot_1115',
    status: 'confirmed',
    paymentStatus: 'pending',
    amount: 3000,
    reason: 'Severe knee pain and stiffness while walking',
    doctor: {
      title: 'Orthopedic Surgeon',
      rating: 4.8,
      reviews: 95,
    },
    createdAt: '2026-10-05T10:30:00.000Z',
    updatedAt: '2026-10-05T10:30:00.000Z',
  },
  {
    id: 'apt_103',
    ref: 'OPD-7440',
    patientId: 'usr_pat_01',
    patientName: 'Nimal Perera',
    patientIdRef: 'P-8902',
    bookedForSelf: true,
    doctorId: 'doc_derma_03',
    doctorName: 'Dr. Priya Patel',
    departmentId: 'dept_derma',
    department: 'Dermatology',
    room: 'Room 310, Floor 3',
    date: '2026-09-18',
    time: '02:00 PM',
    slotId: 'slot_1400',
    status: 'completed',
    paymentStatus: 'paid',
    amount: 2200,
    reason: 'Skin rash and allergy treatment consultation',
    doctor: {
      title: 'Consultant Dermatologist',
      rating: 4.7,
      reviews: 84,
    },
    createdAt: '2026-09-10T14:00:00.000Z',
    updatedAt: '2026-09-18T15:00:00.000Z',
  },
  {
    id: 'apt_104',
    ref: 'OPD-6102',
    patientId: 'usr_pat_01',
    patientName: 'Nimal Perera',
    patientIdRef: 'P-8902',
    bookedForSelf: false,
    familyMemberId: 'fam_01',
    familyMemberName: 'Kamala Perera',
    doctorId: 'doc_cardio_01',
    doctorName: 'Dr. Sarah Jenkins',
    departmentId: 'dept_cardio',
    department: 'Cardiology',
    room: 'Room 204, Floor 2',
    date: '2026-09-02',
    time: '10:00 AM',
    slotId: 'slot_1000',
    status: 'cancelled',
    paymentStatus: 'refunded',
    amount: 2500,
    cancelReason: 'Found another doctor / conflict with personal schedule',
    doctor: {
      title: 'Senior Consultant Cardiologist',
      rating: 4.9,
      reviews: 128,
    },
    createdAt: '2026-08-28T09:15:00.000Z',
    updatedAt: '2026-08-30T11:20:00.000Z',
  },
];
