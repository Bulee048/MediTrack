import { apiClient } from '@/config/api';
import type { DoctorAvailabilityApiResult, DoctorListFilters, DoctorSummary } from './types';

export async function listDoctors(filters: DoctorListFilters = {}) {
  const params: Record<string, string> = {};

  if (filters.departmentId) params.department = filters.departmentId;
  if (filters.q) params.search = filters.q;
  if (typeof filters.available === 'boolean') params.available = String(filters.available);

  const { data } = await apiClient.get<{ success: boolean; message: string; data: { doctors: DoctorSummary[] } }>('/doctors', {
    params: Object.keys(params).length ? params : undefined,
  });
  return data.data.doctors;
}

export async function getDoctor(id: string) {
  const { data } = await apiClient.get<{ success: boolean; message: string; data: { doctor: DoctorSummary } }>(`/doctors/${id}`);
  return data.data.doctor;
}

export async function getDoctorAvailability(id: string, date: string) {
  const { data } = await apiClient.get<{ success: boolean; message: string; data: DoctorAvailabilityApiResult }>(`/doctors/${id}/availability`, {
    params: { date },
  });
  return data.data;
}