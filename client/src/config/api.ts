import axios from 'axios';
import { useSyncExternalStore } from 'react';
import { clearAuthToken, getAuthToken } from '@/features/auth/auth.storage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY = 'meditrack.accessToken';
const AUTH_CHANGED_EVENT = 'meditrack.authChanged';
let authSessionVersion = 0;

function subscribeToAuthSession(onChange: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
}

// Scope query caches to login/logout changes without putting JWTs in query keys.
export function useAuthSession(): number {
  return useSyncExternalStore(subscribeToAuthSession, () => authSessionVersion, () => 0);
}

// Shared contract for login/logout UI
export function getAccessToken(): string | null {
  const token = getAuthToken();
  if (token) return token;
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (getAccessToken() === token) return;
  if (token) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  authSessionVersion += 1;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAuthErrorStatus(error: unknown): 401 | 403 | undefined {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 401 || status === 403 ? status : undefined;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken();
    }
    if (typeof error?.response?.data?.message === 'string') error.message = error.response.data.message;
    return Promise.reject(error);
  },
);
