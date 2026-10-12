import { getAccessToken, setAccessToken, useAuthSession, getAuthErrorStatus } from '@/config/api';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { UserProfile } from '../types';
import { profileApi } from '../api/profileApi';
import { isTransientProfileFailure, profileRetryDelay, scheduleProfileRecovery } from './profileRecovery';
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
  const [recoverable, setRecoverable] = useState(false);
  const recoveryAttempts = useRef(0);
  const fetchProfile = useCallback(async () => {
    const version = ++requestVersion.current;
    const token = getAccessToken();
    const current = () => version === requestVersion.current && token === getAccessToken();
    setUser(null); setLoading(true); setError(''); setRecoverable(false);
    if (!token) { setLoading(false); return; }
    try { const profile = await profileApi.getProfile(); if (current()) { recoveryAttempts.current = 0; setUser(profile); } }
    catch (e) {
      if (current()) {
        const transient = isTransientProfileFailure(e);
        setUser(null); setError(transient ? 'Unable to load your account right now. Please check your connection or try again.' : (e as Error).message || 'Could not load profile');
        setRecoverable(transient);
        if (getAuthErrorStatus(e) === 401) setAccessToken(null);
      }
    } finally { if (current()) setLoading(false); }
  }, []);
  useEffect(() => {
    recoveryAttempts.current = 0;
    void fetchProfile();
    return () => { requestVersion.current++; };
  }, [fetchProfile, sessionVersion]);
  useEffect(() => {
    if (!recoverable || loading || !getAccessToken()) return;
    // Keep recovery alive through long outages, but cap its request rate.
    // Online/focus events recover immediately without duplicate attempts.
    return scheduleProfileRecovery(() => { recoveryAttempts.current++; void fetchProfile(); }, window, profileRetryDelay(recoveryAttempts.current));
  }, [recoverable, loading, fetchProfile, sessionVersion]);
  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const token = getAccessToken();
    const version = requestVersion.current;
    const updated = await profileApi.updateProfile(patch);
    if (token === getAccessToken() && version === requestVersion.current) setUser(updated);
    return updated;
  }, []);
  const logout = useCallback(() => {
    setAccessToken(null); setUser(null);
    setError('Your session has ended. Please sign in.');
  }, []);
  const value = useMemo(() => ({ user, loading, error, updateProfile, refreshProfile: fetchProfile, logout }),
    [user, loading, error, updateProfile, fetchProfile, logout]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
