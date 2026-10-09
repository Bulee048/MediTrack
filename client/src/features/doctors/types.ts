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
  title: string;
  experienceYears: number;
  rating: number;
  reviews: number;
  patientsTreated: string;
  fee: number;
  about: string;
  room: string;
  languages: string[];
  active: boolean;
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