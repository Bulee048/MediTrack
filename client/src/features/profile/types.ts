export type Gender = 'Male' | 'Female' | 'Other';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  displayId: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: Gender;
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

export const DEFAULT_PATIENT_PROFILE: UserProfile = {
  id: 'usr_pat_01',
  displayId: 'P-8902',
  name: 'Nimal Perera',
  phone: '+94 77 123 4567',
  email: 'nimal.perera@gmail.com',
  dob: '1988-06-15',
  gender: 'Male',
  bloodGroup: 'O+ve',
  address: 'No. 45, Temple Road, Colombo 03, Western Province',
  insuranceProvider: 'Sri Lanka Insurance Corp',
  insurancePolicyNo: 'SLIC-HEALTH-99482',
  emergencyContact: {
    name: 'Kamala Perera',
    relationship: 'Spouse',
    phone: '+94 71 987 6543',
  },
  allergies: ['Penicillin'],
  chronic: ['Mild Hypertension'],
  memberSince: '2024',
  createdAt: '2024-01-15T09:00:00.000Z',
  stats: {
    totalAppointments: 6,
    completedVisits: 4,
  },
};
