import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { fetchCurrentUser } from './auth.service';
import { getAuthToken } from './auth.storage';

// Auth boundary only: the integration branch owns the shared patient layout.
export default function PatientAccess() {
  const location = useLocation();
  const [token, setToken] = useState(getAuthToken);
  const [state, setState] = useState<'loading' | 'patient' | 'error'>('loading');
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setToken(getAuthToken());
    window.addEventListener('meditrack-auth-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('meditrack-auth-change', sync); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => {
    let active = true;
    setState('loading');
    if (token) fetchCurrentUser().then(({ user }) => {
      if (!active) return;
      if (user.role !== 'PATIENT') throw new Error('Patient account required');
      setVerifiedToken(token);
      setState('patient');
    }).catch(e => { if (active) { setError(e.message); setState('error'); } });
    return () => { active = false; };
  }, [token]);
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (state === 'loading' || (state === 'patient' && verifiedToken !== token)) return <p role="status" className="p-6">Checking patient session…</p>;
  if (state === 'error') return <div role="alert" className="p-6">{error} <button onClick={() => window.location.reload()}>Try again</button></div>;
  return <Outlet />;
}
