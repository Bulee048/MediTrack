import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';
export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <span className={cn('brand-lockup', className)}>
    <span className="brand-symbol"><HeartPulse size={23} strokeWidth={2} aria-hidden="true" /></span>
    {!compact && <span><span className="block text-xl font-extrabold tracking-tight text-ink">Medi<span className="text-brand-700">Track</span></span><span className="block text-xs font-medium tracking-wide text-ink-muted">Your care, connected</span></span>}
  </span>;
}
