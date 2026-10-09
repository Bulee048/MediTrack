import { apiClient } from '@/config/api';
import type { AuthLoginResponse, AuthMeResponse, AuthOtpConfig, AuthOtpRequest, AuthOtpVerification, AuthSession, LoginInput, PatientRegistrationDraft, RegisterInput } from './types';

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

export async function registerPatientAccount(input: RegisterInput) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: { user: AuthMeResponse['user'] } }>('/auth/register', input);
  return data.data.user;
}

export async function loginPatientAccount(input: LoginInput) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: AuthLoginResponse }>('/auth/login', input);
  return data.data;
}

export async function getCurrentPatient() {
  const { data } = await apiClient.get<{ success: boolean; message: string; data: AuthMeResponse }>('/auth/me');
  return data.data.user;
}