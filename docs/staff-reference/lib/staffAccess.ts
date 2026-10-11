/**
 * Staff access rules — the single source of truth for the console.
 *
 * The API enforces the same rules in `server/src/auth.ts`; this module decides
 * what the sidebar shows and which routes a signed-in staff member may open, so
 * a receptionist never sees a page they cannot use. Keep the two in step: the
 * server is the authority, this is what the UI renders from.
 */
import {
  CalendarDays,
  ClipboardList,
  Gauge,
  KeyRound,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Stethoscope,
  Timer,
  Users,
  type LucideIcon,
  Database,
} from 'lucide-react';
import type { StaffPermissions, StaffRole, User } from './types';

/**
 * Derive permissions from a role. Used as the fallback when a cached profile
 * predates the permissions field, and by the login screen to preview a role.
 */
export function permissionsFor(role?: StaffRole): StaffPermissions {
  const admin = role === 'admin';
  const doctor = role === 'doctor';
  const reception = role === 'receptionist' || !role;
  return {
    role: role ?? 'receptionist',
    isAdmin: admin,
    isDoctor: doctor,
    seeAllDepartments: admin || reception,
    manageStaff: admin,
    manageSystem: admin,
    registerWalkIns: admin || reception,
    manageQueue: true,
    completeConsultations: admin || doctor,
    viewAnalytics: admin || reception,
  };
}

/** Read the permissions off a profile, falling back to the role when absent. */
export function permissionsOf(user: Pick<User, 'staffRole' | 'permissions'>): StaffPermissions {
  return user.permissions ?? permissionsFor(user.staffRole);
}

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** null = every role; otherwise the permission key that unlocks it */
  needs?: keyof StaffPermissions | null;
};

/** Sidebar entries, split into the two groups the shell renders. */
export const STAFF_NAV: NavItem[] = [
  { to: '/staff', label: 'Dashboard', icon: LayoutGrid, end: true, needs: null },
  { to: '/staff/appointments', label: 'Appointments', icon: CalendarDays, needs: 'registerWalkIns' },
  { to: '/staff/queue', label: 'Queue Board', icon: Timer, needs: 'manageQueue' },
  { to: '/staff/patients', label: 'Patients', icon: Users, needs: null },
  { to: '/staff/doctors', label: 'Doctors', icon: Stethoscope, needs: null },
  { to: '/staff/consultation', label: 'Consultation', icon: ClipboardList, needs: 'completeConsultations' },
  { to: '/staff/otp', label: 'OTP Delivery', icon: KeyRound, needs: 'manageSystem' },
  { to: '/staff/team', label: 'Team & Access', icon: ShieldCheck, needs: 'manageStaff' },
  { to: '/staff/database', label: 'Database', icon: Database, needs: 'manageStaff' },
  { to: '/staff/stats', label: 'Analytics', icon: Gauge, needs: 'viewAnalytics' },
  { to: '/staff/settings', label: 'System Settings', icon: Settings, needs: 'manageSystem' },
];

export const STAFF_NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  { heading: 'Operations', items: STAFF_NAV.slice(0, 6) },
  { heading: 'Administration', items: STAFF_NAV.slice(6) },
];

/** The nav groups this role can see, with empty groups dropped. */
export function navFor(perms: StaffPermissions): { heading: string; items: NavItem[] }[] {
  return STAFF_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => !item.needs || perms[item.needs]),
  })).filter((g) => g.items.length > 0);
}

/** True when this role may open the given route. */
export function canOpen(perms: StaffPermissions, path: string): boolean {
  const item = STAFF_NAV.find((n) => n.to === path);
  if (!item) return true; // not a gated page
  return !item.needs || Boolean(perms[item.needs]);
}

/** Why a role cannot open a page, phrased for the person sitting at the desk. */
export const DENIAL_COPY: Record<string, string> = {
  manageStaff: 'Only a hospital administrator can invite staff, change roles, or remove access.',
  manageSystem: 'Only a hospital administrator can change the OTP gateway or system settings.',
  viewAnalytics: 'Analytics are available to receptionists and administrators.',
  registerWalkIns: 'Walk-in registration is handled at the front desk by reception staff.',
  completeConsultations: 'Only the treating doctor, or an administrator, can write consultation notes.',
  manageQueue: 'Your role cannot run the queue.',
};

/** Explains, in plain language, why this role cannot open the given page. */
export function denialFor(path: string): string {
  const item = STAFF_NAV.find((n) => n.to === path);
  if (!item?.needs) return 'You do not have access to this page.';
  return DENIAL_COPY[item.needs] ?? 'You do not have access to this page.';
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  receptionist: 'Receptionist',
  doctor: 'Doctor',
  admin: 'Administrator',
};

/** Short badge copy explaining the scope of a role, shown in the sidebar. */
export function scopeLabel(perms: StaffPermissions): string {
  if (perms.isAdmin) return 'full access to every department';
  if (perms.isDoctor) return 'clinical access only';
  return 'front-desk access';
}
