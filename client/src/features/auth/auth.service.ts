import { authMockConfig, mockCurrentPatient, mockGetOtpConfig, mockLoginAccount, mockRegisterAccount, mockRegisterPatient, mockRequestOtp, mockVerifyOtp } from './mock';
import { getCurrentPatient as getCurrentPatientApi, getOtpConfig as getOtpConfigApi, loginPatientAccount as loginPatientApi, registerPatient as registerPatientApi, registerPatientAccount as registerPatientAccountApi, requestOtp as requestOtpApi, verifyOtp as verifyOtpApi } from './auth.api';
import type { AuthLoginResponse, AuthOtpConfig, AuthOtpRequest, AuthOtpVerification, AuthSession, AuthUser, LoginInput, PatientRegistrationDraft, RegisterInput } from './types';
import { clearAuthToken, getAuthToken, setAuthToken } from './auth.storage';
import { getLoginPayload } from './auth.utils';

const useMockData = import.meta.env.VITE_USE_FEATURE_MOCKS === 'true';

export async function getAuthOtpConfig(): Promise<AuthOtpConfig> {
  return useMockData ? mockGetOtpConfig() : getOtpConfigApi();
}

export async function sendAuthOtp(phone: string): Promise<AuthOtpRequest> {
  return useMockData ? mockRequestOtp(phone) : requestOtpApi(phone);
}

export async function confirmAuthOtp(input: AuthOtpVerification): Promise<AuthSession> {
  return useMockData ? mockVerifyOtp(input) : verifyOtpApi(input);
}

export async function registerPatient(draft: PatientRegistrationDraft): Promise<AuthSession> {
  return useMockData ? mockRegisterPatient(draft) : registerPatientApi(draft);
}

export { authMockConfig };

export async function loginPatient(input: LoginInput): Promise<AuthLoginResponse> {
  const session = useMockData ? await mockLoginAccount(input) : await loginPatientApi(input);
  setAuthToken(session.token);
  return session;
}

export async function registerPatientAccount(input: RegisterInput): Promise<AuthUser> {
  return useMockData ? (await mockRegisterAccount(input)).user : registerPatientAccountApi(input);
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not signed in');
  }

  return { user: useMockData ? await mockCurrentPatient() : await getCurrentPatientApi() };
}

export function logoutPatient() {
  clearAuthToken();
}

export function buildLoginInput(identifier: string, password: string): LoginInput {
  return getLoginPayload(identifier, password);
}