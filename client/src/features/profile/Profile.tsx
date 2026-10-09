import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { Button } from '@/components/ui/button';
import { useProfile } from './context/ProfileContext';
import { familyApi } from '@/features/family/api/familyApi';
import type { FamilyMember } from '@/features/family/types';
import { fmtMediumDate, initials } from '@/lib/formatters';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useProfile();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    familyApi.getFamilyMembers().then(setFamilyMembers).catch(() => {});
  }, []);

  return (
    <PhoneShell
      title="Patient Profile"
      action={
        <button
          type="button"
          onClick={() => navigate('/app/settings')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft hover:bg-slate-50 transition min-h-0"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      }
    >
      {/* Identity Card */}
      <div className="mt-1 flex items-center gap-4 rounded-2xl bg-brand-600 p-5 text-white shadow-card">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/95 text-[19px] font-extrabold text-brand-600 ring-4 ring-white/20">
          {initials(user?.name || 'Patient')}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-extrabold tracking-tight">{user?.name}</p>
          <p className="mt-1 truncate text-[12px] text-white/80 font-medium">
            ID: {user?.displayId} · Since {user?.memberSince}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <Section title="Personal Information">
        <Row label="Phone Number" value={user?.phone ?? '—'} />
        <Row label="Email Address" value={user?.email ?? '—'} />
        <Row label="Date of Birth" value={user?.dob ? fmtMediumDate(user.dob) : '—'} />
        <Row
          label="Gender / Blood Group"
          value={[user?.gender, user?.bloodGroup].filter(Boolean).join(' · ') || '—'}
        />
        {user?.address && <Row label="Residential Address" value={user.address} />}
      </Section>

      {/* Emergency Contact */}
      {user?.emergencyContact && (
        <Section title="Emergency Contact">
          <Row label="Contact Name" value={user.emergencyContact.name} />
          <Row label="Relationship" value={user.emergencyContact.relationship} />
          <Row label="Phone Number" value={user.emergencyContact.phone} />
        </Section>
      )}

      {/* Medical Information */}
      <Section title="Medical Information">
        <Row
          label="Known Allergies"
          value={user?.allergies?.length ? user.allergies.join(', ') : 'None recorded'}
          danger={Boolean(user?.allergies?.length)}
        />
        <Row
          label="Chronic Conditions"
          value={user?.chronic?.length ? user.chronic.join(', ') : 'None recorded'}
        />
      </Section>

      {/* Insurance Details */}
      <Section title="Insurance Details">
        <Row label="Provider" value={user?.insuranceProvider ?? '—'} />
        <Row label="Policy Number" value={user?.insurancePolicyNo ?? '—'} />
      </Section>

      {/* Family Members Section */}
      <Section title="Family Members">
        {familyMembers.length === 0 ? (
          <p className="py-2 text-[13px] text-ink-muted">No family members registered yet.</p>
        ) : (
          familyMembers.map((m) => (
            <Row key={m.id} label={m.name} value={m.relation} />
          ))
        )}
        <button
          type="button"
          onClick={() => navigate('/app/book/family')}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 py-2.5 text-[12.5px] font-bold text-brand-700 hover:bg-brand-100 transition min-h-0"
        >
          <Users size={15} /> + Manage &amp; Book for Family
        </button>
      </Section>

      <div className="mt-6 space-y-3">
        <Button
          size="lg"
          className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
          onClick={() => navigate('/app/profile/edit')}
        >
          Edit Profile
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full border-danger text-danger-600 hover:bg-danger-soft font-bold"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          Log Out Account
        </Button>
      </div>

      <p className="mt-6 text-center text-[11.5px] text-ink-muted">
        {user?.stats?.totalAppointments ?? 0} appointments · {user?.stats?.completedVisits ?? 0} completed visits
        {user?.memberSince && ` · Registered in ${user.memberSince}`}
      </p>
    </PhoneShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card">
      <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">{title}</h3>
      <div className="mt-3 divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-[12.5px] font-medium text-ink-muted">{label}</span>
      <span className={`max-w-[58%] text-right text-[12.5px] font-bold ${danger ? 'text-danger-600' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
