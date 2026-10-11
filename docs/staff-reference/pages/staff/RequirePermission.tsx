/**
 * Route guard for staff-console pages that only some roles may open.
 *
 * The API enforces the same rule server-side — this exists so a receptionist
 * who types `/staff/team` gets a clear explanation instead of a blank frame or
 * a wall of 403s.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, LoadingScreen } from '@/components/ui';
import { fetchStaffUser, readStaffUser } from '@/lib/staffSession';
import { canOpen, denialFor, permissionsOf } from '@/lib/staffAccess';
import type { StaffPermissions } from '@/lib/types';

export function RequirePermission({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cached = readStaffUser();
  const [perms, setPerms] = useState<StaffPermissions | null>(() => (cached ? permissionsOf(cached) : null));
  const [checking, setChecking] = useState(!cached);

  useEffect(() => {
    if (perms) return;
    let alive = true;
    fetchStaffUser()
      .then((u) => alive && setPerms(u ? permissionsOf(u) : null))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [perms]);

  if (checking) return <LoadingScreen label="Checking your access…" />;
  // No profile means the session expired; StaffLayout already redirects.
  if (!perms) return null;
  if (canOpen(perms, pathname)) return <>{children}</>;

  return (
    <Card>
      <CardBody>
        <EmptyState
          icon={<ShieldAlert size={30} />}
          title="You do not have access to this page"
          description={denialFor(pathname)}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" onClick={() => navigate('/staff')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate('/staff/login')}>Switch Account</Button>
            </div>
          }
        />
      </CardBody>
    </Card>
  );
}
