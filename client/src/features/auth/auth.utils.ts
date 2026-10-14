import { isAxiosError } from 'axios';

export function getAuthErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    return message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

export function getLoginPayload(identifier: string, password: string) {
  const value = identifier.trim();
  if (value.includes('@')) {
    return { email: value.toLowerCase(), password };
  }

  return { phone: normalizePhone(value), password };
}