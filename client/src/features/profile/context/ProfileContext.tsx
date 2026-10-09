import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { type UserProfile, DEFAULT_PATIENT_PROFILE } from '../types';
import { profileApi } from '../api/profileApi';

interface ProfileContextType {
  user: UserProfile;
  loading: boolean;
  updateProfile: (patch: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  user: DEFAULT_PATIENT_PROFILE,
  loading: true,
  updateProfile: async () => DEFAULT_PATIENT_PROFILE,
  refreshProfile: async () => {},
  logout: () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_PATIENT_PROFILE);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const u = await profileApi.getProfile();
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const updated = await profileApi.updateProfile(patch);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medqueue.token');
    localStorage.removeItem('meditrack_auth_token');
  }, []);

  const value = useMemo(
    () => ({ user, loading, updateProfile, refreshProfile: fetchProfile, logout }),
    [user, loading, updateProfile, fetchProfile, logout]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
