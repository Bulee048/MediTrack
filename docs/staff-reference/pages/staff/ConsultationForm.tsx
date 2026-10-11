import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { Badge, Button, LoadingScreen, Select, Switch, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Consultation, QueueEntry, User } from '@/lib/types';

const LAB_TESTS = [
  'Complete Blood Count (CBC)',
  'ECG / Electrocardiogram',
  'Lipid Profile Panel',
  'Chest X-Ray',
  'Thyroid Panel (T3, T4, TSH)',
  'HbA1c / Sugar Profile',
];

const REFERRALS = [
  'No Referral Requested',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'ENT',
  'Psychiatry',
  'Physiotherapy',
];

interface Detail {
  entry: QueueEntry;
  patient: User | null;
  consultation: Consultation | null;
}

/** Active Consultation Form — complete visit & call next. */
export default function ConsultationForm() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();

  const [data, setData] = useState<Detail | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [labTests, setLabTests] = useState<string[]>([]);
  const [referral, setReferral] = useState(REFERRALS[0]);
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [vitals, setVitals] = useState({ bp: '120/80 mmHg', temp: '98.6 °F', hr: '72 bpm' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.staff
      .patient(id)
      .then((d) => {
        setData(d);
        if (d.consultation) {
          setDiagnosis(d.consultation.diagnosis ?? '');
          setPrescription(d.consultation.prescription ?? '');
          setLabTests(d.consultation.labTests ?? []);
          setReferral(d.consultation.referral ?? REFERRALS[0]);
        }
      })
      .catch(() => navigate('/staff/queue', { replace: true }));
  }, [id, navigate]);

  if (!data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingScreen />
      </div>
    );
  }

  const { entry, patient } = data;

  const complete = async (callNext: boolean) => {
    setBusy(true);
    try {
      const res = await api.staff.complete(id, {
        diagnosis,
        prescription,
        vitals,
        labTests,
        referral: referral === REFERRALS[0] ? undefined : referral,
        followUpDate: followUp && followUpDate ? followUpDate : undefined,
        callNext,
        departmentId: entry.departmentId,
      });
      push({
        tone: 'success',
        title: `${entry.patientName}'s visit completed`,
        body: res.called ? `Next patient called: ${res.called.token}` : 'No further patients waiting',
      });
      navigate('/staff/queue');
    } catch (e) {
      push({ tone: 'error', title: 'Could not complete', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const toggleLab = (t: string) =>
    setLabTests((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="space-y-6">
      {/* patient header */}
      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-white p-6 shadow-card">
        <Badge tone="brand" className="text-[13px]">
          Token #{entry.token}
        </Badge>
        <div>
          <p className="text-[17px] font-extrabold tracking-tight text-ink">{entry.patientName}</p>
          <p className="text-[12.5px] text-ink-muted">
            {patient?.gender ?? entry.gender ?? '—'} · {entry.age || '—'} years old ·{' '}
            {entry.appointmentId ? 'Booked Appointment' : 'Registered Walk-In'}
          </p>
        </div>

        <div className="ml-auto grid gap-6 border-l border-line pl-8 sm:grid-cols-2">
          <div className="text-right">
            <p className="label">Vitals recorded</p>
            <p className="mt-1 text-[13px] font-extrabold text-success">
              {vitals.bp} · Temp {vitals.temp}
            </p>
          </div>
          <div className="text-right">
            <p className="label">Consultation time</p>
            <p className="mt-1 text-[15px] font-extrabold text-ink">
              {entry.startedAt
                ? Math.max(1, Math.round((Date.now() - new Date(entry.startedAt).getTime()) / 60000))
                : '—'}{' '}
              mins
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* notes */}
        <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
          <Textarea
            label="Clinical Diagnosis Summary"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter physical checkup notes, primary illness parameters..."
            className="min-h-[130px]"
          />

          <div className="mt-6">
            <Textarea
              label="Prescription & Dosage Instructions"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="E.g., Paracetamol 500mg (1-0-1) post food x 5 days..."
              className="min-h-[130px]"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2.5">
              <span className="text-[13px] font-semibold text-ink">Follow-up Needed?</span>
              <Switch checked={followUp} onChange={setFollowUp} label="Follow-up needed" />
            </label>
            {followUp && (
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input h-11 max-w-[220px]"
                aria-label="Follow-up date"
              />
            )}
          </div>
        </section>

        {/* labs + actions */}
        <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
          <h3 className="text-[15px] font-extrabold text-ink">Lab Tests &amp; Diagnostics</h3>
          <div className="mt-4 space-y-3">
            {LAB_TESTS.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-3">
                <span
                  onClick={() => toggleLab(t)}
                  className={cn(
                    'grid h-[18px] w-[18px] place-items-center rounded border-2 transition',
                    labTests.includes(t) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/20',
                  )}
                >
                  {labTests.includes(t) && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m20 6-11 11-5-5" />
                    </svg>
                  )}
                </span>
                <span className="text-[13px] font-medium text-ink-soft">{t}</span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <Select label="Specialist Referral Department" value={referral} onChange={(e) => setReferral(e.target.value)}>
              {REFERRALS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </div>

          <div className="mt-6 grid gap-4">
            <Button size="lg" block loading={busy} onClick={() => complete(true)}>
              <CheckCircle2 size={17} /> Complete &amp; Call Next
            </Button>
            <Button size="lg" variant="outline" block loading={busy} onClick={() => complete(false)}>
              Complete Consultation Only
            </Button>
            <Button variant="ghost" block onClick={() => navigate(`/staff/queue/${id}`)}>
              <X size={16} /> Cancel
            </Button>
          </div>
        </section>
      </div>

      {/* vitals editor */}
      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">Update Vitals</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {(['bp', 'temp', 'hr'] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-1.5 block text-[13px] font-semibold capitalize text-ink">{k === 'bp' ? 'Blood pressure' : k === 'temp' ? 'Body temp' : 'Heart rate'}</span>
              <input
                value={vitals[k]}
                onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })}
                className="input"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}