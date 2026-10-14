const AUTH_TOKEN_KEY = 'meditrack.auth.token';
const STAFF_TOKEN_KEY = 'meditrack.staff.auth.token';
const activeKey = () => typeof window !== 'undefined' && window.location?.pathname.startsWith('/staff') ? STAFF_TOKEN_KEY : AUTH_TOKEN_KEY;
export const AUTH_CHANGED_EVENT = 'meditrack-auth-change';
let sessionVersion = 0;
export const getAuthSessionVersion = () => sessionVersion;
function notifySessionChange() {
  sessionVersion++;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === activeKey() || event.key === null) notifySessionChange();
});

export function getAuthToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(activeKey());
}

export function setAuthToken(token: string) {
  if (getAuthToken() === token) return;
  localStorage.setItem(activeKey(), token);
  notifySessionChange();
}

export function clearAuthToken() {
  if (!getAuthToken()) return;
  localStorage.removeItem(activeKey());
  notifySessionChange();
}
