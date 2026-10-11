import { useEffect, useState } from 'react';
import { PauseCircle, SkipForward } from 'lucide-react';
import { Badge, Button, LoadingScreen, Select, Switch } from '@/components/ui';
import { api, subscribeEvents } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, fmtTimeOfDay } from '@/lib/utils';
import type { QueueEntry } from '@/lib/types';

const HOLD_REASONS = ['Patient Not Present', 'Pending Lab Report', 'Triage Re-evaluation', 'Doctor Attending Emergency'];
const SKIP_REASONS = ['No-Show after 3 calls', 'Patient withdrew', 'Wrong department', 'Duplicate token'];

/** OPD Action & Flow Controls — hold / skip with a held-patients sidebar. */
export default function QueueFlowControls() {
  const { push } = useToast();
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [target, setTarget] = useState('');
  const [holdReason, setHoldReason] = useState(HOLD_REASONS[0]);
  const [minutes, setMinutes] = useState(15);
  const [skipReason, setSkipReason] = useState(SKIP_REASONS[0]);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.staff
      .queue()
      .then((r) => setEntries(r.data.entries))
      .catch(() => {});

  useEffect(() => {
    load();
    const unsubscribe = subscribeEvents({ onQueue: load });
    return unsubscribe;
  }, []);

  const held = entries.filter((e) => e.status === 'on_hold');
  const active = entries.filter((e) => e.status === 'waiting' || e.status === 'called' || e.status === 'in_consultation');

  const hold = async () => {
    const entry = entries.find((e) => e.id === target);
    if (!entry) {
      push({ tone: 'error', title: 'Select a patient first' });
      return;
    }
    setBusy(true);
    try {
      await api.staff.hold({ queueEntryId: entry.id, reason: holdReason, minutes, notify });
      push({ tone: 'success', title: `${entry.patientName} placed on hold` });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not hold', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    const entry = entries.find((e) => e.id === target);
    if (!entry) {
      push({ tone: 'error', title: 'Select a patient first' });
      return;
    }
    setBusy(true);
    try {
      await api.staff.skip(entry.id, skipReason, notify);
      push({ tone: 'warning', title: `${entry.patientName} skipped` });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not skip', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const resume = async (e: QueueEntry) => {
    await api.staff.resume(e.id);
    push({ tone: 'info', title: `${e.patientName} resumed` });
    load();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <h3 className="text-[15px] font-extrabold text-ink">Postpone / Post Consultation Action</h3>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Select label="Temporary Hold Reason" value={holdReason} onChange={(e) => setHoldReason(e.target.value)}>
              {HOLD_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Hold Duration (Estimate)</label>
              <div className="flex gap-2">
                <Select value={String(minutes)} onChange={(e) => setMinutes(Number(e.target.value))} className="flex-1">
                  {[5, 10, 15, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} Mins (Timer Active)
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Select label="Skip Reason" value={skipReason} onChange={(e) => setSkipReason(e.target.value)}>
              {SKIP_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-canvas px-4 py-3">
              <span className="text-[13px] font-semibold text-ink">Dispatch Auto Notification?</span>
              <Switch checked={notify} onChange={setNotify} label="Notify patient" />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Select patient</label>
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose a patient from the active queue…</option>
              {active.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.token} — {e.patientName} ({e.status.replace('_', ' ')})
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Button size="lg" className="bg-warn hover:brightness-95" loading={busy} onClick={hold}>
              <PauseCircle size={17} /> Place Patient on Hold
            </Button>
            <Button size="lg" variant="danger" loading={busy} onClick={skip}>
              <SkipForward size={17} /> Skip &amp; Notify Patient
            </Button>
          </div>
        </section>

        {/* active queue table */}
        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  {['Token', 'Patient Name', 'Assigned Doctor', 'Wait Time', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {active.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center text-[13px] text-ink-muted">
                      <LoadingScreen label="No active patients in the queue" />
                    </td>
                  </tr>
                )}
                {active.map((e) => (
                  <tr key={e.id} className="cursor-pointer transition hover:bg-canvas/60" onClick={() => setTarget(e.id)}>
                    <td className="px-5 py-4 text-[13px] font-extrabold text-brand-600">{e.token}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">{e.patientName}</td>
                    <td className="px-5 py-4 text-[12.5px] text-ink-soft">{e.doctorName}</td>
                    <td className="px-5 py-4 text-[12.5px] text-ink-soft">{e.waitMins ?? 0} mins</td>
                    <td className="px-5 py-4">
                      <Badge tone={e.status === 'in_consultation' ? 'brand' : 'warn'}>{e.status.replace('_', ' ')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* held patients sidebar */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold text-ink">Held Patients Sidebar</h3>
          <Badge tone={held.length ? 'warn' : 'neutral'}>{held.length} Paused</Badge>
        </div>

        <div className="mt-4 space-y-3">
          {held.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12.5px] text-ink-muted">
              No patients are currently on hold.
            </p>
          )}
          {held.map((e) => {
            const elapsed = e.holdStartedAt ? Math.round((Date.now() - new Date(e.holdStartedAt).getTime()) / 60000) : 0;
            return (
              <div key={e.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13px] font-extrabold text-brand-600">{e.token}</span>
                  <span className={cn('text-[12px] font-bold', elapsed > 20 ? 'text-danger' : 'text-warn')}>{elapsed}m elapsed</span>
                </div>
                <p className="mt-1 text-[13.5px] font-bold text-ink">{e.patientName}</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {e.holdReason ?? 'Held'} · since {fmtTimeOfDay(e.holdStartedAt ?? '')}
                </p>
                <Button size="sm" variant="success" className="mt-3" onClick={() => resume(e)}>
                  Resume
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}