import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  Users,
  ClipboardPlus,
  Stethoscope,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { Logo, Wordmark } from '@/components/Brand';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    heading: 'Core Queue & OPD',
    items: [
      { to: '/staff', label: 'OPD Dashboard', icon: LayoutDashboard, end: true },
      { to: '/staff/appointments', label: "Today's Appointments", icon: CalendarDays },
      { to: '/staff/queue', label: 'Live Queue Board', icon: Clock3 },
      { to: '/staff/patients', label: 'Patient Directory', icon: Users },
    ],
  },
  {
    heading: 'Clinical & Roster',
    items: [
      { to: '/staff/doctors', label: 'Doctor Availability', icon: Stethoscope },
      { to: '/staff/stats', label: 'OPD Analytics', icon: BarChart3 },
      { to: '/staff/settings', label: 'System Settings', icon: Settings },
    ],
  },
];

export function StaffShell({
  children,
  user = { name: 'Dr. Sarah Jenkins', role: 'OPD Staff / Registrar' },
  onLogout,
}: {
  children: ReactNode;
  user?: { name: string; role: string };
  onLogout?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ---------------------------- sidebar --------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-line/60">
          <Logo size={34} />
          <div className="leading-tight">
            <Wordmark size="sm" />
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Staff Console</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-3">
          {NAV_GROUPS.map((group) => (
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
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => navigate('/staff/walk-in')}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand-600 px-3 py-2.5 text-[13.5px] font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            <ClipboardPlus size={17} />
            Register Walk-in
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-line p-3">
          <div className="flex items-center justify-between rounded-xl bg-canvas p-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-ink">{user.name}</p>
              <p className="truncate text-[10.5px] font-medium text-ink-muted">{user.role}</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="rounded-lg p-1.5 text-ink-faint hover:bg-white hover:text-danger"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* --------------------------- main content --------------------------- */}
      <div className="flex flex-1 flex-col lg:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              OPD System Live
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted hidden sm:inline">Connected to MongoDB Atlas</span>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
