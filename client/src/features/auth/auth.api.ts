import { apiClient } from '@/config/api';
import type { AuthLoginResponse, AuthMeResponse, LoginInput, RegisterInput } from './types';
export async function registerPatientAccount(input: RegisterInput) {
  const { data } = await apiClient.post<{ success: boolean; data: AuthMeResponse }>('/auth/register', input);
  return data.data.user;
}
export async function loginPatientAccount(input: LoginInput) {
  const { data } = await apiClient.post<{ success: boolean; data: AuthLoginResponse }>('/auth/login', input);
  return data.data;
}
export async function getCurrentPatient() {
  const { data } = await apiClient.get<{ success: boolean; data: AuthMeResponse }>('/auth/me');
  return data.data.user;
}
