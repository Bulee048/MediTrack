/**
 * Staff session cache.
 *
 * The JWT lives in localStorage (shared across tabs), so the cached profile
 * lives there too — otherwise opening the console in a second tab would have a
 * valid token but no user, and bounce back to the login screen.
 * `fetchStaffUser()` rehydrates from the API when the cache is empty.
 */
import { api, tokenStore } from './api';
import type { User } from './types';

const KEY = 'medqueue.staffUser';

export function readStaffUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function writeStaffUser(user: User): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable (private mode) — the session just won't persist */
  }
}

export function clearStaffUser(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Resolves the staff profile from the API using the stored token. */
export async function fetchStaffUser(): Promise<User | null> {
  if (!tokenStore.getStaff()) return null;
  try {
    const user = await api.staff.me();
    writeStaffUser(user);
    return user;
  } catch {
    return null;
  }
}
