import { useEffect, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Badge, Input, LoadingScreen } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  memberSince: string;
  appointments: number;
  inQueue: boolean;
}

/** Patient Directory */
export default function PatientsDirectory() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api.staff
        .patients(q || undefined)
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search patient name, phone or email..."
        className="mb-6 max-w-md"
        icon={<Search size={16} />}
      />

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        {loading ? (
          <LoadingScreen />
        ) : rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-[13px] text-ink-muted">No patients match your search.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Patient', 'Phone', 'Email', 'Member Since', 'Appointments', 'Queue'].map((h) => (
                  <th key={h} className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id} className="transition hover:bg-canvas/50">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                        <UserRound size={16} />
                      </span>
                      <span className="text-[13px] font-bold text-ink">{p.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12.5px] text-ink-soft">{p.phone}</td>
                  <td className="px-5 py-4 text-[12.5px] text-ink-muted">{p.email ?? '—'}</td>
                  <td className="px-5 py-4 text-[12.5px] text-ink-muted">{p.memberSince}</td>
                  <td className="px-5 py-4 text-[13px] font-bold text-ink">{p.appointments}</td>
                  <td className="px-5 py-4">
                    {p.inQueue ? (
                      <Badge tone="success">In queue</Badge>
                    ) : (
                      <Badge className={cn('bg-ink/5 text-ink-muted')}>Not in queue</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-[12px] text-ink-muted">{rows.length} patients registered</p>
    </div>
  );
}