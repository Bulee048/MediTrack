import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CirclePlus, Printer, QrCode, Send } from 'lucide-react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, inr } from '@/lib/utils';
import type { Department, Doctor, QueueEntry } from '@/lib/types';

const PRIORITIES = ['routine', 'urgent', 'emergency'] as const;

/** New Walk-In OPD Registration — issues a digital queue token. */
export default function WalkInRegistration() {
  const { push } = useToast();

  const [form, setForm] = useState({ name: '', phone: '', dob: '', gender: '' });
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('routine');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<QueueEntry | null>(null);
  const [estimatedWait, setEstimatedWait] = useState(18);

  useEffect(() => {
    const t = setInterval(() => setEstimatedWait((w) => Math.max(4, w - 1)), 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.catalogue.departments().then((d) => {
      setDepartments(d);
      if (d[0]) setDepartmentId(d[0].id);
    });
  }, []);

  useEffect(() => {
    api.catalogue.doctors({ departmentId: departmentId || undefined }).then((d) => {
      setDoctors(d);
      setDoctorId(d[0]?.id ?? '');
    });
  }, [departmentId]);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const register = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Patient name is required';
    if (form.phone.replace(/\D/g, '').length < 6) e.phone = 'Phone number is required';
    if (!doctorId) e.doctor = 'Assign a doctor';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const entry = await api.staff.walkIn({
        name: form.name,
        phone: form.phone,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        doctorId,
        priority,
      });
      setIssued(entry);
      push({ tone: 'success', title: 'Queue token issued', body: `${entry.patientName} → ${entry.token}` });
    } catch (err) {
      push({ tone: 'error', title: 'Registration failed', body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setIssued(null);
    setForm({ name: '', phone: '', dob: '', gender: '' });
  };

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">1. Patient Details</h3>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input label="Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="John Doe" />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={errors.phone}
            placeholder="+1 (555) 019-2834"
          />
          <Input label="DOB" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
          <Select label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select Gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </Select>
        </div>

        <div className="mt-7 rounded-2xl border border-dashed border-line bg-canvas/60 p-4">
          <p className="text-[12px] font-semibold text-ink-muted">
            Walk-in patients are added to the live queue immediately and receive an SMS with their queue token.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">2. OPD Assignment</h3>

        <div className="mt-5 space-y-5">
          <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Select label="Assigned Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Priority Status</p>
            <div className="flex gap-2.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'h-11 flex-1 rounded-xl text-[13px] font-bold capitalize transition',
                    priority === p ? 'bg-brand-600 text-white' : 'border border-line bg-white text-ink-soft hover:border-brand-300',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" block loading={busy} disabled={!doctors.length} onClick={register}>
            <CirclePlus size={17} /> Register &amp; Print Token
          </Button>

          {selectedDoctor && (
            <p className="text-[12px] text-ink-muted">
              {selectedDoctor.room} · consultation fee {inrOf(selectedDoctor.fee)} · estimated wait ~{estimatedWait} mins
            </p>
          )}
        </div>
      </section>

      <TokenModal entry={issued} wait={estimatedWait} onClose={reset} />
    </div>
  );
}

function inrOf(n: number) {
  return inr(n);
}

function TokenModal({ entry, wait, onClose }: { entry: QueueEntry | null; wait: number; onClose: () => void }) {
  const navigate = useNavigate();
  if (!entry) return null;

  const print = () => window.print();

  return (
    <Modal
      open={Boolean(entry)}
      onClose={onClose}
      title="Queue Token Issued"
      width="max-w-md"
      footer={
        <>
          <Button variant="success" onClick={print}>
            <Printer size={17} /> Print Token Slip
          </Button>
          <Button variant="outline" onClick={() => navigate(`/staff/queue/${entry.id}`)}>
            <Send size={16} /> Send to Patient
          </Button>
        </>
      }
    >
      <div className="rounded-2xl border border-line bg-canvas p-6 text-center">
        <p className="text-[12px] font-extrabold uppercase tracking-wide text-brand-700">MedQueue Clinic</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">St. Jude Medical OPD Center</p>

        <div className="my-5 border-y border-dashed border-ink/15 py-6">
          <p className="text-[52px] font-extrabold leading-none tracking-tight text-brand-600">{entry.token}</p>
          <p className="mt-2 text-[13px] text-ink-muted">Your Queue Token Number</p>
        </div>

        <div className="space-y-2.5 text-left">
          <Row label="Patient Name" value={entry.patientName} />
          <Row label="OPD Department" value={entry.department} />
          <Row label="Assigned Doctor" value={entry.doctorName} />
          <Row label="Est. Waiting Time" value={`${wait} Mins`} highlight />
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="grid h-28 w-28 place-items-center rounded-xl border border-dashed border-ink/15 bg-white text-ink-faint">
            <QrCode size={44} />
          </div>
          <p className="mt-2.5 text-[11.5px] text-ink-muted">Scan to track live waiting queue position</p>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className={cn('text-[12.5px] font-bold', highlight ? 'text-success' : 'text-ink')}>{value}</span>
    </div>
  );
}