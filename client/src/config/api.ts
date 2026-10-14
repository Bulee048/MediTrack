import axios from 'axios';
import { useSyncExternalStore } from 'react';
import { AUTH_CHANGED_EVENT, clearAuthToken, getAuthToken, getAuthSessionVersion, setAuthToken } from '@/features/auth/auth.storage';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
function subscribe(onChange: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
}
export function useAuthSession() { return useSyncExternalStore(subscribe, getAuthSessionVersion, () => 0); }
export const getAccessToken = getAuthToken;
export function setAccessToken(token: string | null) { if (token) setAuthToken(token); else clearAuthToken(); }
export function getAuthErrorStatus(error: unknown): 401 | 403 | undefined {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 401 || status === 403 ? status : undefined;
}
export const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, withCredentials: true });
apiClient.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
apiClient.interceptors.response.use(response => response, (error: unknown) => {
  if (axios.isAxiosError(error)) {
    // A delayed response from an old session must not log out the next patient.
    if (error.response?.status === 401 && getAuthToken()
      && error.config?.headers.get('Authorization') === `Bearer ${getAuthToken()}`
      && !['/auth/login', '/auth/register'].includes(error.config?.url ?? '')) clearAuthToken();
    if (typeof error.response?.data?.message === 'string') error.message = error.response.data.message;
  }
  return Promise.reject(error);
});
