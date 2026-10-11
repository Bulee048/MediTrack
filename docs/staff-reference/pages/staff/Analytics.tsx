import { useEffect, useState } from 'react';
import { Clock, Gauge, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';

const COLORS = ['#E8455F', '#F5A623', '#0E8B7C', '#8B5CF6', '#101A2E', '#2FBF71'];

/** Analytics & OPD statistics */
export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.staff.stats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard
          label="Total Patients Today"
          value={stats.totalPatientsToday}
          delta={`↑ ${stats.totalPatientsDeltaPct}% up`}
          deltaTone="up"
          icon={<Users size={17} />}
        />
        <StatCard
          label="Avg. Waiting Time"
          value={`${stats.avgWaitingMins} Mins`}
          delta={`${Math.abs(stats.avgWaitingDelta)} min reduction`}
          deltaTone={stats.avgWaitingDelta <= 0 ? 'up' : 'down'}
          icon={<Clock size={17} />}
        />
        <StatCard
          label="Peak Load Hour"
          value={stats.peakLoadHour}
          delta={`${stats.peakLoadDept} Dept`}
          deltaTone="flat"
          icon={<Gauge size={17} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_480px]">
        {/* department load */}
        <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
          <h3 className="text-[15px] font-extrabold text-ink">Patient Load per Department (Today)</h3>
          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentLoad} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF3" />
                <XAxis dataKey="department" tick={{ fontSize: 11.5, fill: '#6C7A90' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11.5, fill: '#93A1B5' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(14,139,124,0.06)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E6ECF3', fontSize: 12 }}
                />
                <Bar dataKey="patients" name="Patients" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {stats.departmentLoad.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* efficiency table */}
        <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
          <h3 className="text-[15px] font-extrabold text-ink">OPD Efficiency metrics</h3>
          <div className="mt-4 divide-y divide-line">
            {stats.efficiency.map((e) => (
              <div key={e.department} className="flex items-center justify-between gap-4 py-4">
                <span className="text-[13px] font-extrabold text-ink">{e.department}</span>
                <span className="text-[12.5px] text-ink-muted">{e.patients} Patients</span>
                <span className="text-[13px] font-extrabold text-brand-600">{e.avgWait} Mins</span>
                <span className={cn('text-[12.5px] font-bold', e.status === 'Optimal' ? 'text-success' : 'text-warn')}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-[15px] font-extrabold text-ink">Hourly Footfall</h3>
          <div className="mt-4 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.hourly} margin={{ top: 6, right: 8, left: -26, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10.5, fill: '#93A1B5' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10.5, fill: '#93A1B5' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E6ECF3', fontSize: 12 }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#0E8B7C"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#0E8B7C' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}