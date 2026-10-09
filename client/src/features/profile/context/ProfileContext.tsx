import { getAccessToken, setAccessToken, useAuthSession, getAuthErrorStatus } from '@/config/api';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { UserProfile } from '../types';
import { profileApi } from '../api/profileApi';
interface ProfileContextType {
  user: UserProfile | null; loading: boolean; error: string;
  updateProfile: (patch: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>; logout: () => void;
}
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('ProfileProvider is required');
  return context;
};
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionVersion = useAuthSession();
  const requestVersion = useRef(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchProfile = useCallback(async () => {
    const version = ++requestVersion.current;
    const token = getAccessToken();
    const current = () => version === requestVersion.current && token === getAccessToken();
    setUser(null); setLoading(true); setError('');
    if (!token) { setLoading(false); return; }
    try { const profile = await profileApi.getProfile(); if (current()) setUser(profile); }
    catch (e) {
      if (current()) {
        setUser(null); setError((e as Error).message || 'Could not load profile');
        if (getAuthErrorStatus(e) === 401) setAccessToken(null);
      }
    } finally { if (current()) setLoading(false); }
  }, []);
  useEffect(() => {
    void fetchProfile();
    return () => { requestVersion.current++; };
  }, [fetchProfile, sessionVersion]);
  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const updated = await profileApi.updateProfile(patch);
    setUser(updated); return updated;
  }, []);
  const logout = useCallback(() => {
    setAccessToken(null); setUser(null);
    setError('Your session has ended. Please sign in.');
  }, []);
  const value = useMemo(() => ({ user, loading, error, updateProfile, refreshProfile: fetchProfile, logout }),
    [user, loading, error, updateProfile, fetchProfile, logout]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
