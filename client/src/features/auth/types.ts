export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  nic?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email?: string;
  phone: string;
  password: string;
}

export interface AuthLoginResponse {
  user: AuthUser;
  token: string;
}

export interface AuthMeResponse {
  user: AuthUser;
}