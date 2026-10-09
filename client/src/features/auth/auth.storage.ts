import { getAccessToken, setAccessToken } from '@/config/api';

export function getAuthToken() {
  return getAccessToken();
}

export function setAuthToken(token: string) {
  setAccessToken(token);
}

export function clearAuthToken() {
  setAccessToken(null);
}
