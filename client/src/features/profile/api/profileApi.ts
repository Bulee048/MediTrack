import { apiClient } from '@/config/api';
import type { UserProfile } from '../types';
interface AuthUser {
  id: string; role: string; name: string; phone: string; email?: string;
  dateOfBirth?: string; gender?: string; address?: string;
}
export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
    const u = res.data.data?.user;
    if (!res.data.success || !u?.id) throw new Error('Invalid profile response');
    return {
      id: u.id, role: u.role, displayId: u.id, name: u.name, phone: u.phone, email: u.email ?? '',
      dob: u.dateOfBirth?.slice(0, 10) ?? '',
      gender: u.gender === 'MALE' || u.gender === 'Male' ? 'Male' : u.gender === 'FEMALE' || u.gender === 'Female' ? 'Female' : u.gender ? 'Other' : '',
      address: u.address ?? '', bloodGroup: '', insuranceProvider: '', insurancePolicyNo: '',
      memberSince: '', createdAt: '',
    };
  },
  updateProfile: async (patch: Partial<UserProfile>): Promise<UserProfile> => {
    const { data } = await apiClient.patch('/auth/profile', {
      name: patch.name, phone: patch.phone, email: patch.email,
      dateOfBirth: patch.dob, gender: patch.gender, address: patch.address,
    });
    if (!data.success || !data.data?.user?.id) throw new Error('Invalid profile update response');
    return profileApi.getProfile();
  },
};
