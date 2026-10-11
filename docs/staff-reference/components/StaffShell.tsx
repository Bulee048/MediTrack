/**
 * Staff console shell (desktop web app).
 * Sidebar navigation + top bar with search, notifications and the signed-in user.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ClipboardPlus, Search } from 'lucide-react';
import { Logo, Wordmark } from './Brand';
import { DatabaseStatus } from './DatabaseStatus';
import { Badge, Button, Input } from './ui';
import { api, tokenStore } from '@/lib/api';
import { navFor, permissionsOf, ROLE_LABEL, scopeLabel } from '@/lib/staffAccess';
import { cn, initials } from '@/lib/utils';
import type { User } from '@/lib/types';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/staff': { title: 'OPD Control Dashboard', subtitle: 'Overview of live hospital queue statistics, doctor sessions, and current department load.' },
  '/staff/appointments': { title: "Today's OPD Appointments", subtitle: 'Check-in scheduled patients, manage slot timing, and assign departments.' },
  '/staff/queue': { title: 'Real-Time OPD Queue Board', subtitle: 'Monitor physical queue positions, live doctor consult status, and call next token numbers.' },
  '/staff/patients': { title: 'Patient Directory', subtitle: 'Search every registered patient, their appointments and current queue state.' },
  '/staff/walk-in': { title: 'New Walk-In OPD Registration', subtitle: 'Register quick walk-in patients, record instant vitals, and issue immediate queue tokens.' },
  '/staff/doctors': { title: 'Doctor availability schedule', subtitle: 'Add new doctors, edit their profiles, and manage roster periods and leaves.' },
  '/staff/consultation': { title: 'Patient Consultation', subtitle: 'Record vitals, clinical notes and prescriptions for the patient in front of you.' },
  '/staff/database': { title: 'Database', subtitle: 'Browse every collection the app has stored, so you can confirm your entries were really saved.' },
  '/staff/team': { title: 'Team & Access', subtitle: 'Invite colleagues, assign roles, and control exactly what each account can reach.' },
  '/staff/otp': { title: 'OTP Delivery Console', subtitle: 'Configure how verification codes are delivered and audit which user received each code.' },
  '/staff/flow': { title: 'OPD Action & Flow Controls', subtitle: 'Manage delays, pause consultations, and dispatch queue notifications dynamically.' },
  '/staff/stats': { title: 'Analytics & OPD statistics', subtitle: 'Overview of live hospital queue statistics, doctor sessions, and current department load.' },
  '/staff/settings': { title: 'System Settings', subtitle: 'Lobby display, audio announcements, SMS gateway and security preferences.' },
};

export function StaffShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(true);

  const meta = PAGE_META[pathname] ?? { title: 'MediTrack Staff Console', subtitle: '' };

  /**
   * What this role may reach. Falls back to the restrictive set so a stale
   * cache can never hand a receptionist the admin menu.
   */
  const perms = useMemo(() => permissionsOf(user), [user]);
  const visible = useMemo(() => navFor(perms), [perms]);

  useEffect(() => {
    const es = new EventSource(`${import.meta.env.VITE_API_BASE ?? '/api'}/events/stream?access_token=${tokenStore.getStaff()}`);
    es.addEventListener('system', () => setUnread((n) => n + 1));
    es.onopen = () => setOnline(true);
    es.onerror = () => setOnline(false);
    return () => es.close();
  }, []);

  useEffect(() => {
    // Load the skipped-call count once; the SSE stream keeps it fresh afterwards.
    api.staff
      .callLogs(3)
      .then((logs) => setUnread(logs.filter((l) => l.outcome === 'Skipped').length))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ---------------------------- sidebar --------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logo size={34} />
          <div className="leading-tight">
            <Wordmark size="sm" />
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Staff Console</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-4 overflow-y-auto px-3">
          {visible.map((group) => (
            <div key={group.heading}>
              <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                {group.heading}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={17} strokeWidth={isActive ? 2.4 : 1.9} />
                        <span className="flex-1">{item.label}</span>
                        {item.needs === 'manageStaff' && (
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-purple-700">
                            Admin
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {perms.registerWalkIns && (
            <button
              onClick={() => navigate('/staff/walk-in')}
              className="flex w-full items-center gap-3 rounded-xl bg-brand-600 px-3 py-2.5 text-[13.5px] font-semibold text-white shadow-soft transition hover:bg-brand-700"
            >
              <ClipboardPlus size={17} />
              Register Walk-in
            </button>
          )}
        </nav>

        <div className="space-y-3 p-3">
          <div className="rounded-2xl border border-line bg-canvas px-4 py-3">
            <p className="text-[12.5px] font-bold text-ink">St. Jude Medical</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-muted">
              <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'bg-success' : 'bg-warn')} />
              {online ? 'System Online' : 'Reconnecting…'}
            </p>
            <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-ink-faint">
              Signed in as{' '}
              <span className={cn('font-bold', perms.isAdmin ? 'text-purple-600' : 'text-brand-600')}>
                {ROLE_LABEL[perms.role]}
              </span>
              {' · '}
              {scopeLabel(perms)}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="w-full rounded-2xl border border-danger/50 px-4 py-2.5 text-[13px] font-bold text-danger-600 transition hover:bg-danger-soft"
          >
            Log Out Account
          </button>
        </div>
      </aside>

      {/* ----------------------------- main ----------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[236px]">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex items-center gap-5 px-5 py-3.5 lg:px-8">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[22px] font-extrabold tracking-tight text-ink">{meta.title}</h1>
              {meta.subtitle && <p className="mt-0.5 hidden truncate text-[12.5px] text-ink-muted sm:block">{meta.subtitle}</p>}
            </div>

            <div className="relative hidden md:block">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient ID, doctor…"
                className="h-10 w-[260px] rounded-full bg-canvas pl-9"
                icon={<Search size={16} />}
              />
            </div>

            <button
              onClick={() => navigate('/staff/queue')}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-soft transition hover:bg-canvas"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />}
            </button>

            <div className="hidden items-center gap-3 border-l border-line pl-5 sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-[13px] font-extrabold text-brand-700">
                {initials(user.name)}
              </span>
              <div className="leading-tight">
                <p className="text-[13.5px] font-bold text-ink">{user.name}</p>
                <p className="text-[11.5px] font-semibold text-brand-600">{ROLE_LABEL[perms.role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8">
          <DatabaseStatus className="mb-5 max-w-2xl" />
          {children}
        </main>
      </div>
    </div>
  );
}

export function StaffPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export { Badge, Button };
