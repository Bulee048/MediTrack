import axios from 'axios';
import { useSyncExternalStore } from 'react';
import { AUTH_CHANGED_EVENT, clearAuthToken, getAuthToken, getAuthSessionVersion, setAuthToken } from '@/features/auth/auth.storage';

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && localStorage.getItem('meditrack.custom_api_url')) {
    return localStorage.getItem('meditrack.custom_api_url')!;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5004/api`;
  }
  return 'http://192.168.2.236:5004/api';
}

export const API_BASE_URL = resolveApiBaseUrl();
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
