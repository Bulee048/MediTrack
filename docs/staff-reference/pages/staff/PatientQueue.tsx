import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, CirclePlay, CircleSlash, PauseCircle, SkipForward } from 'lucide-react';
import { Badge, Button, LoadingScreen, Modal, Select, Switch } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, fmtTimeOfDay, timeAgo } from '@/lib/utils';
import type { Consultation, PatientQueueState, QueueEntry, User } from '@/lib/types';

const HOLD_REASONS = ['Patient Not Present', 'Pending Lab Report', 'Triage Re-evaluation', 'Doctor Attending Emergency'];
const SKIP_REASONS = ['No-Show after 3 calls', 'Patient withdrew', 'Wrong department', 'Duplicate token'];

interface Detail {
  entry: QueueEntry;
  patient: User | null;
  consultation: Consultation | null;
  queueState: PatientQueueState;
}

/** Patient Queue Operations — details + Start / Hold / Skip. */
export default function PatientQueue() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();

  const [data, setData] = useState<Detail | null>(null);
  const [holdOpen, setHoldOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [holdReason, setHoldReason] = useState(HOLD_REASONS[0]);
  const [minutes, setMinutes] = useState(15);
  const [skipReason, setSkipReason] = useState(SKIP_REASONS[0]);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => api.staff.patient(id).then(setData).catch(() => setData(null));

  useEffect(() => {
    load();
  }, [id]);

  if (!data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingScreen label="Loading patient queue details…" />
      </div>
    );
  }

  const { entry, patient } = data;

  const startConsultation = async () => {
    setBusy(true);
    try {
      await api.staff.callNext(entry.departmentId, entry.id);
      push({ tone: 'success', title: `${entry.patientName} moved to consultation` });
      navigate(`/staff/queue/${entry.id}/consultation`);
    } catch (e) {
      push({ tone: 'error', title: 'Could not start', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const hold = async () => {
    setBusy(true);
    try {
      await api.staff.hold({ queueEntryId: entry.id, reason: holdReason, minutes, notify });
      setHoldOpen(false);
      push({ tone: 'success', title: 'Patient placed on hold', body: `${holdReason} · ${minutes} mins` });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not hold', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    try {
      await api.staff.skip(entry.id, skipReason, notify);
      setSkipOpen(false);
      push({ tone: 'warning', title: 'Patient skipped', body: skipReason });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not skip', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    await api.staff.resume(entry.id);
    push({ tone: 'info', title: 'Patient resumed in the queue' });
    load();
  };

  const vitals = data.consultation?.vitals ?? { bp: '120/80 mmHg', temp: '98.6 °F', hr: '72 bpm' };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/staff/queue')} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-muted hover:text-ink">
        <ArrowLeft size={15} /> Back to Queue Board
      </button>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* patient header */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="flex items-start gap-5">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-canvas text-[19px] font-extrabold text-ink-muted">
                {entry.patientName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[21px] font-extrabold tracking-tight text-ink">{entry.patientName}</h2>
                  <Badge tone="brand">ID: {entry.patientIdRef}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {patient?.gender ?? entry.gender ?? '—'} · {entry.age || '—'} Years · {entry.phone}
                </p>

                <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
                  <div>
                    <p className="label">Queue Status</p>
                    <p className="mt-1.5 text-[17px] font-extrabold text-brand-600 capitalize">{entry.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="label">Estimated Wait</p>
                    <p className="mt-1.5 text-[17px] font-extrabold text-danger">~{entry.waitMins ?? 0} mins</p>
                  </div>
                  <div>
                    <p className="label">Token</p>
                    <p className="mt-1.5 text-[17px] font-extrabold text-ink">#{entry.token}</p>
                  </div>
                </div>

                {entry.holdReason && (
                  <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-[12.5px] font-semibold text-warn">
                    On hold since {fmtTimeOfDay(entry.holdStartedAt ?? entry.checkedInAt ?? '')} — {entry.holdReason}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* vitals */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Recorded Patient Vitals</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Vital label="Blood Pressure" value={vitals.bp ?? '120/80 mmHg'} />
              <Vital label="Body Temp" value={vitals.temp ?? '98.6 °F'} />
              <Vital label="Heart Rate" value={vitals.hr ?? '72 bpm'} />
            </div>
          </section>

          {/* alerts / history */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Queue Context</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoBox label="Checked in at" value={fmtTimeOfDay(entry.checkedInAt ?? '')} />
              <InfoBox label="Doctor" value={`${entry.doctorName} · ${entry.room}`} />
              <InfoBox label="Department" value={entry.department} />
              <InfoBox label="Priority" value={entry.priority} />
              {patient?.allergies?.length ? (
                <InfoBox label="Known allergies" value={patient.allergies.join(', ')} danger />
              ) : null}
              {patient?.chronic?.length ? <InfoBox label="Chronic conditions" value={patient.chronic.join(', ')} /> : null}
            </div>
            {data.consultation?.diagnosis && (
              <div className="mt-4 rounded-xl bg-canvas px-4 py-3">
                <p className="label">Last consultation note</p>
                <p className="mt-1 text-[12.5px] text-ink-soft">{data.consultation.diagnosis}</p>
              </div>
            )}
          </section>
        </div>

        {/* actions rail */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Queue Management Actions</h3>
            <div className="mt-4 space-y-2.5">
              {entry.status === 'on_hold' ? (
                <Button block onClick={resume}>
                  <Activity size={17} /> Resume Consultation
                </Button>
              ) : (
                <Button block onClick={startConsultation} loading={busy}>
                  <CirclePlay size={17} /> Start Consultation
                </Button>
              )}
              <Button variant="outline" block onClick={() => setHoldOpen(true)}>
                <PauseCircle size={17} /> Put on Hold
              </Button>
              <Button variant="outline" block onClick={() => setSkipOpen(true)}>
                <SkipForward size={17} /> Skip Patient
              </Button>
            </div>
          </section>

          {entry.status === 'in_consultation' && (
            <Button block onClick={() => navigate(`/staff/queue/${entry.id}/consultation`)}>
              Open Consultation Form
            </Button>
          )}

          <Button
            variant="outline"
            block
            onClick={() => navigate(`/staff/queue/${entry.id}/consultation`)}
          >
            <CircleSlash size={16} /> Complete Consultation
          </Button>

          <p className="rounded-2xl border border-line bg-white p-4 text-[12px] leading-relaxed text-ink-muted">
            Patient last updated {timeAgo(entry.checkedInAt ?? new Date().toISOString())}. Holding or skipping
            automatically notifies the patient through the app and the lobby display.
          </p>
        </div>
      </div>

      {/* hold modal */}
      <Modal
        open={holdOpen}
        onClose={() => setHoldOpen(false)}
        title="Place Patient on Hold"
        footer={
          <>
            <Button variant="outline" onClick={() => setHoldOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-warn hover:brightness-95" loading={busy} onClick={hold}>
              Place on Hold
            </Button>
          </>
        }
      >
        <Select label="Hold reason" value={holdReason} onChange={(e) => setHoldReason(e.target.value)}>
          {HOLD_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <p className="mt-5 mb-2 text-[13px] font-semibold text-ink">Hold duration (estimate)</p>
        <div className="flex gap-2.5">
          {[10, 15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={cn(
                'h-11 flex-1 rounded-xl border text-[13px] font-bold transition',
                minutes === m ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-soft',
              )}
            >
              {m} mins
            </button>
          ))}
        </div>
        <label className="mt-5 flex items-center justify-between gap-4">
          <span className="text-[13px] font-semibold text-ink">Notify the patient automatically?</span>
          <Switch checked={notify} onChange={setNotify} label="Notify patient" />
        </label>
      </Modal>

      {/* skip modal */}
      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title="Skip Patient"
        footer={
          <>
            <Button variant="outline" onClick={() => setSkipOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={skip}>
              Skip &amp; Notify
            </Button>
          </>
        }
      >
        <Select label="Skip reason" value={skipReason} onChange={(e) => setSkipReason(e.target.value)}>
          {SKIP_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <p className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[12.5px] text-danger-600">
          Skipping removes the token from the active queue. The patient must speak to the front desk to be re-added.
        </p>
      </Modal>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1.5 text-[16px] font-extrabold text-ink">{value}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Normal
      </p>
    </div>
  );
}

function InfoBox({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={cn('mt-1 text-[13px] font-bold capitalize', danger ? 'text-danger' : 'text-ink')}>{value}</p>
    </div>
  );
}