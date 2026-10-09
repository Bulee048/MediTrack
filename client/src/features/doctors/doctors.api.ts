import { apiClient } from '@/config/api';
import type { DoctorAvailabilityApiResult, DoctorListFilters, DoctorSummary } from './types';

interface DoctorDocument {
  _id: string;
  name: string;
  department: { _id: string; name: string };
  title?: string;
  experienceYears?: number;
  consultationFee?: number;
  roomNumber?: string;
  isActive: boolean;
  availabilityStatus: DoctorSummary['availabilityStatus'];
}

function toDoctor(doctor: DoctorDocument): DoctorSummary {
  return {
    id: doctor._id, name: doctor.name, departmentId: doctor.department._id,
    department: doctor.department.name, title: doctor.title ?? '',
    experienceYears: doctor.experienceYears ?? 0, fee: doctor.consultationFee ?? 0,
    room: doctor.roomNumber ?? '', active: doctor.isActive,
    availabilityStatus: doctor.availabilityStatus,
    rating: null, reviews: null, patientsTreated: 'Not listed', about: '', languages: [],
  };
}

export async function listDoctors(filters: DoctorListFilters = {}) {
  const params: Record<string, string> = {};

  if (filters.departmentId) params.department = filters.departmentId;
  if (filters.q) params.search = filters.q;
  if (typeof filters.available === 'boolean') params.available = String(filters.available);

  const { data } = await apiClient.get<{ success: boolean; message: string; data: { doctors: DoctorDocument[] } }>('/doctors', {
    params: Object.keys(params).length ? params : undefined,
  });
  return data.data.doctors.map(toDoctor);
}

export async function getDoctor(id: string) {
  const { data } = await apiClient.get<{ success: boolean; message: string; data: { doctor: DoctorDocument } }>(`/doctors/${id}`);
  return toDoctor(data.data.doctor);
}

export async function getDoctorAvailability(id: string, date: string) {
  const { data } = await apiClient.get<{ success: boolean; message: string; data: DoctorAvailabilityApiResult }>(`/doctors/${id}/availability`, {
    params: { date },
  });
  return { ...data.data, slots: data.data.slots.map(slot => ({ ...slot, date: slot.date.slice(0, 10) })) };
}
