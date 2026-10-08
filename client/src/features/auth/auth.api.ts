import { apiClient } from '@/config/api';
import type { AuthOtpConfig, AuthOtpRequest, AuthOtpVerification, AuthSession, PatientRegistrationDraft } from './types';

export async function getOtpConfig() {
  const { data } = await apiClient.get<AuthOtpConfig>('/auth/otp/config');
  return data;
}

export async function requestOtp(phone: string) {
  const { data } = await apiClient.post<AuthOtpRequest>('/auth/otp/request', { phone });
  return data;
}

export async function verifyOtp(input: AuthOtpVerification) {
  const { data } = await apiClient.post<AuthSession>('/auth/otp/verify', input);
  return data;
}

export async function registerPatient(draft: PatientRegistrationDraft) {
  const { data } = await apiClient.post<AuthSession>('/auth/register', draft);
  return data;
}