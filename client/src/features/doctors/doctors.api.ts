import { apiClient } from '@/config/api';
import type { DoctorAvailability, DoctorListFilters, DoctorSummary } from './types';

export async function listDoctors(filters: DoctorListFilters = {}) {
  const { data } = await apiClient.get<DoctorSummary[]>('/doctors', { params: filters });
  return data;
}

export async function getDoctor(id: string) {
  const { data } = await apiClient.get<DoctorSummary>(`/doctors/${id}`);
  return data;
}

export async function getDoctorAvailability(id: string, date: string) {
  const { data } = await apiClient.get<DoctorAvailability>(`/doctors/${id}/availability`, { params: { date } });
  return data;
}