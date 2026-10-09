import { AppError } from './AppError.js';

// MediTrack operates in Asia/Colombo (UTC+05:30, no daylight saving).
// Queue counters and visibility use this day regardless of the server host timezone.
const offsetMs = 330 * 60 * 1000;

export function getQueueDayKey(date: Date = new Date()): string {
  if (Number.isNaN(date.getTime())) throw new AppError('Invalid queue date', 400);
  return new Date(date.getTime() + offsetMs).toISOString().slice(0, 10);
}

export function getQueueDayRange(date: Date | string = new Date()) {
  const key = typeof date === 'string' ? date : getQueueDayKey(date);
  const midnight = new Date(`${key}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || Number.isNaN(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== key) {
    throw new AppError('Queue date must be a valid YYYY-MM-DD date', 400);
  }
  const start = new Date(midnight.getTime() - offsetMs);
  return { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}
