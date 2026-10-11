/**
 * Team & Access — administrator-only staff directory.
 *
 * Admins invite colleagues, choose what each role may do, and switch accounts
 * on or off. Receptionists and doctors never reach this page: the API refuses
 * the calls with 403 and the router bounces them back to the dashboard.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { StaffPageHeader } from '@/components/StaffShell';
import { Badge, Button, Card, CardBody, EmptyState, Input, LoadingScreen, Modal, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { permissionsFor } from '@/lib/staffAccess';
import { cn, initials } from '@/lib/utils';
import type { StaffAccount, StaffPermissions, StaffRole, StaffRoleInfo } from '@/lib/types';

const ROLE_STYLE: Record<StaffRole, string> = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  doctor: 'bg-sky-50 text-sky-700 border-sky-200',
  receptionist: 'bg-brand-50 text-brand-700 border-brand-200',
};

/** Rows of the read-only capability matrix shown to admins. */
const CAPABILITIES: { key: keyof StaffPermissions; label: string }[] = [
  { key: 'seeAllDepartments', label: 'All departments' },
  { key: 'registerWalkIns', label: 'Walk-in registration' },
  { key: 'manageQueue', label: 'Run the queue' },
  { key: 'completeConsultations', label: 'Clinical notes' },
  { key: 'viewAnalytics', label: 'Analytics' },
  { key: 'manageSystem', label: 'System settings' },
  { key: 'manageStaff', label: 'Manage staff' },
];

const MATRIX_ROLES: StaffRole[] = ['receptionist', 'doctor', 'admin'];
const EMPTY_FORM = { name: '', email: '', phone: '', staffRole: 'receptionist' as StaffRole, staffId: '' };

export default function TeamAccess() {
  const toast = useToast();
  const [team, setTeam] = useState<StaffAccount[]>([]);
  const [summary, setSummary] = useState({ total: 0, admins: 0, doctors: 0, receptionists: 0 });
  const [roles, setRoles] = useState<StaffRoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<StaffAccount | null>(null);
  const [removing, setRemoving] = useState<StaffAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  /** One-time password shown once after an invite or a reset. */
  const [issued, setIssued] = useState<{ name: string; staffId: string; password: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([api.staff.team(), api.staff.roles()]);
      setTeam(t.data);
      setSummary(t.summary);
      setRoles(r);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(
    () => ({
      admin: team.filter((t) => t.staffRole === 'admin'),
      doctor: team.filter((t) => t.staffRole === 'doctor'),
      receptionist: team.filter((t) => t.staffRole === 'receptionist'),
    }),
    [team],
  );

  const openInvite = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setInviteOpen(true);
  };

  const openEdit = (member: StaffAccount) => {
    setForm({
      name: member.name,
      email: member.email ?? '',
      phone: member.phone,
      staffRole: member.staffRole,
      staffId: member.staffId,
    });
    setFormError('');
    setEditing(member);
  };

  const submitInvite = async () => {
    setBusy(true);
    setFormError('');
    try {
      const res = await api.staff.inviteStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        staffRole: form.staffRole,
        ...(form.staffId.trim() ? { staffId: form.staffId.trim() } : {}),
      });
      setInviteOpen(false);
      setIssued({ name: res.data.name, staffId: res.data.staffId, password: res.tempPassword });
      toast.push({ tone: 'success', title: `${res.data.name} can now sign in as ${res.data.staffRole}.` });
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError('');
    try {
      const res = await api.staff.updateStaff(editing.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        staffRole: form.staffRole,
      });
      setEditing(null);
      toast.push({ tone: 'success', title: res.message });
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (member: StaffAccount) => {
    setBusy(true);
    try {
      const res = await api.staff.updateStaff(member.id, { resetPassword: true });
      if (res.tempPassword) {
        setIssued({ name: member.name, staffId: member.staffId, password: res.tempPassword });
      }
      toast.push({ tone: 'success', title: `New password issued for ${member.name}.` });
    } catch (err) {
      toast.push({ tone: 'error', title: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      const res = await api.staff.removeStaff(removing.id);
      setRemoving(null);
      toast.push({ tone: 'success', title: res.message });
      await load();
    } catch (err) {
      toast.push({ tone: 'error', title: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingScreen label="Loading staff directory…" />;

  if (error) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={<ShieldCheck size={30} />}
            title="Administrator access required"
            description={error}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <StaffPageHeader
        title="Team & Access"
        description="Invite colleagues, decide what each role can reach, and remove access when someone leaves."
        actions={
          <Button onClick={openInvite}>
            <UserPlus size={16} /> Add Staff Account
          </Button>
        }
      />

      {/* ------------------------------ summary ------------------------------ */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Staff accounts', value: summary.total, tint: 'text-ink' },
          { label: 'Administrators', value: summary.admins, tint: 'text-purple-600' },
          { label: 'Doctors', value: summary.doctors, tint: 'text-sky-600' },
          { label: 'Receptionists', value: summary.receptionists, tint: 'text-brand-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="py-4">
              <p className="text-[12px] font-semibold text-ink-muted">{s.label}</p>
              <p className={cn('mt-1 text-[26px] font-extrabold leading-none tracking-tight', s.tint)}>{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* --------------------------- capability matrix -------------------------- */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="text-[14px] font-extrabold text-ink">What each role can do</h3>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            Roles are fixed so a receptionist can never reach clinical notes or staff accounts, and a doctor never sees
            another department's queue.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-2 pr-3 text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">Capability</th>
                  {MATRIX_ROLES.map((r) => (
                    <th key={r} className="px-3 pb-2 text-center text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">
                      {roles.find((x) => x.key === r)?.label ?? r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((cap) => (
                  <tr key={cap.key} className="border-t border-line">
                    <td className="py-2.5 pr-3 text-[13px] font-semibold text-ink-soft">{cap.label}</td>
                    {MATRIX_ROLES.map((r) => {
                      const on = permissionsFor(r)[cap.key];
                      return (
                        <td key={r} className="px-3 py-2.5 text-center">
                          {on ? (
                            <Check size={16} className="mx-auto text-success" strokeWidth={3} />
                          ) : (
                            <span className="text-ink/20">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------- roster -------------------------------- */}
      {team.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Users size={30} />}
              title="No staff accounts yet"
              description="Invite your first colleague to give them console access."
              action={<Button onClick={openInvite}>Add Staff Account</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-5">
          {MATRIX_ROLES.map((role) => {
            const members = grouped[role];
            if (members.length === 0) return null;
            const info = roles.find((r) => r.key === role);
            return (
              <Card key={role}>
                <CardBody>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[14px] font-extrabold text-ink">{info?.label ?? role}</h3>
                    <span className="text-[12px] font-semibold text-ink-muted">{members.length} account(s)</span>
                  </div>
                  {info && <p className="mt-1 text-[12.5px] text-ink-muted">{info.description}</p>}

                  <div className="mt-4 space-y-2.5">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-canvas/60 px-4 py-3"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[13px] font-extrabold text-brand-700 ring-1 ring-line">
                          {initials(m.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-bold text-ink">{m.name}</p>
                          <p className="truncate text-[12px] text-ink-muted">
                            <span className="font-bold text-ink-soft">{m.staffId}</span> · {m.email ?? m.phone} · joined{' '}
                            {m.memberSince}
                          </p>
                        </div>
                        <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', ROLE_STYLE[m.staffRole])}>
                          {m.staffRole}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void resetPassword(m)}>
                            <KeyRound size={14} /> Reset
                          </Button>
                          <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => setRemoving(m)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* ------------------------------ invite modal ---------------------------- */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add Staff Account"
        subtitle="They sign in with their staff ID and the one-time password you receive next."
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void submitInvite()}>
              Create Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Kasun Perera"
          />
          <Input
            label="Work email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="kasun@stjudemedical.org"
          />
          <Input
            label="Contact number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+94771234567"
          />
          <Select
            label="Role"
            value={form.staffRole}
            onChange={(e) => setForm({ ...form, staffRole: e.target.value as StaffRole })}
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label} — {r.description}
              </option>
            ))}
          </Select>
          <Input
            label="Staff ID (optional)"
            hint="Leave blank and the system issues the next free ST-90xxx badge number."
            value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value.toUpperCase() })}
            placeholder="ST-90245"
          />
          {formError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] font-semibold text-danger-600">{formError}</p>
          )}
        </div>
      </Modal>

      {/* ------------------------------- edit modal ----------------------------- */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Staff Account"
        subtitle={editing ? `Changing access for ${editing.name}.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void submitEdit()}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Work email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input label="Contact number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select
            label="Role"
            value={form.staffRole}
            onChange={(e) => setForm({ ...form, staffRole: e.target.value as StaffRole })}
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label} — {r.description}
              </option>
            ))}
          </Select>
          <p className="rounded-xl bg-canvas px-3.5 py-3 text-[12px] leading-relaxed text-ink-muted">
            Staff ID <span className="font-bold text-ink-soft">{editing?.staffId}</span> cannot be changed. Use{' '}
            <span className="font-bold text-ink-soft">Reset</span> on the row to issue a new one-time password.
          </p>
          {formError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] font-semibold text-danger-600">{formError}</p>
          )}
        </div>
      </Modal>

      {/* ----------------------------- one-time password ------------------------ */}
      <Modal
        open={issued !== null}
        onClose={() => setIssued(null)}
        title="One-time password issued"
        subtitle="Copy it now — it is never shown again."
        footer={
          <Button block onClick={() => setIssued(null)}>
            Done
          </Button>
        }
      >
        {issued && (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-soft">
              Share these credentials with <span className="font-bold text-ink">{issued.name}</span>. They sign in at the
              staff portal using their staff ID, and can change the password after their first sign-in.
            </p>
            <div className="rounded-2xl border border-line bg-canvas px-4 py-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">Staff ID</p>
              <p className="mt-0.5 text-[16px] font-extrabold tracking-wide text-ink">{issued.staffId}</p>
              <p className="mt-3 text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">One-time password</p>
              <div className="mt-0.5 flex items-center justify-between gap-3">
                <p className="text-[16px] font-extrabold tracking-wide text-brand-700">{issued.password}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`Staff ID: ${issued.staffId}\nPassword: ${issued.password}`);
                    toast.push({ tone: 'success', title: 'Credentials copied.' });
                  }}
                >
                  <Copy size={14} /> Copy
                </Button>
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-warn-soft px-3.5 py-3 text-[12px] leading-relaxed text-warn-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Treat this like a password reset slip — show it to the person, then it is gone.
            </p>
          </div>
        )}
      </Modal>

      {/* ------------------------------ remove modal ---------------------------- */}
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove staff access"
        subtitle={removing ? `${removing.name} (${removing.staffId}) will no longer be able to sign in.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Keep Account
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void confirmRemove()}>
              Remove Access
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Their appointments and past consultations are kept for the hospital record, but the account is deleted and any
          open session stops working immediately.
        </p>
      </Modal>

      <div className="mt-6 flex items-center gap-2 text-[12px] text-ink-faint">
        <Badge tone="neutral">{summary.total} accounts</Badge>
        Access changes apply the next time the page loads.
      </div>
    </>
  );
}
