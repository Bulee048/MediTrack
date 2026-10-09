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

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam_01',
    ownerId: 'usr_pat_01',
    name: 'Kamala Perera',
    relation: 'Spouse',
    dob: '1990-04-12',
    gender: 'Female',
    phone: '+94 71 987 6543',
    notes: 'Mild asthma',
  },
  {
    id: 'fam_02',
    ownerId: 'usr_pat_01',
    name: 'Sunil Perera',
    relation: 'Father',
    dob: '1958-11-20',
    gender: 'Male',
    phone: '+94 77 555 1234',
    notes: 'Hypertension, Diabetic',
  },
  {
    id: 'fam_03',
    ownerId: 'usr_pat_01',
    name: 'Dinuka Perera',
    relation: 'Son',
    dob: '2016-08-05',
    gender: 'Male',
    notes: 'Routine pediatric care',
  },
];
