import { z } from 'zod';
import { apiClient } from '@/config/api';

export async function getDepartments(search?: string) {
  const { data } = await apiClient.get('/departments', { params: search ? { search } : undefined });
  return z.array(z.object({ _id: z.string(), name: z.string(), code: z.string(),
    description: z.string().optional(), roomNumber: z.string().optional(), isActive: z.boolean()
  })).parse(data.data.departments).map(({ _id, ...department }) => ({ id: _id, ...department }));
}
