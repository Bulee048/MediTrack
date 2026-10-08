import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientShell } from '@/components/layout/PatientShell';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { apiClient, setAccessToken } from '@/config/api';

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: '',
    email: '',
    password: '',
  });

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const next = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Enter your full name';
    if (form.phone.replace(/\D/g, '').length < 8) e.phone = 'Enter a valid mobile number';
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(2);
  };

  const finish = async () => {
    if (loading) return;
    if (form.password.length < 8) {
      setErrors({ password: 'Use at least 8 characters for your password' });
      return;
    }
    const raw = form.phone.trim();
    const digits = raw.replace(/\D/g, '');
    const phone = raw.startsWith('+') ? `+${digits}` : `+94${digits}`;
    setLoading(true);
    setErrors({});
    try {
      await apiClient.post('/auth/register', {
        name: form.fullName.trim(),
        phone,
        email: form.email.trim() || undefined,
        password: form.password,
      });
    } catch (error) {
      setErrors({ submit: axios.isAxiosError(error) ? error.response?.data?.message || 'Registration failed. Please try again.' : 'Registration failed. Please try again.' });
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.post<{ data: { token: string } }>('/auth/login', {
        phone,
        password: form.password,
      });
      const token = response.data.data.token;
      if (!token) throw new Error('Missing access token');
      setAccessToken(token);
      navigate('/app/home');
    } catch {
      // The account already exists at this point; retry through login, not registration.
      navigate('/login', { state: { message: 'Your account was created. Please sign in with your phone number and password.' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientShell title="Patient Registration" back={() => navigate('/login')}>
      <div className="flex items-center justify-between pt-2">
        <p className="text-[15px] font-extrabold text-ink">Patient Details</p>
        <p className="text-[12px] font-bold text-brand-600">Step {step} of 2</p>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <span className="h-1.5 flex-1 rounded-full bg-brand-600" />
        <span className={cn('h-1.5 flex-1 rounded-full', step === 2 ? 'bg-brand-600' : 'bg-ink/10')} />
      </div>

      {step === 1 ? (
        <div className="mt-7 space-y-5">
          <div>
            <label className="mb-1.5 block text-[13.5px] font-bold text-ink">Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              placeholder="e.g. Sarah Williams"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              autoFocus
            />
            {errors.fullName && <p className="mt-1 text-xs font-semibold text-danger-600">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-bold text-ink">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-bold text-ink">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand-500"
              >
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-bold text-ink">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              inputMode="numeric"
              placeholder="98765 43210"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-brand-500"
            />
            {errors.phone && <p className="mt-1 text-xs font-semibold text-danger-600">{errors.phone}</p>}
          </div>

          <button
            onClick={next}
            className="mt-6 flex w-full items-center justify-center h-[52px] rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-[0.985]"
          >
            Next Step
          </button>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          <div>
            <label className="mb-1.5 block text-[13.5px] font-bold text-ink">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 space-y-3">
            <div>
              <label htmlFor="registration-password" className="mb-1.5 block text-[13.5px] font-bold text-ink">Password</label>
              <input
                id="registration-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'registration-password-error' : undefined}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
              {errors.password && <p id="registration-password-error" role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.password}</p>}
            </div>
            {errors.submit && <p role="alert" className="text-xs font-semibold text-danger-600">{errors.submit}</p>}
            <button
              onClick={finish}
              disabled={loading}
              className="flex w-full items-center justify-center h-[52px] rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-[0.985]"
            >
              {loading ? 'Creating account...' : 'Complete Registration'}
            </button>
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex w-full items-center justify-center h-11 rounded-xl border border-line bg-white text-sm font-semibold text-ink hover:bg-canvas"
            >
              Back to Step 1
            </button>
          </div>
        </div>
      )}
    </PatientShell>
  );
}
