import { getCurrentPatient, loginPatientAccount, registerPatientAccount as registerAccount } from './auth.api';
import type { LoginInput, RegisterInput } from './types';
import { clearAuthToken, getAuthToken, setAuthToken } from './auth.storage';
import { getLoginPayload } from './auth.utils';
export async function loginPatient(input: LoginInput) {
  const session = await loginPatientAccount(input);
  if (session.user.role !== 'PATIENT') throw new Error('Sign in with a patient account');
  setAuthToken(session.token);
  return session;
}
export const registerPatientAccount = (input: RegisterInput) => registerAccount(input);
export async function fetchCurrentUser() {
  if (!getAuthToken()) throw new Error('Not signed in');
  return { user: await getCurrentPatient() };
}
export function logoutPatient() { clearAuthToken(); }
export function buildLoginInput(identifier: string, password: string) { return getLoginPayload(identifier, password); }
