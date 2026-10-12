import { CheckCircle2, Clock3, CircleX, PauseCircle, PhoneCall, Stethoscope, Timer, UserCheck } from 'lucide-react';
const states = {
  WAITING: { label: 'Waiting', icon: Clock3, tone: 'neutral' },
  ALMOST_TURN: { label: 'Almost your turn', icon: Timer, tone: 'warning' },
  CALLING: { label: 'Calling', icon: PhoneCall, tone: 'brand' },
  IN_CONSULTATION: { label: 'In consultation', icon: Stethoscope, tone: 'info' },
  HELD: { label: 'On hold', icon: PauseCircle, tone: 'warning' },
  SKIPPED: { label: 'Skipped', icon: CircleX, tone: 'neutral' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, tone: 'success' },
  CANCELLED: { label: 'Cancelled', icon: CircleX, tone: 'danger' },
  BOOKED: { label: 'Booked', icon: UserCheck, tone: 'brand' },
  RESCHEDULED: { label: 'Rescheduled', icon: Clock3, tone: 'info' },
};
export function StatusBadge({ status }: { status: string }) {
  const state = states[status as keyof typeof states] ?? { label: status.replaceAll('_', ' '), icon: Clock3, tone: 'neutral' };
  const Icon = state.icon;
  return <span className="status-badge" data-tone={state.tone}><Icon size={15} aria-hidden="true" />{state.label}</span>;
}
