import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock3, Users } from 'lucide-react';
import { FeaturePageContent } from '@/components/FeaturePageContent';
import { appointmentsApi } from './api/appointmentsApi';
import type { Appointment } from './types';
import { fmtMediumDate, STATUS_STYLES } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Tab = 'upcoming' | 'past' | 'cancelled';

export default function Appointments() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(''); setItems([]);
    appointmentsApi
      .list(tab)
      .then((items) => { if (active) setItems(items); })
      .catch((e) => { if (active) setError((e as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab]);

  return (
    <FeaturePageContent title="My Appointments" back>
      {/* Prominently visible Book for Family banner */}
      <Link to="/app/family"
        className="mb-4 flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 p-3.5 transition hover:bg-brand-100/70 cursor-pointer shadow-soft"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[13.5px] font-extrabold text-brand-900 leading-tight">
              Book for a Family Member
            </p>
            <p className="text-[11.5px] text-brand-700 font-medium">
              Easily manage appointments for your loved ones
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-brand-600" />
      </Link>

      {/* Tabs */}
      <div className="flex rounded-full bg-slate-200/70 p-1">
        {(['upcoming', 'past', 'cancelled'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-full py-2 text-[13px] font-bold capitalize transition min-h-0',
              tab === t
                ? 'bg-brand-600 text-white shadow-soft'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="mt-5 space-y-3.5">
        {loading && (
          <div className="py-12 text-center text-sm text-ink-muted">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <p className="mt-2 font-medium">Loading appointments…</p>
          </div>
        )}

        {error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
            <p className="text-sm font-bold text-ink">No appointments here</p>
            <p className="mt-1.5 max-w-xs text-[12.5px] text-ink-muted">
              {tab === 'upcoming'
                ? 'Book an OPD consult to see it listed here.'
                : 'Nothing to show for this filter yet.'}
            </p>
          </div>
        )}

        {!loading &&
          items.map((a) => {
            const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.confirmed;
            const live = a.queueEntry && a.queueEntry.status === 'waiting';

            return (
              <Link
                key={a.id}
                to={`/app/appointments/${a.id}`}
                className="block w-full rounded-2xl border border-line bg-white p-4 text-left shadow-card transition hover:border-brand-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={cn('chip border text-[11px] font-bold px-2.5 py-0.5', st.cls)}>
                    {st.label}
                  </span>
                  <span className="text-[12px] font-semibold text-ink-muted">
                    {a.date === new Date().toISOString().slice(0, 10)
                      ? 'Today'
                      : fmtMediumDate(a.date)}{' '}
                    · {a.time}
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15.5px] font-extrabold tracking-tight text-ink">
                      {a.doctorName}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">
                      {a.department} · {a.room}
                    </p>
                    {!a.bookedForSelf && a.familyMemberName && (
                      <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        For: {a.familyMemberName}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-slate-400" />
                </div>

                {live && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-50 px-3.5 py-2.5 border border-brand-200">
                    <span className="text-[12px] font-extrabold text-brand-700">
                      Live Queue · {a.queueEntry?.token}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-bold text-brand-700">
                      <Clock3 size={13} /> Position #{a.queueEntry?.position}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
      </div>
    </FeaturePageContent>
  );
}
