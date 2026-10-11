import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { Badge, Button, Input, LoadingScreen, Modal, Select, SwitchRow, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, inr } from '@/lib/utils';
import type { Department, Doctor } from '@/lib/types';

type DoctorRow = Doctor & { week: { date: string; day: string; status: string }[] };

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STATUSES = ['active', 'busy', 'leave'] as const;
const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-success-soft text-success',
  Busy: 'bg-danger-soft text-danger-600',
  Leave: 'bg-ink/5 text-ink-muted',
};

interface FormState {
  name: string;
  departmentId: string;
  title: string;
  experienceYears: string;
  fee: string;
  room: string;
  about: string;
  languages: string;
  maxPatientsPerSession: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  active: boolean;
  roster: Record<number, 'active' | 'busy' | 'leave'>;
}

const emptyForm = (departmentId = ''): FormState => ({
  name: '',
  departmentId,
  title: '',
  experienceYears: '1',
  fee: '300',
  room: 'OPD Room 1',
  about: '',
  languages: 'English',
  maxPatientsPerSession: '20',
  morning: true,
  afternoon: true,
  evening: false,
  active: true,
  roster: { 0: 'leave', 1: 'active', 2: 'active', 3: 'active', 4: 'active', 5: 'active', 6: 'leave' },
});

/**
 * Doctor management — the roster schedule plus add / edit / deactivate.
 */
export default function DoctorsAvailability() {
  const { push } = useToast();
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; doctor?: DoctorRow } | null>(null);

  const load = useCallback(() => {
    api.staff
      .doctors()
      .then((r) => {
        setRows(r.data);
        setDepartments(r.departments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => (filter ? rows.filter((r) => r.departmentId === filter) : rows), [rows, filter]);

  const remove = async (d: DoctorRow) => {
    if (!confirm(`Remove ${d.name} from the schedule?`)) return;
    try {
      const res = await api.staff.removeDoctor(d.id);
      push({ tone: res.deactivated ? 'warning' : 'success', title: res.message });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not remove', body: (e as Error).message });
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill active={!filter} onClick={() => setFilter('')}>
            All Departments
          </FilterPill>
          {departments.map((d) => (
            <FilterPill key={d.id} active={filter === d.id} onClick={() => setFilter(d.id)}>
              {d.name}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[12.5px] font-semibold text-ink-muted">
          <Legend color="bg-success" label="Available" />
          <Legend color="bg-danger" label="Busy" />
          <Legend color="bg-ink-faint" label="On Leave" />
        </div>
      </div>

      {/* ------------------------------ table --------------------------- */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">Doctor</th>
                {(rows[0]?.week ?? []).map((d) => (
                  <th key={d.date} className="px-3 py-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                    {d.day}
                  </th>
                ))}
                <th className="px-5 py-4 text-right text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((doc) => (
                <tr key={doc.id} className={cn('transition hover:bg-canvas/50', !doc.active && 'opacity-55')}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11.5px] font-extrabold',
                          doc.active ? 'bg-brand-50 text-brand-700' : 'bg-ink/5 text-ink-faint',
                        )}
                      >
                        {doc.name.replace(/^Dr\.?\s*/i, '').split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink">
                          {doc.name}
                          {!doc.active && (
                            <Badge tone="neutral" className="px-2 py-0.5">
                              Inactive
                            </Badge>
                          )}
                        </p>
                        <p className="text-[12px] text-ink-muted">
                          {doc.department} · {doc.room} · {inr(doc.fee)}
                        </p>
                      </div>
                    </div>
                  </td>
                  {doc.week.map((d) => (
                    <td key={d.date} className="px-3 py-5">
                      <Badge className={STATUS_STYLE[d.status] ?? 'bg-ink/5 text-ink-muted'}>{d.status}</Badge>
                    </td>
                  ))}
                  <td className="px-5 py-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setEditor({ mode: 'create' })} title="Register a new doctor">
                        <Plus size={14} /> Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditor({ mode: 'edit', doctor: doc })}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <button
                        onClick={() => remove(doc)}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted transition hover:border-danger hover:text-danger"
                        title="Remove doctor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-muted">
          Showing {filtered.length} of {rows.length} doctors across {departments.length} departments.
        </p>
        <Button onClick={() => setEditor({ mode: 'create' })}>
          <UserPlus size={17} /> Register New Doctor
        </Button>
      </div>

      <DoctorEditor
        editor={editor}
        departments={departments}
        onClose={() => setEditor(null)}
        onSaved={(mode, name) => {
          setEditor(null);
          push({ tone: 'success', title: mode === 'create' ? `${name} added to the roster` : `${name} updated` });
          load();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add / Edit modal — profile, shifts, roster                          */
/* ------------------------------------------------------------------ */

function DoctorEditor({
  editor,
  departments,
  onClose,
  onSaved,
}: {
  editor: { mode: 'create' | 'edit'; doctor?: DoctorRow } | null;
  departments: Department[];
  onClose: () => void;
  onSaved: (mode: 'create' | 'edit', name: string) => void;
}) {
  const { push } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editor) return;
    if (editor.mode === 'create') {
      setForm(emptyForm(departments[0]?.id ?? ''));
    } else if (editor.doctor) {
      const d = editor.doctor;
      setForm({
        name: d.name,
        departmentId: d.departmentId,
        title: d.title,
        experienceYears: String(d.experienceYears),
        fee: String(d.fee),
        room: d.room,
        about: d.about,
        languages: d.languages.join(', '),
        maxPatientsPerSession: String(d.maxPatientsPerSession),
        morning: d.shifts.morning,
        afternoon: d.shifts.afternoon,
        evening: d.shifts.evening,
        active: d.active,
        roster: { ...(d.roster as Record<number, 'active' | 'busy' | 'leave'>) },
      });
    }
    setErrors({});
  }, [editor, departments]);

  if (!editor) return null;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = 'Enter the full name (e.g. Dr. Jane Doe)';
    if (!form.departmentId) e.departmentId = 'Choose a department';
    if (form.title.trim().length < 2) e.title = 'Enter a designation';
    if (Number(form.fee) < 0) e.fee = 'Fee cannot be negative';
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      name: form.name.trim(),
      departmentId: form.departmentId,
      title: form.title.trim(),
      experienceYears: Number(form.experienceYears),
      fee: Number(form.fee),
      room: form.room.trim(),
      about: form.about.trim(),
      languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
      maxPatientsPerSession: Number(form.maxPatientsPerSession),
      shifts: { morning: form.morning, afternoon: form.afternoon, evening: form.evening },
      roster: Object.fromEntries(Object.entries(form.roster).map(([k, v]) => [k, v])),
      ...(editor.mode === 'edit' ? { active: form.active } : {}),
    };

    setBusy(true);
    try {
      if (editor.mode === 'create') await api.staff.createDoctor(payload);
      else await api.staff.updateDoctor(editor.doctor!.id, payload);
      onSaved(editor.mode, payload.name);
    } catch (err) {
      push({ tone: 'error', title: 'Could not save doctor', body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-3xl"
      title={editor.mode === 'create' ? 'Register New Doctor' : `Edit ${editor.doctor?.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={save}>
            {editor.mode === 'create' ? 'Add to Roster' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ------------------------- profile ------------------------- */}
        <section>
          <p className="label">Profile</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input label="Full Name" value={form.name} onChange={(ev) => set('name', ev.target.value)} error={errors.name} placeholder="Dr. Jane Doe" />
            <Select label="Department" value={form.departmentId} onChange={(ev) => set('departmentId', ev.target.value)}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Input label="Designation" value={form.title} onChange={(ev) => set('title', ev.target.value)} error={errors.title} placeholder="Consultant Cardiologist" />
            <Input label="Consulting Room" value={form.room} onChange={(ev) => set('room', ev.target.value)} placeholder="OPD Room 12" />
            <Input label="Years of experience" type="number" min={0} value={form.experienceYears} onChange={(ev) => set('experienceYears', ev.target.value)} />
            <Input label="Consultation fee (Rs)" type="number" min={0} value={form.fee} onChange={(ev) => set('fee', ev.target.value)} error={errors.fee} />
            <Input
              label="Languages"
              value={form.languages}
              onChange={(ev) => set('languages', ev.target.value)}
              hint="Comma separated"
              className="sm:col-span-2"
            />
          </div>
          <div className="mt-4">
            <Textarea label="About" value={form.about} onChange={(ev) => set('about', ev.target.value)} placeholder="Speciality, areas of focus, experience highlights…" />
          </div>
        </section>

        {/* -------------------------- shifts ------------------------- */}
        <section className="border-t border-line pt-5">
          <p className="label">Shift allocations (daily session)</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ['morning', 'Morning', '09:00 AM – 12:00 PM'],
                ['afternoon', 'Afternoon', '12:00 PM – 04:00 PM'],
                ['evening', 'Evening', '04:00 PM – 07:00 PM'],
              ] as const
            ).map(([key, label, range]) => (
              <button
                key={key}
                onClick={() => set(key, !form[key])}
                className={cn(
                  'rounded-xl border-2 px-4 py-3 text-left transition',
                  form[key] ? 'border-brand-600 bg-brand-50/40' : 'border-line hover:border-brand-200',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn('h-4 w-4 rounded border-2', form[key] ? 'border-brand-600 bg-brand-600' : 'border-ink/20')} />
                  <span className="text-[13px] font-bold text-ink">{label}</span>
                </span>
                <span className="mt-1 block pl-6 text-[11.5px] text-ink-muted">{range}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Max patients per session"
              type="number"
              min={1}
              max={200}
              value={form.maxPatientsPerSession}
              onChange={(ev) => set('maxPatientsPerSession', ev.target.value)}
            />
            {editor.mode === 'edit' && (
              <div className="flex items-end pb-1">
                <div className="w-full">
                  <SwitchRow checked={form.active} onChange={(v) => set('active', v)} title="Active in OPD" description="Inactive doctors are hidden from patient booking" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* -------------------------- roster ------------------------- */}
        <section className="border-t border-line pt-5">
          <p className="label">Weekly roster</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-7">
            {DAYS.map((day, idx) => (
              <div key={day}>
                <p className="mb-1.5 text-center text-[11px] font-bold text-ink-muted">{day.slice(0, 3)}</p>
                <div className="space-y-1">
                  {STATUSES.map((s) => {
                    const active = form.roster[idx] === s;
                    return (
                      <button
                        key={s}
                        onClick={() => set('roster', { ...form.roster, [idx]: s })}
                        className={cn(
                          'w-full rounded-lg py-1.5 text-[11px] font-bold capitalize transition',
                          active
                            ? s === 'active'
                              ? 'bg-success text-white'
                              : s === 'busy'
                                ? 'bg-danger text-white'
                                : 'bg-ink/70 text-white'
                            : 'border border-line bg-white text-ink-faint hover:border-brand-300',
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {label}
    </span>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-[13px] font-bold transition',
        active ? 'bg-ink text-white shadow-soft' : 'border border-line bg-white text-ink-soft hover:border-brand-300',
      )}
    >
      {children}
    </button>
  );
}
