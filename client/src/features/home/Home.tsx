import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarPlus, Clock3, LayoutGrid, Search, User2 } from 'lucide-react';
import { PatientShell } from '@/components/layout/PatientShell';

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const quickActions = [
    { label: 'Book OPD', icon: CalendarPlus, to: '/app/departments', tone: 'bg-brand-50 text-brand-600' },
    { label: 'My Queue', icon: Clock3, to: '/app/queue', tone: 'bg-red-50 text-red-600' },
    { label: 'Departments', icon: LayoutGrid, to: '/app/departments', tone: 'bg-blue-50 text-blue-600' },
    { label: 'My Profile', icon: User2, to: '/app/profile', tone: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <PatientShell
      action={
        <button
          onClick={() => navigate('/app/notifications')}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
      }
    >
      {/* greeting */}
      <div className="pt-3">
        <p className="text-[13px] font-semibold text-ink-muted">Welcome to MediTrack,</p>
        <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-ink">Patient Portal</h1>
      </div>

      {/* search bar */}
      <div className="relative mt-5">
        <div className="flex items-center overflow-hidden rounded-xl border border-line bg-white px-3.5 focus-within:border-brand-500">
          <Search size={17} className="text-ink-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, doctors..."
            className="h-12 w-full bg-transparent px-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      {/* active queue trigger banner */}
      <button
        onClick={() => navigate('/app/queue')}
        className="mt-5 w-full rounded-2xl bg-brand-600 p-5 text-left text-white shadow-card transition active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Live Digital Queue
          </span>
          <span className="text-[11.5px] font-semibold text-white/80">Real-Time Status</span>
        </div>

        <p className="mt-3 text-[17px] font-extrabold">Check OPD Live Queue</p>
        <p className="text-[12.5px] text-white/80">Track your ticket number, active position, and estimated wait time</p>
      </button>

      {/* quick actions grid */}
      <div className="mt-6">
        <h2 className="text-[14px] font-extrabold text-ink">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition hover:border-brand-200"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${action.tone}`}>
                <action.icon size={20} />
              </span>
              <span className="text-[13.5px] font-extrabold text-ink">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </PatientShell>
  );
}
