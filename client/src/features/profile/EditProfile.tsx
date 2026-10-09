import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PhoneShell } from '@/components/PhoneShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from './context/ProfileContext';
import type { UserProfile } from './types';

const BLOOD_GROUPS = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];
const RELATIONS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Guardian', 'Other'];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useProfile();

  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    dob: user?.dob ?? '',
    gender: user?.gender ?? 'Male',
    bloodGroup: user?.bloodGroup ?? '',
    insuranceProvider: user?.insuranceProvider ?? '',
    insurancePolicyNo: user?.insurancePolicyNo ?? '',
    address: user?.address ?? '',
    emergencyName: user?.emergencyContact?.name ?? '',
    emergencyRelation: user?.emergencyContact?.relationship ?? '',
    emergencyPhone: user?.emergencyContact?.phone ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (form.phone.replace(/\D/g, '').length < 8) e.phone = 'Enter a valid phone number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        email: form.email,
        dob: form.dob,
        gender: form.gender as UserProfile['gender'],
        bloodGroup: form.bloodGroup,
        insuranceProvider: form.insuranceProvider,
        insurancePolicyNo: form.insurancePolicyNo,
        address: form.address,
        emergencyContact: form.emergencyName
          ? {
              name: form.emergencyName,
              relationship: form.emergencyRelation || 'Other',
              phone: form.emergencyPhone,
            }
          : undefined,
      });
      toast.success('Profile updated successfully');
      navigate('/app/profile');
    } catch (err) {
      toast.error((err as Error).message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PhoneShell title="Edit Profile" back>
      {/* Profile Picture */}
      <div className="flex flex-col items-center pt-2">
        <span className="relative grid h-24 w-24 place-items-center rounded-full bg-brand-50 text-brand-600 border border-brand-200">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="9" r="3.6" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
          <span className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white ring-4 ring-white shadow">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </span>
        <button
          type="button"
          onClick={() => toast.info('Photo upload capability ready in production build')}
          className="mt-3 text-[13px] font-bold text-brand-600 hover:text-brand-700 min-h-0"
        >
          Change Profile Picture
        </button>
      </div>

      <div className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Full Name</label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Your full name"
            className={errors.name ? 'border-danger' : ''}
          />
          {errors.name && <p className="mt-1 text-xs text-danger-600 font-medium">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Phone Number</label>
          <Input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+94 77 123 4567"
            className={errors.phone ? 'border-danger' : ''}
          />
          {errors.phone && <p className="mt-1 text-xs text-danger-600 font-medium">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Email Address</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="patient@example.com"
            className={errors.email ? 'border-danger' : ''}
          />
          {errors.email && <p className="mt-1 text-xs text-danger-600 font-medium">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Date of Birth</label>
            <Input
              type="date"
              value={form.dob}
              onChange={(e) => set('dob', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Gender</label>
            <Select
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Blood Group</label>
            <Select
              value={form.bloodGroup}
              onChange={(e) => set('bloodGroup', e.target.value)}
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Insurance Provider</label>
            <Input
              value={form.insuranceProvider}
              onChange={(e) => set('insuranceProvider', e.target.value)}
              placeholder="E.g. SLIC"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Policy Number</label>
          <Input
            value={form.insurancePolicyNo}
            onChange={(e) => set('insurancePolicyNo', e.target.value)}
            placeholder="Insurance policy or card number"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Residential Address</label>
          <Textarea
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            placeholder="Street address, city, district"
          />
        </div>

        <p className="pt-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
          Emergency Contact
        </p>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Contact Name</label>
          <Input
            value={form.emergencyName}
            onChange={(e) => set('emergencyName', e.target.value)}
            placeholder="Emergency contact full name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Relationship</label>
            <Select
              value={form.emergencyRelation}
              onChange={(e) => set('emergencyRelation', e.target.value)}
            >
              <option value="">Select</option>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Contact Phone</label>
            <Input
              value={form.emergencyPhone}
              onChange={(e) => set('emergencyPhone', e.target.value)}
              placeholder="+94 7X XXX XXXX"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button
          size="lg"
          className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full font-bold"
          onClick={() => navigate('/app/profile')}
        >
          Cancel
        </Button>
      </div>
    </PhoneShell>
  );
}
