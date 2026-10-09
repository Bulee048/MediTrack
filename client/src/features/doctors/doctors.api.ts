import { z } from 'zod';
import { apiClient } from '@/config/api';
import type { DoctorListFilters, DoctorSummary } from './types';

const rawDoctor = z.object({
  _id: z.string(), name: z.string(), department: z.object({ _id: z.string(), name: z.string() }).nullable(),
  title: z.string().optional(), experienceYears: z.number().optional(), consultationFee: z.number().optional(),
  roomNumber: z.string().optional(), isActive: z.boolean(),
  availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
});
function mapDoctor(value: unknown): DoctorSummary {
  const d = rawDoctor.parse(value);
  return { id: d._id, name: d.name, departmentId: d.department?._id ?? '',
    department: d.department?.name ?? 'Department not listed', title: d.title,
    experienceYears: d.experienceYears, fee: d.consultationFee, room: d.roomNumber,
    active: d.isActive, availabilityStatus: d.availabilityStatus };
}
export async function listDoctors(filters: DoctorListFilters = {}) {
  const params = { department: filters.departmentId || undefined, search: filters.q || undefined,
    available: filters.available === true ? 'true' : undefined };
  const { data } = await apiClient.get('/doctors', { params });
  return z.array(z.unknown()).parse(data.data.doctors).map(mapDoctor);
}
export async function getDoctor(id: string) {
  const { data } = await apiClient.get(`/doctors/${encodeURIComponent(id)}`);
  return mapDoctor(data.data.doctor);
}
export async function getDoctorAvailability(id: string, _date: string) {
  const { data } = await apiClient.get(`/doctors/${encodeURIComponent(id)}/availability`);
  return z.object({ doctorId: z.string(), doctorName: z.string(),
    availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
    slots: z.array(z.object({ date: z.string().transform(value => value.slice(0, 10)),
      startTime: z.string(), endTime: z.string(), capacity: z.number(), bookedCount: z.number() }))
  }).parse(data.data);
}
