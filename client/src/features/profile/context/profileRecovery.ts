import axios from 'axios';

export function isTransientProfileFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status === 429 || status >= 500;
}

export const profileRetryDelay = (attempt: number) => Math.min(30000, 5000 * 2 ** Math.min(attempt, 3));

/** One attempt per subscription, with bounded backoff and session-safe cancellation. */
export function scheduleProfileRecovery(retry: () => void, target: Window, delay = 5000): () => void {
  let started = false;
  const resume = () => {
    if (started) return;
    started = true;
    retry();
  };
  const timer = target.setTimeout(resume, delay);
  target.addEventListener('online', resume);
  target.addEventListener('focus', resume);
  return () => {
    started = true;
    target.clearTimeout(timer);
    target.removeEventListener('online', resume);
    target.removeEventListener('focus', resume);
  };
}
