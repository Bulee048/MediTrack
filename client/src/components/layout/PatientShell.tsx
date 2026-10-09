import { type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ChevronLeft, Clock3, Home, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/app/queue', label: 'Queue', icon: Clock3 },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User2 },
];

export function PatientShell({
  children,
  title,
  back,
  action,
  hideTabs,
  fullBleed,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean | (() => void);
  action?: ReactNode;
  hideTabs?: boolean;
  fullBleed?: boolean;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goBack = () => {
    if (typeof back === 'function') back();
    else navigate(-1);
  };

  const showHeader = Boolean(title || back);

  return (
    <div className="relative mx-auto flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-canvas md:h-[860px] md:max-h-[94vh] md:w-[404px] md:rounded-[2.4rem] md:device-shadow">
      <StatusBar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto hide-scrollbar">
        {showHeader && (
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-canvas/95 px-5 py-4 backdrop-blur">
            {back && (
              <button
                onClick={goBack}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 motion-reduce:transition-none"
                aria-label="Go back"
              >
                <ChevronLeft size={19} />
              </button>
            )}
            <h1 className="min-w-0 flex-1 truncate text-[19px] font-extrabold tracking-tight text-ink">{title}</h1>
            {action}
          </header>
        )}
        <div className={cn('min-w-0 px-4 pb-6 min-[360px]:px-5', showHeader ? 'pt-0' : 'pt-5', fullBleed && 'px-0 min-[360px]:px-0')}>{children}</div>
      </main>
      {!hideTabs && <BottomBar pathname={pathname} />}
      <HomeIndicator />
    </div>
  );
}

function BottomBar({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Patient navigation" className="z-30 shrink-0 border-t border-line bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:pb-0">
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname === t.to || pathname.startsWith(`${t.to}/`);
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                'relative flex min-w-0 flex-col items-center gap-1 py-1.5 text-[9px] font-semibold transition min-[360px]:text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700 motion-reduce:transition-none',
                active ? 'text-brand-700' : 'text-ink-soft',
              )}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              {t.label}
              {active && <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-brand-600" />}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function StatusBar() {
  return (
    <div className="hidden shrink-0 items-center justify-between px-7 pt-3 text-[11px] font-bold text-ink md:flex">
      <span>9:41</span>
      <span className="h-5 w-24 rounded-full bg-ink" />
      <span className="flex items-center gap-1">
        <svg width="16" height="11" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <path d="M8 11.2 5.6 8.8a3.4 3.4 0 0 1 4.8 0L8 11.2Z" />
          <path d="M11.6 6.9a4.4 4.4 0 0 0-7.2 0L3 5.5a6.2 6.2 0 0 1 10 0l-1.4 1.4Z" opacity=".9" />
          <path d="M14.4 4a8 8 0 0 0-12.8 0L.2 2.6a9.8 9.8 0 0 1 15.6 0L14.4 4Z" opacity=".8" />
        </svg>
        <span className="relative inline-block h-[11px] w-[24px] rounded-[3px] border border-ink/40">
          <span className="absolute inset-[1.5px] right-[5px] rounded-[1.5px] bg-ink" />
          <span className="absolute -right-[3px] top-1/2 h-[4px] w-[2px] -translate-y-1/2 rounded-r bg-ink/40" />
        </span>
      </span>
    </div>
  );
}

function HomeIndicator() {
  return <div className="flex h-5 shrink-0 items-center justify-center bg-white md:bg-canvas/0"><span className="h-[5px] w-32 rounded-full bg-ink/80" /></div>;
}
