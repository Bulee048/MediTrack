export type Gender = 'Male' | 'Female' | 'Other';

export interface FamilyMember {
  id: string;
  ownerId: string;
  name: string;
  relation: string;
  dob: string;
  gender: Gender | '';
  phone?: string;
  notes?: string;
}

export const RELATIONS = [
  'Father',
  'Mother',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Guardian',
  'Caregiver',
  'Other',
];
