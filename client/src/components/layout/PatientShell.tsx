import { useAccessibility } from '@/features/accessibility/context/AccessibilityContext';
import { useState } from 'react';
import { InAppAlerts } from '@/features/notifications/InAppAlerts';
import { useEffect } from 'react';
import { BookingPatientProvider } from '@/features/family/context/BookingPatientContext';
import { NavLink, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { CalendarDays, Home, User, Users, Clock3, Bell, SlidersHorizontal } from 'lucide-react';
import { Brand } from '@/components/ui/brand';
import { ErrorState, LoadingState } from '@/components/ui/feedback';
import { getAccessToken, useAuthSession } from '@/config/api';
import { useProfile } from '@/features/profile/context/ProfileContext';
import { PatientFloatingNav } from './PatientFloatingNav';
const links = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/appointments', label: 'Visits', icon: CalendarDays },
  { to: '/queue', label: 'Queue', icon: Clock3 },
  { to: '/app/family', label: 'Family', icon: Users },
  { to: '/app/profile', label: 'Profile', icon: User },
];
export default function PatientShell() {
  const { settings } = useAccessibility();
  const [pageAnnouncement, setPageAnnouncement] = useState('');
  const session = useAuthSession();
  const location = useLocation();
  const { user, loading, error, refreshProfile } = useProfile();
  useEffect(() => {
    const content = document.getElementById('patient-content'); content?.focus();
    const announce = () => setPageAnnouncement(settings.screenReader ? (content?.querySelector('h1')?.textContent ?? '') : '');
    announce();
    if (!content || !settings.screenReader) return;
    const observer = new MutationObserver(announce); observer.observe(content, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [location.pathname, settings.screenReader, loading]);
  if (!getAccessToken()) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (loading || !user) return <main className="ambient-background min-h-svh p-5"><div className="mx-auto mt-10 max-w-md"><Brand /><div className="mt-6">{loading ? <LoadingState label="Loading patient account…" /> : <ErrorState message={error} retry={() => void refreshProfile()} />}</div></div></main>;
  if (user.role !== 'PATIENT') return <main><p role="alert">This portal is for patient accounts.</p></main>;
  return (
    <BookingPatientProvider key={session}><InAppAlerts /><p className="sr-only" role="status" aria-live="polite">{pageAnnouncement}</p><div className="patient-shell ambient-background">
      <a href="#patient-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3">Skip to content</a>
      <aside className="patient-desktop-nav"><Link to="/app/home" className="px-3"><Brand /></Link><p className="mb-3 mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Patient workspace</p><nav aria-label="Desktop patient navigation">{links.map(({to,label,icon:Icon})=><NavLink key={to} to={to} className="nav-item"><Icon size={20} aria-hidden="true" />{label}</NavLink>)}<NavLink to="/notifications" className="nav-item"><Bell size={20} aria-hidden="true" />Notifications</NavLink><NavLink to="/app/settings" className="nav-item"><SlidersHorizontal size={20} aria-hidden="true" />Preferences</NavLink></nav><div className="mt-auto rounded-2xl border border-line bg-canvas p-4"><p className="text-xs text-ink-muted">Signed in as</p><p className="mt-1 break-words text-sm font-bold">{user.name}</p><p className="mt-1 text-xs text-brand-700">Patient account</p></div></aside>
      <div id="patient-content" tabIndex={-1} className="patient-content"><Outlet key={session} /></div>
      <div className="patient-bottom-nav">
        <PatientFloatingNav />
      </div>
    </div></BookingPatientProvider>
  );
}
