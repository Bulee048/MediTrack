export type Gender = 'Male' | 'Female' | 'Other';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  role?: string;
  displayId: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: Gender | '';
  bloodGroup: string;
  address: string;
  insuranceProvider: string;
  insurancePolicyNo: string;
  emergencyContact?: EmergencyContact;
  allergies?: string[];
  chronic?: string[];
  memberSince: string;
  createdAt: string;
  stats?: {
    totalAppointments: number;
    completedVisits: number;
  };
}
