import { apiClient } from '@/config/api';
import { type Settings, DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'meditrack_user_settings';

export const accessibilityApi = {
  getSettings: async (): Promise<Settings> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Settings }>('/profile/settings');
      if (res.data?.data) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch {
      // Backend settings endpoint might still be under development
    }

    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaults
      }
    }
    return DEFAULT_SETTINGS;
  },

  updateSettings: async (patch: Partial<Settings>): Promise<Settings> => {
    const current = await accessibilityApi.getSettings();
    const updated: Settings = { ...current, ...patch };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    try {
      await apiClient.put('/profile/settings', updated);
    } catch {
      // Backend settings endpoint might still be under development
    }

    return updated;
  },
};
