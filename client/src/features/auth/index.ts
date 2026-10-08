export * from './types';
export * from './mock';
export { getOtpConfig, requestOtp, verifyOtp, registerPatient as registerPatientApi } from './auth.api';
export { authMockConfig, getAuthOtpConfig, sendAuthOtp, confirmAuthOtp, registerPatient } from './auth.service';