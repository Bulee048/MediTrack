import { authMockConfig, mockGetOtpConfig, mockRegisterPatient, mockRequestOtp, mockVerifyOtp } from './mock';
import { getOtpConfig as getOtpConfigApi, registerPatient as registerPatientApi, requestOtp as requestOtpApi, verifyOtp as verifyOtpApi } from './auth.api';
import type { AuthOtpConfig, AuthOtpRequest, AuthOtpVerification, AuthSession, PatientRegistrationDraft } from './types';

const useMockData = import.meta.env.VITE_USE_FEATURE_MOCKS !== 'false';

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