import { BookingPatientProvider } from '@/features/family/context/BookingPatientContext';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, Home, User, Users, Clock3 } from 'lucide-react';
import { getAccessToken, useAuthSession } from '@/config/api';
import { useProfile } from '@/features/profile/context/ProfileContext';
const links = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/appointments', label: 'Visits', icon: CalendarDays },
  { to: '/queue', label: 'Queue', icon: Clock3 },
  { to: '/app/family', label: 'Family', icon: Users },
  { to: '/app/profile', label: 'Profile', icon: User },
];
export default function PatientShell() {
  const session = useAuthSession();
  const location = useLocation();
  const { user, loading, error, refreshProfile } = useProfile();
  if (!getAccessToken()) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (loading || !user) return <main className="min-h-svh bg-canvas p-5"><p role={loading ? 'status' : 'alert'}>{loading ? 'Loading patient account…' : error}</p>{!loading && <button type="button" onClick={() => void refreshProfile()}>Try again</button>}</main>;
  if (user.role !== 'PATIENT') return <main><p role="alert">This portal is for patient accounts.</p></main>;
  return (
    <BookingPatientProvider key={session}><div className="flex h-svh flex-col bg-canvas">
      <a href="#patient-content" className="sr-only focus:not-sr-only focus:p-3">Skip to content</a>
      <div id="patient-content" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-y-auto"><Outlet key={session} /></div>
      <nav aria-label="Patient navigation" className="z-40 shrink-0 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}
            className={({ isActive }) => `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 text-xs ${isActive ? 'font-bold text-brand-700' : 'text-ink-muted'}`}>
            <Icon size={19} aria-hidden="true" /><span>{label}</span>
          </NavLink>)}
        </div>
      </nav>
    </div></BookingPatientProvider>
  );
}
