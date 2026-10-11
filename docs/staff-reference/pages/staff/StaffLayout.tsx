import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { StaffShell } from '@/components/StaffShell';
import { LoadingScreen } from '@/components/ui';
import { tokenStore } from '@/lib/api';
import { clearStaffUser, fetchStaffUser, readStaffUser } from '@/lib/staffSession';
import type { User } from '@/lib/types';

/**
 * Authenticated staff console layout.
 *
 * The profile is rehydrated from the API when the local cache is empty, so a
 * fresh tab (or a reload) with only the token still lands on the dashboard
 * instead of bouncing back to the login screen.
 */
export default function StaffLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => readStaffUser());
  const [checking, setChecking] = useState(!readStaffUser());

  useEffect(() => {
    if (!tokenStore.getStaff()) {
      navigate('/staff/login', { replace: true });
      return;
    }
    if (user) return;

    let alive = true;
    fetchStaffUser()
      .then((u) => {
        if (!alive) return;
        if (u) setUser(u);
        else {
          tokenStore.clearStaff();
          navigate('/staff/login', { replace: true });
        }
      })
      .finally(() => alive && setChecking(false));

    return () => {
      alive = false;
    };
  }, [navigate, user]);

  if (checking) return <LoadingScreen label="Loading staff console…" />;
  if (!user) return <Navigate to="/staff/login" replace />;

  return (
    <StaffShell
      user={user}
      onLogout={() => {
        tokenStore.clearStaff();
        clearStaffUser();
        navigate('/staff/login', { replace: true });
      }}
    >
      <Outlet />
    </StaffShell>
  );
}
