import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/config/api';
import { NotificationApiService } from '@/services/notificationApi';
import { PatientVisitSummary } from './PatientVisitSummary';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarPlus, Clock3, LayoutGrid, RotateCcw, Search, User2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDepartments } from '@/features/doctors/departments.service';
import { useProfile } from '@/features/profile/context/ProfileContext';
import type { DoctorDepartment } from '@/features/doctors/types';

const QUICK_ACTIONS = [
  { label: 'Book OPD', icon: CalendarPlus, to: '/app/departments', tone: 'bg-brand-50 text-brand-600' },
  { label: 'My Queue', icon: Clock3, to: '/queue', tone: 'bg-brand-50 text-brand-700' },
  { label: 'Departments', icon: LayoutGrid, to: '/app/departments', tone: 'bg-info-soft text-info' },
  { label: 'My Profile', icon: User2, to: '/app/profile', tone: 'bg-brand-50 text-brand-700' },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const session = useAuthSession();
  const updates = useQuery({ queryKey: ['myNotifications', session], queryFn: () => NotificationApiService.getUserNotifications(), refetchOnMount: false });
  const unread = updates.data?.filter(item => !item.isRead).length ?? 0;
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
    <main data-feature-accessibility className="patient-page page-enter">
      <div className="mx-auto w-full max-w-5xl space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Welcome back,</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">{user?.name || 'Welcome Back'}</h1>
          </div>
          <button onClick={() => navigate('/notifications')} aria-label={`View notifications${unread?`, ${unread} unread`: ''}`} className="icon-button relative"><Bell size={20} className="mx-auto" />{unread>0&&<span className="absolute -right-1 -top-1 rounded-full bg-brand-700 px-1.5 py-0.5 text-xs text-white">{unread>99?'99+':unread}</span>}</button>
        </div>

        <PatientVisitSummary />
        <div className="relative mt-6">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <Search size={18} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments…"
            aria-label="Search departments and specialties"
            className="h-12 min-h-[44px] border-line bg-white pl-10 pr-10 text-ink placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-r-md"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-100">Find care faster</span>
            <span className="text-[0.71875rem] font-semibold text-white/80">Browse specialties</span>
          </div>
          <p className="mt-3 text-[1.0625rem] font-extrabold leading-snug">
            Choose a department, then pick the doctor and time that suits you.
          </p>
          <p className="mt-1 text-[0.78125rem] text-white/80">Use the departments directory to start booking an OPD visit.</p>
          <Button
            size="sm"
            className="mt-4 h-11 min-h-[44px] bg-white font-bold text-brand-600 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => navigate('/app/departments')}
          >
            View Departments
          </Button>
        </div>

        <h2 className="mt-7 text-[1rem] font-extrabold tracking-tight text-ink">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex min-h-[72px] flex-col items-start gap-3 surface p-4 text-left shadow-sm transition hover:border-brand-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.98]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${action.tone}`}>
                <action.icon size={19} />
              </span>
              <span className="text-[0.84375rem] font-bold text-ink">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-[1rem] font-extrabold tracking-tight text-ink">Nearby Specialties</h2>
          <button
            onClick={() => navigate('/app/departments')}
            className="inline-flex min-h-[44px] items-center px-2 text-[0.78125rem] font-bold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading specialties" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="surface px-2 py-4 shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-11 w-11 rounded-xl bg-line" />
                  <Skeleton className="h-3.5 w-20 bg-line" />
                  <Skeleton className="h-2.5 w-10 bg-line" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
            <p className="font-bold">Could not load departments.</p>
            <p className="mt-1 text-xs">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDepartments}
              className="mt-3 h-11 min-h-[44px] border-danger/40 text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-danger"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-white/70 p-6 text-center">
            <p className="text-[0.875rem] font-bold text-ink">No specialties match your search</p>
            <p className="mt-1 text-[0.78125rem] text-ink-muted">Try a different keyword or browse all departments.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuery('')}
              className="mt-3 h-11 min-h-[44px] border-line text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.slice(0, 6).map((department) => (
              <button
                key={department.id}
                onClick={() =>
                  navigate(`/app/doctors?departmentId=${department.id}&name=${encodeURIComponent(department.name)}`)
                }
                aria-label={`Department: ${department.name}`}
                className="flex min-h-[80px] flex-col items-center gap-2 surface px-2 py-4 text-center shadow-sm transition hover:border-brand-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.97]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Building2 size={20} />
                </span>
                <span className="text-[0.75rem] font-bold leading-tight text-ink">{department.name}</span>
                <span className="text-xs font-medium text-ink-muted">{department.code}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[0.71875rem] text-ink-muted">
          <Badge variant="secondary" className="border-success/30 bg-success-soft text-success">
            Live directory
          </Badge>
          <span>·</span>
          <span>Patient Home</span>
        </div>
      </div>
    </main>
  );
}
