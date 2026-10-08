import { buildDoctorAvailability, doctorMockData, filterDoctors, getDoctorById } from './mock';
import { getDoctor, getDoctorAvailability, listDoctors } from './doctors.api';
import type { DoctorAvailability, DoctorListFilters, DoctorSummary } from './types';

const useMockData = import.meta.env.VITE_USE_FEATURE_MOCKS !== 'false';

export async function fetchDoctors(filters: DoctorListFilters = {}): Promise<DoctorSummary[]> {
  return useMockData ? filterDoctors(filters) : listDoctors(filters);
}

export async function fetchDoctor(id: string): Promise<DoctorSummary | null> {
  return useMockData ? getDoctorById(id) : getDoctor(id).then((doctor) => doctor ?? null);
}

export async function fetchDoctorAvailability(id: string, date: string): Promise<DoctorAvailability> {
  return useMockData ? buildDoctorAvailability(id, date) : getDoctorAvailability(id, date);
}

export { doctorMockData };