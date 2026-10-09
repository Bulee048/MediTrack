import { getDepartments as getDepartmentsApi } from './departments.api';
import { doctorMockDepartments } from './mock';
import type { DoctorDepartment } from './types';

const useMockData = import.meta.env.VITE_USE_FEATURE_MOCKS === 'true';

export async function fetchDepartments(search?: string): Promise<DoctorDepartment[]> {
  if (useMockData) {
    const q = search?.trim().toLowerCase();
    if (!q) return doctorMockDepartments;

    return doctorMockDepartments.filter((department) => [department.name, department.code, department.description ?? '']
      .join(' ')
      .toLowerCase()
      .includes(q));
  }

  return getDepartmentsApi(search);
}

export { doctorMockDepartments };