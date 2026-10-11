import { useEffect, useMemo, useState } from 'react';
import { Search, Settings2 } from 'lucide-react';
import { Badge, Button, Input, LoadingScreen, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, fmtTimeOfDay } from '@/lib/utils';
import type { Appointment, Department, Doctor } from '@/lib/types';

/** Today's Appointments */
export default function TodayAppointments() {
  const { push } = useToast();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [doc, setDoc] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.staff
      .appointments()
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    api.catalogue.departments().then(setDepartments).catch(() => {});
    api.catalogue.doctors().then(setDoctors).catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((a) => {
        if (dept && a.departmentId !== dept) return false;
        if (doc && a.doctorId !== doc) return false;
        if (q && !a.patientName.toLowerCase().includes(q.toLowerCase()) && !a.ref.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [rows, q, dept, doc],
  );

  const checkIn = async (a: Appointment) => {
    try {
      await api.staff.checkIn(a.id);
      push({ tone: 'success', title: `${a.patientName} checked in`, body: 'A queue token has been generated.' });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Check-in failed', body: (e as Error).message });
    }
  };

  const statusOf = (a: Appointment) => {
    if (a.status === 'no_show') return { label: 'No Show', cls: 'bg-danger-soft text-danger-600' };
    if (a.status === 'completed') return { label: 'Completed', cls: 'bg-success-soft text-success' };
    if (a.status === 'cancelled') return { label: 'Cancelled', cls: 'bg-danger-soft text-danger-600' };
    return { label: 'Waiting', cls: 'bg-warn-soft text-warn' };
  };

  return (
    <div>
      {/* filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient name or ID..."
          className="min-w-[240px] flex-1"
          icon={<Search size={16} />}
        />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-auto min-w-[170px]">
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select value={doc} onChange={(e) => setDoc(e.target.value)} className="w-auto min-w-[170px]">
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      {/* table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Time', 'Patient Name', 'Patient ID', 'Assigned Doctor', 'Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && (
                <tr>
                  <td colSpan={7}>
                    <LoadingScreen />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-ink-muted">
                    No appointments match these filters.
                  </td>
                </tr>
              )}
              {filtered.map((a) => {
                const st = statusOf(a);
                return (
                  <tr key={a.id} className="transition hover:bg-canvas/60">
                    <td className="px-5 py-4 text-[13px] font-bold text-ink">{a.time}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">{a.patientName}</td>
                    <td className="px-5 py-4 text-[12.5px] font-semibold text-brand-600">{a.patientIdRef}</td>
                    <td className="px-5 py-4 text-[13px] text-ink-soft">{a.doctorName}</td>
                    <td className="px-5 py-4">
                      <Badge tone="neutral">{a.type === 'walk_in' ? 'Walk-in' : 'Scheduled'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={st.cls}>
                        <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />
                        {st.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => checkIn(a)}>
                          Check-in
                        </Button>
                        <button className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-canvas">
                          <Settings2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-ink-muted">
        Showing {filtered.length} of {rows.length} appointments · last synced{' '}
        {fmtTimeOfDay(new Date().toISOString())}
      </p>
    </div>
  );
}