const AUTH_TOKEN_KEY = 'meditrack.auth.token';
export const AUTH_CHANGED_EVENT = 'meditrack-auth-change';
let sessionVersion = 0;
export const getAuthSessionVersion = () => sessionVersion;
function notifySessionChange() {
  sessionVersion++;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === AUTH_TOKEN_KEY || event.key === null) notifySessionChange();
});

export function getAuthToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (getAuthToken() === token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifySessionChange();
}

export function clearAuthToken() {
  if (!getAuthToken()) return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  notifySessionChange();
}
