import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, LogOut, UserRound } from 'lucide-react';
import { Logo, Wordmark } from '@/components/Brand';
import { Button, Input } from '@/components/ui';
import { api, tokenStore } from '@/lib/api';
import { STAFF_DEMO } from '@/lib/constants';
import { clearStaffUser, writeStaffUser } from '@/lib/staffSession';
import { cn } from '@/lib/utils';

const ROLES = [
  {
    key: 'receptionist',
    label: 'Receptionist',
    blurb: 'Front desk — check-ins, walk-ins, queue board and appointments.',
  },
  {
    key: 'doctor',
    label: 'Doctor',
    blurb: 'Clinical — your own queue, vitals, consultation notes and prescriptions.',
  },
  {
    key: 'admin',
    label: 'Admin',
    blurb: 'Full access — every department, staff accounts and system settings.',
  },
] as const;

/** Staff Login */
export default function StaffLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState<(typeof ROLES)[number]['key']>('receptionist');
  const [staffId, setStaffId] = useState(STAFF_DEMO.receptionist.staffId);
  const [password, setPassword] = useState(STAFF_DEMO.receptionist.password);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (tokenStore.getStaff()) return <Navigate to="/staff" replace />;

  const pickRole = (key: (typeof ROLES)[number]['key']) => {
    setRole(key);
    const demo = STAFF_DEMO[key];
    setStaffId(demo.staffId);
    setPassword(demo.password);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.auth.staffLogin(staffId, password, role);
      tokenStore.setStaff(res.token);
      await writeStaffUser(res.user);
      navigate('/staff', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[432px] rounded-3xl bg-white p-8 shadow-float">
        <div className="flex flex-col items-center">
          <Logo size={44} />
          <h1 className="mt-4 text-[24px] font-extrabold tracking-tight text-ink">
            <Wordmark size="md" /> <span className="text-brand-600">Staff Portal</span>
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">OPD &amp; Live Queue Management System</p>
        </div>

        <div className="mt-7 flex gap-1 rounded-full bg-canvas p-1">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => pickRole(r.key)}
              className={cn(
                'flex-1 rounded-full py-2.5 text-[12.5px] font-bold transition',
                role === r.key ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-muted hover:text-ink',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="mt-2.5 rounded-xl bg-canvas px-3.5 py-2.5 text-[12px] leading-snug text-ink-muted">
          <span className="font-bold text-ink-soft">{ROLES.find((r) => r.key === role)?.label}:</span>{' '}
          {ROLES.find((r) => r.key === role)?.blurb}
        </p>

        <form onSubmit={submit} className="mt-6">
          <Input
            label="Staff ID / Email"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            placeholder="ST-90241"
            icon={<UserRound size={16} />}
          />

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-semibold text-ink">Password</label>
              <button type="button" className="text-[12px] font-bold text-brand-600">
                Forgot?
              </button>
            </div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5">
            <span
              onClick={() => setRemember(!remember)}
              className={cn(
                'grid h-4.5 w-4.5 place-items-center rounded-[5px] border-2 transition',
                remember ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/20',
              )}
              style={{ height: 18, width: 18 }}
            >
              {remember && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              )}
            </span>
            <span className="text-[13px] text-ink-soft">Remember this terminal</span>
          </label>

          {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] font-semibold text-danger-600">{error}</p>}

          <Button type="submit" size="lg" block className="mt-6" loading={busy}>
            Sign In to Dashboard
          </Button>
        </form>

        <Button
          variant="outline"
          size="lg"
          block
          className="mt-4 border-danger text-danger-600"
          onClick={() => {
            tokenStore.clearStaff();
            clearStaffUser();
            navigate('/staff/login', { replace: true });
          }}
        >
          <LogOut size={17} /> Log Out Account
        </Button>

        <div className="mt-6 rounded-2xl border border-line bg-canvas px-4 py-3">
          <p className="text-[11.5px] font-extrabold uppercase tracking-wide text-ink-faint">Demo accounts</p>
          <ul className="mt-1.5 space-y-1">
            {(
              [
                ['Receptionist', 'ST-90241'],
                ['Reception desk', 'ST-90243'],
                ['Doctor', 'ST-90242'],
                ['Administrator', 'ST-90001'],
              ] as const
            ).map(([label, id]) => (
              <li key={id} className="flex items-center justify-between text-[12px] text-ink-muted">
                <span className="font-semibold text-ink-soft">{label}</span>
                <span className="font-bold text-ink">{id}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-line pt-2 text-[11.5px] text-ink-faint">
            Password for all demo accounts: <span className="font-bold text-ink-soft">medqueue@2026</span>. Administrators
            can create real accounts from <span className="font-bold text-ink-soft">Team &amp; Access</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

