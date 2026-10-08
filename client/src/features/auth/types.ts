export type PatientGender = 'Male' | 'Female' | 'Other';
export type OtpDeliveryChannel = 'sms' | 'whatsapp' | 'console';

export interface AuthOtpConfig {
  otpLength: 4 | 6;
  resendSeconds: number;
  gatewayReady: boolean;
  deliveryChannel: OtpDeliveryChannel;
  senderId: string;
}

export interface AuthOtpRequest {
  phone: string;
  maskedPhone: string;
  isNewUser: boolean;
  expiresInSeconds: number;
  resendInSeconds: number;
  otpLength: 4 | 6;
  deliveryChannel: OtpDeliveryChannel;
  sentViaSms: boolean;
  gateway: string;
}

export interface AuthOtpVerification {
  phone: string;
  code: string;
  name?: string;
}

export interface AuthSessionUser {
  id: string;
  name: string;
  phone: string;
  role: 'patient';
  email?: string;
  dob?: string;
  gender?: PatientGender;
}

export interface AuthSession {
  token: string;
  user: AuthSessionUser;
  isNewUser: boolean;
  settings: {
    textSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    language: string;
  };
}

export interface PatientRegistrationDraft {
  fullName: string;
  phone: string;
  dob?: string;
  gender?: PatientGender;
  email?: string;
  bloodGroup?: string;
  insurance?: string;
  emergencyContact?: string;
}