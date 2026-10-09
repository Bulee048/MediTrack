import { type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, Home, User2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhoneShellProps {
  children: ReactNode;
  title?: string;
  back?: boolean | (() => void);
  action?: ReactNode;
  hideTabs?: boolean;
  fullBleed?: boolean;
}

const TABS = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/app/book/family', label: 'Family', icon: Users },
  { to: '/app/profile', label: 'Profile', icon: User2 },
];

export function PhoneShell({
  children,
  title,
  back,
  action,
  hideTabs,
  fullBleed,
}: PhoneShellProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goBack = () => {
    if (typeof back === 'function') {
      back();
    } else {
      navigate(-1);
    }
  };

  const showHeader = Boolean(title || back);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-200/50 p-0 md:p-6 antialiased">
      <div className="relative mx-auto flex min-h-screen w-full flex-col bg-canvas md:min-h-0 md:h-[860px] md:max-h-[94vh] md:w-[410px] md:overflow-hidden md:rounded-[2.4rem] md:device-shadow border-0 md:border md:border-slate-800/10">
        <StatusBar />
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {showHeader && (
            <header className="sticky top-0 z-30 flex items-center gap-3 bg-canvas/95 px-5 py-4 backdrop-blur border-b border-line/60">
              {back && (
                <button
                  type="button"
                  onClick={goBack}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft transition hover:bg-brand-50 hover:text-brand-700 min-h-0"
                  aria-label="Go back"
                >
                  <ChevronLeft size={19} />
                </button>
              )}
              <h1 className="min-w-0 flex-1 truncate text-[19px] font-extrabold tracking-tight text-ink">
                {title}
              </h1>
              {action}
            </header>
          )}
          <div className={cn('px-5 pb-6', showHeader ? 'pt-4' : 'pt-5', fullBleed && 'px-0')}>
            {children}
          </div>
        </div>
        {!hideTabs && <BottomBar pathname={pathname} />}
        <HomeIndicator />
      </div>
    </div>
  );
}

function BottomBar({ pathname }: { pathname: string }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line bg-white/95 pb-1 pt-1.5 backdrop-blur md:pb-0">
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const active =
            pathname === t.to ||
            (t.to === '/app/home' && pathname === '/') ||
            (t.to !== '/app/home' && pathname.startsWith(t.to));
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1.5 text-[10.5px] font-semibold transition min-h-0',
                active ? 'text-brand-600 font-bold' : 'text-ink-muted hover:text-ink'
              )}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span>{t.label}</span>
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
    <div className="hidden shrink-0 items-center justify-between px-7 pt-3 text-[11px] font-bold text-ink md:flex select-none">
      <span>9:41</span>
      <span className="h-5 w-24 rounded-full bg-ink/90" />
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
  return (
    <div className="flex h-5 shrink-0 items-center justify-center bg-white md:bg-canvas/0">
      <span className="h-[5px] w-32 rounded-full bg-ink/80" />
    </div>
  );
}
