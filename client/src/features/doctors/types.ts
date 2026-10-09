export type DoctorSessionPeriod = 'morning' | 'afternoon' | 'evening';

export interface DoctorDepartment {
  id: string;
  name: string;
  code: string;
  icon?: string;
  description?: string;
  roomNumber?: string;
  isActive?: boolean;
  doctorCount?: number;
}

export interface DoctorSummary {
  id: string;
  name: string;
  departmentId: string;
  department: string;
  title?: string;
  experienceYears?: number;
  rating?: number;
  reviews?: number;
  patientsTreated?: string;
  fee?: number;
  about?: string;
  room?: string;
  languages?: string[];
  active: boolean;
  availabilityStatus?: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  nextSlot?: { label: string; slotId: string } | null;
  slotsLeftToday?: number;
  bookedToday?: number;
}

export interface DoctorDetails extends DoctorSummary {
  roster: Record<string, 'active' | 'busy' | 'leave'>;
  shifts: { morning: boolean; afternoon: boolean; evening: boolean };
}

export interface DoctorListFilters {
  departmentId?: string;
  q?: string;
  minRating?: number;
  available?: boolean;
}

export type DoctorsSource = 'api' | 'mock';

export type DoctorAvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';

export interface DoctorsResult {
  doctors: DoctorSummary[];
  source: DoctorsSource;
  fallbackReason?: string;
}

export interface DoctorProfileResult {
  doctor: DoctorSummary | null;
  source: DoctorsSource;
  fallbackReason?: string;
}

export interface DoctorAvailabilityApiSlot {
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}

export interface DoctorAvailabilityApiResult {
  doctorId: string;
  doctorName: string;
  availabilityStatus: DoctorAvailabilityStatus;
  slots: DoctorAvailabilityApiSlot[];
}

export interface DoctorAvailabilitySlotView {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  available: boolean;
}

export interface DoctorAvailabilityDayView {
  date: string;
  label: string;
  capacityLeft: number;
  totalCapacity: number;
  available: boolean;
  slots: DoctorAvailabilitySlotView[];
}

export interface DoctorAvailabilityView {
  doctorId: string;
  doctorName: string;
  availabilityStatus: DoctorAvailabilityStatus;
  source: DoctorsSource;
  fallbackReason?: string;
  days: DoctorAvailabilityDayView[];
}

export interface DoctorAvailabilityResult {
  view: DoctorAvailabilityView | null;
  source: DoctorsSource;
  fallbackReason?: string;
}

export interface DoctorAvailabilitySlot {
  id: string;
  label: string;
  minutes: number;
  period: DoctorSessionPeriod;
  enabled: boolean;
}

export interface DoctorAvailabilityGroup {
  period: DoctorSessionPeriod;
  label: string;
  slots: DoctorAvailabilitySlot[];
}

export interface DoctorAvailability {
  date: string;
  available: boolean;
  reason: string | null;
  busy: boolean;
  capacityLeft: number;
  groups: DoctorAvailabilityGroup[];
}