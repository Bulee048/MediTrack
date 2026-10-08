import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Stethoscope } from 'lucide-react';
import { PatientShell } from '@/components/layout/PatientShell';
import { cn } from '@/lib/utils';

export function Portal() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'patient' | 'staff'>('patient');

  const options = [
    {
      key: 'patient' as const,
      title: 'Patient Portal',
      body: 'Book OPD consults, track live queue positions, and manage family medical files.',
      icon: HeartPulse,
    },
    {
      key: 'staff' as const,
      title: 'Staff & Clinicians',
      body: 'Call patients, update triage rooms, and manage doctor queue assignments.',
      icon: Stethoscope,
    },
  ];

  return (
    <PatientShell hideTabs>
      <div className="pt-10">
        <p className="text-[15px] font-bold text-brand-600">MedQueue</p>
        <h1 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-tight text-ink">Choose Your Portal</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          Select your role to proceed to the correct dashboard.
        </p>

        <div className="mt-8 space-y-4">
          {options.map((o) => {
            const active = role === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setRole(o.key)}
                className={cn(
                  'flex w-full items-start gap-4 rounded-2xl border-2 bg-white p-5 text-left transition',
                  active ? 'border-brand-600 shadow-card' : 'border-line hover:border-brand-200',
                )}
              >
                <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl', active ? 'bg-brand-50 text-brand-600' : 'bg-canvas text-ink-muted')}>
                  <o.icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-extrabold text-ink">{o.title}</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-muted">{o.body}</span>
                </span>
                <span
                  className={cn(
                    'mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition',
                    active ? 'border-brand-600 bg-brand-600' : 'border-ink/20',
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <button
            onClick={() => navigate(role === 'patient' ? '/login' : '/staff/login')}
            className="flex w-full items-center justify-center h-[52px] rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-[0.985]"
          >
            Proceed
          </button>
        </div>
      </div>
    </PatientShell>
  );
}
