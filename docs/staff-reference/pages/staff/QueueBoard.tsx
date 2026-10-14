import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, Monitor, PhoneCall, Volume2 } from 'lucide-react';
import { Badge, Button, LoadingScreen } from '@/components/ui';
import { api, subscribeEvents } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';
import type { CallLog, Department, QueueView } from '@/lib/types';

/** Real-Time OPD Queue Board — call next, hold, skip. */
export default function QueueBoard() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [view, setView] = useState<QueueView | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [filter, setFilter] = useState('');
  const [announcement, setAnnouncement] = useState<string>('');
  const [audio, setAudio] = useState(true);
  const [display, setDisplay] = useState(true);
  const [calling, setCalling] = useState(false);

  const load = useCallback(() => {
    api.staff
      .queue(filter || undefined)
      .then((r) => {
        setView(r.data);
        setDepartments(r.departments);
      })
      .catch(() => {});
    api.staff.callLogs(6).then(setLogs).catch(() => {});
  }, [filter]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeEvents({
      onQueue: load,
      onSystem: (p) => {
        if (p?.message) {
          setAnnouncement(p.message);
          if (audio && 'speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(String(p.message).replace(/"/g, ''));
            window.speechSynthesis.speak(u);
          }
        }
        load();
      },
    });
    const t = setInterval(load, 20000);
    return () => {
      unsubscribe();
      clearInterval(t);
    };
  }, [load, audio]);

  const callNext = async () => {
    const departmentId = view?.serving?.departmentId ?? view?.next?.departmentId;
    if (!departmentId) return;
    setCalling(true);
    try {
      const res = await api.staff.callNext(departmentId);
      setAnnouncement(res.announcement);
      push({ tone: 'success', title: res.announcement });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not call next', body: (e as Error).message });
    } finally {
      setCalling(false);
    }
  };

  if (!view) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingScreen label="Loading live queue…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* top row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
        <Card>
          <p className="label">Currently Serving</p>
          <p className="mt-2.5 text-[27px] font-extrabold tracking-tight text-ink">{view.serving ? `#${view.serving.token}` : '#—'}</p>
        </Card>
        <Card>
          <p className="label">Waiting in Lobby</p>
          <p className="mt-2.5 text-[27px] font-extrabold tracking-tight text-warn">{view.lobbyCount} Patients</p>
        </Card>
        <button
          onClick={callNext}
          disabled={calling || !view.next}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-brand-600 p-6 text-white shadow-card transition hover:bg-brand-700 disabled:opacity-50"
        >
          <PhoneCall size={24} />
          <span className="text-[17px] font-extrabold">Call Next Patient</span>
          <span className="text-[12px] text-white/80">Triggers buzzer in Lobby Display</span>
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2.5">
        <Filter active={!filter} onClick={() => setFilter('')}>
          All Queues
        </Filter>
        {departments.map((d) => (
          <Filter key={d.id} active={filter === d.id} onClick={() => setFilter(d.id)}>
            {d.name}
          </Filter>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* table */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  {['Queue #', 'Patient Name', 'Token', 'Doctor / Dept', 'Wait Time', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {view.entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-ink-muted">
                      Nobody is waiting in this queue right now.
                    </td>
                  </tr>
                )}
                {view.entries.map((e, i) => (
                  <tr key={e.id} className={cn('transition hover:bg-canvas/60', e.status === 'in_consultation' && 'bg-brand-50/40')}>
                    <td className="px-5 py-4 text-[13px] font-bold text-ink-muted">#{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">{e.patientName}</td>
                    <td className="px-5 py-4 text-[13px] font-extrabold text-brand-600">{e.token}</td>
                    <td className="px-5 py-4 text-[12.5px] text-ink-soft">
                      {e.doctorName} · {e.department}
                    </td>
                    <td className="px-5 py-4 text-[12.5px] text-ink-soft">{e.waitMins ?? 0} mins</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={e.status} reason={e.holdReason} />
                    </td>
                    <td className="px-5 py-4">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/staff/queue/${e.id}`)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* right rail: lobby broadcast + call history */}
        <div className="space-y-6">
          <section className="rounded-2xl bg-ink p-5 text-white shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-extrabold uppercase tracking-wide text-white/70">Lobby Broadcast System</p>
              <span className="h-2 w-2 rounded-full bg-danger" />
            </div>

            <div className="mt-4 rounded-xl bg-white/10 px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">Current Speaker Preview</p>
              <p className="mt-1.5 text-[15px] font-bold leading-snug">
                “{announcement || `Token ${view.next?.token ?? '—'}, please proceed to ${view.next?.room ?? 'the OPD room'}`}”
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <ToggleRow
                icon={<Volume2 size={16} />}
                label="Audio PA System"
                checked={audio}
                onChange={setAudio}
              />
              <ToggleRow
                icon={<Monitor size={16} />}
                label="Display Board Sync"
                checked={display}
                onChange={setDisplay}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Recent Calls History log</h3>
            <div className="mt-3 divide-y divide-line">
              {logs.length === 0 && <p className="py-4 text-[12.5px] text-ink-muted">No calls yet today.</p>}
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-[13px] font-extrabold text-brand-600">{l.token}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{l.patientName}</span>
                  <span className="hidden text-[12px] text-ink-muted sm:block">· {l.department}</span>
                  <span className="hidden text-[11.5px] text-ink-faint md:block">{timeAgo(l.at)}</span>
                  <Badge tone={l.outcome === 'Completed' ? 'success' : l.outcome === 'Skipped' ? 'danger' : 'brand'}>
                    {l.outcome}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <Button variant="outline" block onClick={() => navigate('/staff/flow')}>
            <BellRing size={16} /> Hold / Skip Controls
          </Button>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-white p-6 shadow-card">{children}</div>;
}

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-[13px] font-bold transition',
        active ? 'bg-brand-600 text-white shadow-soft' : 'border border-line bg-white text-ink-soft hover:border-brand-300',
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status, reason }: { status: string; reason?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_consultation: { label: 'In Consultation', cls: 'bg-brand-50 text-brand-700' },
    waiting: { label: 'Waiting', cls: 'bg-warn-soft text-warn' },
    on_hold: { label: reason ?? 'On Hold', cls: 'bg-danger-soft text-danger-600' },
    skipped: { label: 'Skipped', cls: 'bg-danger-soft text-danger-600' },
    called: { label: 'Called', cls: 'bg-info-soft text-info' },
    completed: { label: 'Completed', cls: 'bg-ink/5 text-ink-muted' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-ink/5 text-ink-muted' };
  return (
    <Badge className={s.cls}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3">
      <span className="flex items-center gap-2.5 text-[13px] font-semibold">
        {icon}
        {label}
      </span>
      <span className={cn('relative h-[26px] w-[46px] rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-white/25')}>
        <span className={cn('absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all', checked ? 'left-[23px]' : 'left-[3px]')} />
      </span>
    </button>
  );
}