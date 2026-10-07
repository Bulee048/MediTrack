import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface JwtPayload {
  id: string;
  role: UserRole;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
