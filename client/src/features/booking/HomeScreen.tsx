import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/config/api';
import { NotificationApiService } from '@/services/notificationApi';
import { PatientVisitSummary } from './PatientVisitSummary';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarPlus,
  Clock3,
  LayoutGrid,
  RotateCcw,
  Search,
  User2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDepartments } from '@/features/doctors/departments.service';
import { useProfile } from '@/features/profile/context/ProfileContext';
import type { DoctorDepartment } from '@/features/doctors/types';
import { LiveDigitalClock } from '@/components/ui/LiveDigitalClock';

const QUICK_ACTIONS = [
  {
    label: 'Book OPD',
    desc: 'New Appointment',
    icon: CalendarPlus,
    to: '/app/departments',
    bg: 'bg-[#EBF5FB]',
    iconColor: 'text-[#146C94]',
  },
  {
    label: 'My Queue',
    desc: 'Live OPD Status',
    icon: Clock3,
    to: '/queue',
    bg: 'bg-[#E8F8F2]',
    iconColor: 'text-[#20A779]',
  },
  {
    label: 'Departments',
    desc: 'Medical Specialties',
    icon: LayoutGrid,
    to: '/app/departments',
    bg: 'bg-[#F3EEFE]',
    iconColor: 'text-[#8B5CF6]',
  },
  {
    label: 'My Profile',
    desc: 'Medical Record',
    icon: User2,
    to: '/app/profile',
    bg: 'bg-[#FEF7EC]',
    iconColor: 'text-[#E9A23B]',
  },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const session = useAuthSession();
  const updates = useQuery({
    queryKey: ['myNotifications', session],
    queryFn: () => NotificationApiService.getUserNotifications(),
    refetchOnMount: false,
  });
  const unread = updates.data?.filter((item) => !item.isRead && !item.isDismissed).length ?? 0;
  const { user } = useProfile();
  const [query, setQuery] = useState('');
  const [departments, setDepartments] = useState<DoctorDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDepartments = () => {
    setLoading(true);
    setError('');
    fetchDepartments()
      .then((items) => {
        setDepartments(items);
        setError('');
      })
      .catch((err: unknown) => {
        setDepartments([]);
        setError(err instanceof Error ? err.message : 'Unable to load departments');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((department) =>
      [department.name, department.code, department.description ?? ''].join(' ').toLowerCase().includes(q)
    );
  }, [departments, query]);

  return (
    <main data-feature-accessibility className="patient-page page-enter pb-24">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* SECTION A: PREMIUM WELCOMING HEADER */}
        <div className="relative overflow-hidden rounded-3xl border border-[#DCE8EE] bg-gradient-to-r from-white via-[#F6FAFD] to-[#DDF3F2]/50 p-6 shadow-sm">
          {/* Subtle background ambient blur */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#18A6A6]/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18A6A6] via-[#146C94] to-[#105779] text-white shadow-md shadow-[#146C94]/20 font-black text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64798B]">
                  Welcome to CareFlow,
                </p>
                <h1 className="text-xl font-black text-[#183247] tracking-tight">
                  {user?.name || 'Valued Patient'}
                </h1>
              </div>
            </div>

            <button
              onClick={() => navigate('/notifications')}
              aria-label={`View notifications${unread ? `, ${unread} unread` : ''}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#DCE8EE] bg-white text-[#146C94] shadow-sm transition hover:bg-[#EBF5FB] active:scale-95"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DE6470] px-1 text-[0.625rem] font-black text-white shadow-sm animate-pulse">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SECTION B: LIVE DATE & DIGITAL CLOCK WIDGET */}
        <LiveDigitalClock />

        {/* SECTION C: NEXT APPOINTMENT & SMART LIVE QUEUE CARDS */}
        <PatientVisitSummary />

        {/* SECTION D: DEPARTMENT SEARCH INPUT */}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#64798B]">
            <Search size={18} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, clinical specialties, or OPD rooms…"
            aria-label="Search departments and specialties"
            className="h-13 min-h-[50px] rounded-2xl border-[#DCE8EE] bg-white pl-11 pr-11 text-sm font-semibold text-[#183247] placeholder:text-[#8EA3B0] focus-visible:border-[#146C94] focus-visible:ring-4 focus-visible:ring-[#146C94]/10 shadow-sm transition-all"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#8EA3B0] hover:text-[#183247]"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* SECTION E: FIND CARE FASTER FEATURE CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#105779] via-[#146C94] to-[#18A6A6] p-6 text-white shadow-lg shadow-[#146C94]/20">
          {/* Subtle medical geometric patterns */}
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full border-[18px] border-white/10" />
          <div className="pointer-events-none absolute right-20 -top-6 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-[#DDF3F2] w-fit">
              <Sparkles size={13} />
              <span>Smart Hospital Scheduling</span>
            </div>

            <h2 className="mt-3 text-xl font-black tracking-tight text-white leading-snug">
              Find Care Faster with Verified OPD Specialists
            </h2>
            <p className="mt-1.5 text-xs text-white/85 leading-relaxed">
              Explore open consultation slots, check real-time queue lengths, and book OPD visits for yourself or family members.
            </p>

            <Button
              onClick={() => navigate('/app/departments')}
              className="mt-5 rounded-2xl bg-white px-5 py-2.5 text-xs font-black text-[#146C94] shadow-md hover:bg-[#F6FAFD] active:scale-95 transition"
            >
              Browse Specialties
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>

        {/* SECTION F: QUICK ACTIONS TILES */}
        <div>
          <h2 className="text-base font-black tracking-tight text-[#183247]">
            Quick Actions
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="group flex flex-col items-start gap-3 rounded-3xl border border-[#DCE8EE] bg-white p-4 text-left shadow-sm transition-all hover:border-[#146C94]/30 hover:shadow-md active:scale-97"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.bg} ${action.iconColor} transition group-hover:scale-105`}>
                  <action.icon size={20} />
                </span>
                <div>
                  <span className="block text-sm font-extrabold text-[#183247] group-hover:text-[#146C94]">
                    {action.label}
                  </span>
                  <span className="block text-[0.6875rem] font-semibold text-[#8EA3B0]">
                    {action.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: NEARBY SPECIALTIES DIRECTORY */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-[#183247]">
              OPD Specialties
            </h2>
            <button
              onClick={() => navigate('/app/departments')}
              className="text-xs font-bold text-[#146C94] hover:underline"
            >
              View All ({departments.length})
            </button>
          </div>

          {loading ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-[#DCE8EE] bg-white p-4 shadow-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-11 w-11 rounded-2xl bg-[#E2EEF4]" />
                    <Skeleton className="h-3.5 w-24 bg-[#E2EEF4]" />
                    <Skeleton className="h-2.5 w-12 bg-[#E2EEF4]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-3 rounded-2xl border border-[#DE6470]/30 bg-[#FDECEF] p-4 text-xs font-semibold text-[#DE6470]">
              <p>{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={loadDepartments}
                className="mt-2 text-xs"
              >
                <RotateCcw size={12} className="mr-1.5" /> Try Again
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-3 rounded-3xl border border-dashed border-[#DCE8EE] bg-white p-6 text-center text-xs text-[#64798B]">
              No specialties found matching &quot;{query}&quot;.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {results.slice(0, 4).map((department) => (
                <button
                  key={department.id}
                  onClick={() =>
                    navigate(
                      `/app/doctors?departmentId=${department.id}&name=${encodeURIComponent(
                        department.name
                      )}`
                    )
                  }
                  className="flex flex-col items-center gap-2 rounded-3xl border border-[#DCE8EE] bg-white p-4 text-center shadow-sm transition hover:border-[#146C94]/40 hover:shadow-md active:scale-97"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EBF5FB] text-[#146C94]">
                    <Building2 size={20} />
                  </span>
                  <span className="text-xs font-extrabold text-[#183247] leading-tight line-clamp-1">
                    {department.name}
                  </span>
                  <span className="text-[0.625rem] font-bold text-[#8EA3B0]">
                    {department.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
