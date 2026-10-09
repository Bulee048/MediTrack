import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FeaturePageContent } from '@/components/FeaturePageContent';
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
  const { user, updateProfile, loading, error } = useProfile();

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

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name, phone: user.phone, email: user.email, dob: user.dob,
      gender: user.gender, bloodGroup: user.bloodGroup, insuranceProvider: user.insuranceProvider,
      insurancePolicyNo: user.insurancePolicyNo, address: user.address,
      emergencyName: user.emergencyContact?.name ?? '', emergencyRelation: user.emergencyContact?.relationship ?? '',
      emergencyPhone: user.emergencyContact?.phone ?? '' });
  }, [user]);
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
        address: form.address,
      });
      toast.success('Profile updated successfully');
      navigate('/app/profile');
    } catch (err) {
      toast.error((err as Error).message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <FeaturePageContent title="Edit Profile" back><p role={loading ? "status" : "alert"}>{loading ? "Loading profile…" : error}</p></FeaturePageContent>;

  return (
    <FeaturePageContent title="Edit Profile" back>
      <p role="status" className="mb-4 text-sm text-ink-muted">Medical, insurance and emergency-contact fields are not supported by the profile API and cannot be edited.</p>
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
        </span>
      </div>

      <div className="mt-7 space-y-4">
        <div>
          <label htmlFor="profile-full-name" className="mb-1.5 block text-[13px] font-semibold text-ink">Full Name</label>
          <Input id="profile-full-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Your full name"
            className={errors.name ? 'border-danger' : ''}
          />
          {errors.name && <p className="mt-1 text-xs text-danger-600 font-medium">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="profile-phone-number" className="mb-1.5 block text-[13px] font-semibold text-ink">Phone Number</label>
          <Input id="profile-phone-number"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+94 77 123 4567"
            className={errors.phone ? 'border-danger' : ''}
          />
          {errors.phone && <p className="mt-1 text-xs text-danger-600 font-medium">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="profile-email-address" className="mb-1.5 block text-[13px] font-semibold text-ink">Email Address</label>
          <Input id="profile-email-address"
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
            <label htmlFor="profile-date-of-birth" className="mb-1.5 block text-[13px] font-semibold text-ink">Date of Birth</label>
            <Input id="profile-date-of-birth"
              type="date"
              value={form.dob}
              onChange={(e) => set('dob', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="profile-gender" className="mb-1.5 block text-[13px] font-semibold text-ink">Gender</label>
            <Select id="profile-gender"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option value="">Not provided</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-blood-group" className="mb-1.5 block text-[13px] font-semibold text-ink">Blood Group</label>
            <Select id="profile-blood-group"
              disabled
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
            <label htmlFor="profile-insurance-provider" className="mb-1.5 block text-[13px] font-semibold text-ink">Insurance Provider</label>
            <Input id="profile-insurance-provider"
              disabled
              value={form.insuranceProvider}
              onChange={(e) => set('insuranceProvider', e.target.value)}
              placeholder="E.g. SLIC"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-policy-number" className="mb-1.5 block text-[13px] font-semibold text-ink">Policy Number</label>
          <Input id="profile-policy-number"
            disabled
              value={form.insurancePolicyNo}
            onChange={(e) => set('insurancePolicyNo', e.target.value)}
            placeholder="Insurance policy or card number"
          />
        </div>

        <div>
          <label htmlFor="profile-residential-address" className="mb-1.5 block text-[13px] font-semibold text-ink">Residential Address</label>
          <Textarea id="profile-residential-address"
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
          <label htmlFor="profile-contact-name" className="mb-1.5 block text-[13px] font-semibold text-ink">Contact Name</label>
          <Input id="profile-contact-name"
            disabled
              value={form.emergencyName}
            onChange={(e) => set('emergencyName', e.target.value)}
            placeholder="Emergency contact full name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-relationship" className="mb-1.5 block text-[13px] font-semibold text-ink">Relationship</label>
            <Select id="profile-relationship"
              disabled
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
            <label htmlFor="profile-contact-phone" className="mb-1.5 block text-[13px] font-semibold text-ink">Contact Phone</label>
            <Input id="profile-contact-phone"
              disabled
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
    </FeaturePageContent>
  );
}
