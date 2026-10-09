import { apiClient } from '@/config/api';
import { type UserProfile, DEFAULT_PATIENT_PROFILE } from '../types';

const PROFILE_KEY = 'meditrack_user_profile';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    // Try official /auth/me or /profile
    try {
      const res = await apiClient.get<{ success: boolean; data: any }>('/auth/me');
      if (res.data?.data?.user) {
        const u = res.data.data.user;
        const mapped: UserProfile = {
          ...DEFAULT_PATIENT_PROFILE,
          id: u._id || u.id || DEFAULT_PATIENT_PROFILE.id,
          name: u.name || DEFAULT_PATIENT_PROFILE.name,
          phone: u.phone || DEFAULT_PATIENT_PROFILE.phone,
          email: u.email || DEFAULT_PATIENT_PROFILE.email,
          dob: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : DEFAULT_PATIENT_PROFILE.dob,
          gender: (u.gender as UserProfile['gender']) || DEFAULT_PATIENT_PROFILE.gender,
          address: u.address || DEFAULT_PATIENT_PROFILE.address,
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Backend not authenticated or offline, use isolated mock
    }

    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to default
      }
    }

    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PATIENT_PROFILE));
    return DEFAULT_PATIENT_PROFILE;
  },

  updateProfile: async (patch: Partial<UserProfile>): Promise<UserProfile> => {
    const current = await profileApi.getProfile();
    const updated: UserProfile = { ...current, ...patch };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));

    try {
      await apiClient.patch('/profile', patch);
    } catch {
      // Endpoint fallback
    }

    return updated;
  },
};
