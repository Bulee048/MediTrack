import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Apple, Loader2 } from 'lucide-react';
import { PatientShell } from '@/components/layout/PatientShell';
import { apiClient, setAccessToken } from '@/config/api';

const COUNTRY_CODE = '94';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    const raw = phone.trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) {
      setError('Enter a valid mobile number (min 8 digits)');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }

    const formattedPhone = raw.startsWith('+') ? `+${digits}` : `+${COUNTRY_CODE}${digits}`;
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: { token: string; user: any };
      }>('/auth/login', {
        phone: formattedPhone,
        password,
      });

      if (response.data.success && response.data.data.token) {
        setAccessToken(response.data.data.token);
        const from = location.state?.from;
        navigate(['/queue', '/app/queue', '/notifications', '/app/notifications'].includes(from) ? from : '/app/home');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientShell hideTabs>
      <div className="flex min-h-[70vh] flex-col justify-center pt-6">
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Welcome Back</h1>
        <p className="mt-2 text-[13.5px] text-ink-muted">Enter your mobile number to continue securely.</p>
        {location.state?.message && <p role="status" className="mt-3 text-sm text-brand-600">{location.state.message}</p>}

        <form
          className="mt-7 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label htmlFor="login-phone" className="mb-1.5 block text-[13.5px] font-bold text-ink">Phone Number</label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
              <span className="flex items-center gap-2 border-r border-line bg-canvas px-3.5 text-sm font-semibold text-ink">
                <span className="text-base leading-none">🇱🇰</span> +{COUNTRY_CODE}
              </span>
              <input
                id="login-phone"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/[^\d\s+]/g, ''));
                  setError('');
                }}
                inputMode="numeric"
                autoFocus
                placeholder="771234567"
                className="h-[52px] flex-1 bg-transparent px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-[13.5px] font-bold text-ink">Password</label>
            <input
              id="login-password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className="h-[52px] w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          {error && <p className="text-xs font-semibold text-danger-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 h-[52px] rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-[0.985] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-ink-muted">
          New here?{' '}
          <button onClick={() => navigate('/register')} className="font-bold text-brand-600">
            Register
          </button>
        </p>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">or connect with</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex h-[52px] items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-bold text-ink hover:bg-canvas">
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.35 11.1H12v2.98h5.35c-.24 1.4-1.66 4.1-5.35 4.1a5.9 5.9 0 1 1 0-11.8c1.68 0 2.8.72 3.45 1.33l2.35-2.26C16.3 3.9 14.35 3 12 3a9 9 0 1 0 0 18c5.2 0 8.64-3.65 8.64-8.8 0-.59-.06-1.04-.29-1.9Z" />
            </svg>
            Google
          </button>
          <button className="flex h-[52px] items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-bold text-ink hover:bg-canvas">
            <Apple size={17} /> Apple
          </button>
        </div>
      </div>
    </PatientShell>
  );
}
