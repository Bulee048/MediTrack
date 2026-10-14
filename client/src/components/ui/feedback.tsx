import type { ComponentType, ReactNode } from 'react';
import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('ui-spinner h-5 w-5 shrink-0', className)} aria-hidden="true" />;
}
export function LoadingState({ label = 'Loading your information', compact = false }: { label?: string; compact?: boolean }) {
  return <div role="status" className={cn('loading-state', compact && 'loading-state-compact')}>
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"><Spinner />{label}</span>
    {!compact && <div aria-hidden="true" className="mt-5 grid gap-3"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-20 w-full" /></div>}
  </div>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="state-symbol"><Inbox size={26} aria-hidden="true" /></span><h2 className="mt-4 text-lg font-bold text-ink">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
export function ErrorState({ title = 'Something interrupted this request', message, retry }: { title?: string; message: string; retry?: () => void }) {
  return <div role="alert" className="error-state"><AlertCircle size={23} aria-hidden="true" /><div className="min-w-0"><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-relaxed">{message}</p>{retry && <Button variant="outline" className="mt-3" onClick={retry}><RefreshCw size={16} />Try again</Button>}</div></div>;
}
/** Inline confirmed-result feedback. Only render after the server has confirmed the operation. */
export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'success' | 'error'; children: ReactNode; className?: string }) {
  return <p role={tone === 'error' ? 'alert' : 'status'} data-tone={tone} className={cn('notice', className)}>{children}</p>;
}
/** Consistent section heading used across the operational workspaces. */
export function SectionHeader({ icon: Icon, title, description, actions }: { icon?: ComponentType<{ size?: number; className?: string }>; title: string; description?: string; actions?: ReactNode }) {
  return <div className="section-header">{Icon && <span className="state-symbol h-11 w-11 rounded-2xl"><Icon size={20} aria-hidden="true" /></span>}<div className="min-w-0 flex-1"><h2 className="section-title">{title}</h2>{description && <p className="section-description">{description}</p>}</div>{actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div>}</div>;
}
