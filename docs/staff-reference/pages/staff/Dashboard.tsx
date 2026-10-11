import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CheckCircle2,
  CirclePlus,
  Clock3,
  PhoneCall,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, LoadingScreen, StatCard } from '@/components/ui';
import { api, subscribeEvents } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';

const COLORS = ['#E8455F', '#F5A623', '#0E8B7C', '#8B5CF6', '#101A2E'];

/** Staff Dashboard — OPD Control Dashboard */
export default function Dashboard() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calling, setCalling] = useState(false);

  const load = useCallback(() => {
    api.staff.dashboard().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeEvents({
      onQueue: load,
      onAppointment: load,
      onSystem: (p) => {
        load();
        if (p?.message) push({ tone: 'info', title: 'Lobby board', body: p.message });
      },
    });
    const t = setInterval(load, 25000);
    return () => {
      unsubscribe();
      clearInterval(t);
    };
  }, [load, push]);

  const callNext = async () => {
    const departmentId = stats?.serving?.departmentId ?? stats?.next?.departmentId;
    if (!departmentId) return;
    setCalling(true);
    try {
      const res = await api.staff.callNext(departmentId);
      push({ tone: 'success', title: res.announcement });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not call', body: (e as Error).message });
    } finally {
      setCalling(false);
    }
  };

  if (!stats) return <Loading label="Loading OPD statistics…" />;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Patients Today"
          value={stats.totalPatientsToday}
          delta={`↑ ${stats.totalPatientsDeltaPct}% up`}
          deltaTone="up"
          icon={<Users size={17} />}
        />
        <StatCard
          label="In Queue Now"
          value={stats.inQueueNow}
          delta={`↘ ${stats.waitingOver30m} waiting >30m`}
          deltaTone={stats.waitingOver30m > 0 ? 'down' : 'flat'}
          icon={<Clock3 size={17} />}
        />
        <StatCard
          label="Completed Visits"
          value={stats.completedVisits}
          delta={`↑ ${stats.completionRate}% rate`}
          deltaTone="up"
          icon={<CheckCircle2 size={17} />}
        />
        <StatCard
          label="Avg. Waiting Time"
          value={`${stats.avgWaitingMins} min`}
          delta={`↗ ${Math.abs(stats.avgWaitingDelta)} min`}
          deltaTone={stats.avgWaitingDelta <= 0 ? 'up' : 'down'}
          icon={<BellRing size={17} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* live monitor */}
          <section className="rounded-2xl bg-brand-600 p-6 text-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-white" />
                </span>
                Live System Monitor
              </span>
              <span className="text-[12.5px] text-white/85">Currently Serving: {stats.doctorsActive} Doctors Active</span>
            </div>

            <div className="mt-5 grid gap-5 rounded-xl bg-brand-700/60 px-6 py-5 sm:grid-cols-3">
              <Metric label="Total Queued" value={`${stats.totalPatientsToday} Patients`} />
              <Metric label="Next in Line" value={`Token ${stats.nextInLine ?? '—'}`} />
              <Metric label="Critical / Urgent" value={`${String(stats.criticalPatients).padStart(2, '0')} Patients`} danger />
            </div>
          </section>

          {/* department load chart */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Patient Load per Department (Today)</h3>
            <div className="mt-5 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departmentLoad} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF3" />
                  <XAxis dataKey="department" tick={{ fontSize: 11.5, fill: '#6C7A90' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11.5, fill: '#93A1B5' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(14,139,124,0.06)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E6ECF3', fontSize: 12 }}
                  />
                  <Bar dataKey="patients" name="Patients" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {stats.departmentLoad.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* right rail */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Quick Actions</h3>
            <div className="mt-4 space-y-2.5">
              <Button block onClick={() => navigate('/staff/walk-in')}>
                <CirclePlus size={17} /> Register Walk-in Patient
              </Button>
              <Button variant="outline" block onClick={callNext} loading={calling}>
                <PhoneCall size={17} /> Call Next Queue Number
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-extrabold text-ink">Doctor Availability</h3>
              <span className="text-[12px] font-bold text-brand-600">{stats.doctorsActive} Active</span>
            </div>
            <div className="mt-4 space-y-2">
              {(stats.doctorAvailability ?? []).map((d) => (
                <div key={d.id} className="rounded-xl border border-line px-4 py-3">
                  <p className="text-[13.5px] font-bold text-ink">{d.name}</p>
                  <p className="text-[12px] text-ink-muted">{d.department}</p>
                  <p
                    className={cn(
                      'mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold',
                      d.state === 'Active' ? 'text-success' : 'text-warn',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', d.state === 'Active' ? 'bg-success' : 'bg-warn')} />
                    {d.state}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {stats.efficiency.length > 0 && (
            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h3 className="text-[15px] font-extrabold text-ink">OPD Efficiency Metrics</h3>
              <div className="mt-3 divide-y divide-line">
                {stats.efficiency.map((e) => (
                  <div key={e.department} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-[13px] font-bold text-ink">{e.department}</span>
                    <span className="text-[12.5px] text-ink-muted">{e.patients} Patients</span>
                    <span className="text-[13px] font-extrabold text-brand-600">{e.avgWait} Mins</span>
                    <span className={cn('text-[12.5px] font-bold', e.status === 'Optimal' ? 'text-success' : 'text-warn')}>{e.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">{label}</p>
      <p className={cn('mt-1 text-[21px] font-extrabold leading-none', danger && 'text-danger-soft')} style={danger ? { color: '#FFC2CB' } : undefined}>
        {value}
      </p>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <LoadingScreen label={label} />
    </div>
  );
}