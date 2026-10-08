import type { AuthOtpConfig, AuthOtpRequest, AuthOtpVerification, AuthSession, PatientRegistrationDraft } from './types';

const MOCK_PHONE = '+949876543210';
const MOCK_OTP = '4821';

export const authMockConfig: AuthOtpConfig = {
  otpLength: 4,
  resendSeconds: 45,
  gatewayReady: false,
  deliveryChannel: 'console',
  senderId: 'MediTrack',
};

export const authMockOtpRequest = (phone: string): AuthOtpRequest => ({
  phone,
  maskedPhone: maskPhone(phone),
  isNewUser: false,
  expiresInSeconds: 300,
  resendInSeconds: authMockConfig.resendSeconds,
  otpLength: authMockConfig.otpLength,
  deliveryChannel: authMockConfig.deliveryChannel,
  sentViaSms: false,
  gateway: 'console',
});

export const authMockSession = (phone: string, name = 'Nayana Perera'): AuthSession => ({
  token: 'mock-patient-token',
  user: {
    id: 'patient-1001',
    name,
    phone,
    role: 'patient',
    dob: '1994-06-17',
    gender: 'Female',
    email: 'nayana@example.com',
  },
  isNewUser: false,
  settings: {
    textSize: 'medium',
    highContrast: false,
    language: 'en',
  },
});

export async function mockGetOtpConfig() {
  return authMockConfig;
}

export async function mockRequestOtp(phone: string) {
  return authMockOtpRequest(phone || MOCK_PHONE);
}

export async function mockVerifyOtp(input: AuthOtpVerification) {
  if (input.code !== MOCK_OTP) {
    throw new Error('Invalid verification code');
  }

  return authMockSession(input.phone, input.name?.trim() || 'Nayana Perera');
}

export async function mockRegisterPatient(draft: PatientRegistrationDraft) {
  return authMockSession(draft.phone ? `+${draft.phone.replace(/\D/g, '')}` : MOCK_PHONE, draft.fullName.trim() || 'New Patient');
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 ? `+${digits.slice(0, 2)} ••••••${digits.slice(-5)}` : phone;
}