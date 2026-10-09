import { apiClient } from '@/config/api';
import type { DoctorDepartment } from './types';

type DepartmentsResponse = {
  success: boolean;
  message: string;
  data: { departments: (Omit<DoctorDepartment, 'id'> & { _id: string })[] };
};

export async function getDepartments(search?: string) {
  const { data } = await apiClient.get<DepartmentsResponse>('/departments', {
    params: search ? { search } : undefined,
  });

  return data.data.departments.map(({ _id, ...department }) => ({ ...department, id: _id }));
}
