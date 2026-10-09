import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/config/api';
import { fetchCurrentUser, logoutPatient } from './auth.service';
import type { AuthUser } from './types';

export default function PatientAccountScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    fetchCurrentUser().then(({ user }) => { if (active) setUser(user); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const { data } = await apiClient.patch<{ data: { user: AuthUser } }>('/auth/profile', {
        name: user.name, phone: user.phone, email: user.email ?? '', address: user.address ?? '',
      });
      setUser(data.data.user); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save account'); }
    finally { setSaving(false); }
  }
  return <main className="min-h-screen bg-[#F4F7FA] p-4 sm:p-6"><div className="mx-auto max-w-md space-y-5">
    <Link className="inline-block p-3 text-teal-800" to="/app/home">Back to Home</Link>
    <h1 className="text-2xl font-bold">My Account</h1>
    {error && <p role="alert" className="text-red-700">{error} {!user && <button onClick={() => window.location.reload()}>Try again</button>}</p>}
    {saved && <p role="status">Account saved.</p>}
    {!user && !error && <p role="status">Loading account…</p>}
    {user && <form onSubmit={save} className="space-y-4 rounded-2xl border bg-white p-4">
      {(['name', 'phone', 'email', 'address'] as const).map(field => <div key={field}>
        <label htmlFor={`account-${field}`} className="mb-2 block capitalize">{field}</label>
        <input id={`account-${field}`} name={field} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
          required={field === 'name' || field === 'phone'} value={user[field] ?? ''}
          className="min-h-11 w-full min-w-0 rounded-lg border p-3" disabled={saving}
          onChange={event => { setUser({ ...user, [field]: event.target.value }); setSaved(false); }} />
      </div>)}
      <button disabled={saving} className="min-h-11 rounded-lg bg-teal-800 px-4 text-white">{saving ? 'Saving…' : 'Save account'}</button>
    </form>}
    <button className="min-h-11 rounded-lg border bg-white px-4" onClick={() => { logoutPatient(); navigate('/login', { replace: true }); }}>Sign out</button>
  </div></main>;
}
