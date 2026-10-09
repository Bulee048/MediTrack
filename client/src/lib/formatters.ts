export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const DOW_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysISO(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function fromISO(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
}

/**
 * The 6x7 day grid for a month, Monday first.
 */
export function monthGrid(monthDate: Date): { iso: string; day: number; inMonth: boolean }[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  // getDay() is Sunday=0; shift so Monday=0.
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: todayISO(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

/** Format as "8 Oct 2026" */
export function fmtMediumDate(iso: string) {
  if (!iso) return '—';
  const d = fromISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export const fmtLongDate = fmtMediumDate;

export function fmtWeekday(iso: string) {
  return fromISO(iso).toLocaleDateString('en-US', { weekday: 'long' });
}

export function fmtTimeOfDay(iso: string) {
  return fromISO(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function age(dob?: string) {
  if (!dob) return 0;
  const d = fromISO(dob);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Formats currency: `Rs 500` */
export const inr = (n: number) => `Rs ${n.toLocaleString('en-IN')}`;

export const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
  completed: { label: 'Completed', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-danger-soft text-danger-600 border-danger/20' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-info-soft text-info border-info/20' },
  no_show: { label: 'No Show', cls: 'bg-danger-soft text-danger-600 border-danger/20' },
  waiting: { label: 'Waiting', cls: 'bg-warn-soft text-warn border-warn/20' },
  called: { label: 'Called', cls: 'bg-info-soft text-info border-info/20' },
  in_consultation: { label: 'In Consultation', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
  on_hold: { label: 'On Hold', cls: 'bg-warn-soft text-warn border-warn/20' },
  skipped: { label: 'Skipped', cls: 'bg-danger-soft text-danger-600 border-danger/20' },
  paid: { label: 'Paid', cls: 'bg-success-soft text-success border-success/20' },
  pending: { label: 'Payment Due', cls: 'bg-warn-soft text-warn border-warn/20' },
  refunded: { label: 'Refunded', cls: 'bg-info-soft text-info border-info/20' },
};
