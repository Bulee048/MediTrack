import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarPlus, Clock3, LayoutGrid, Search, User2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDepartments } from '@/features/doctors/departments.service';
import type { DoctorDepartment } from '@/features/doctors/types';

const QUICK_ACTIONS = [
  { label: 'Book OPD', icon: CalendarPlus, to: '/departments', tone: 'bg-brand-50 text-brand-600' },
  { label: 'My Queue', icon: Clock3, to: '/queue', tone: 'bg-danger-soft text-danger' },
  { label: 'Departments', icon: LayoutGrid, to: '/departments', tone: 'bg-info-soft text-info' },
  { label: 'My Profile', icon: User2, to: '/profile', tone: 'bg-violet-soft text-violet' },
];

const DEFAULT_DEPARTMENTS: DoctorDepartment[] = [];

export default function HomeScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [departments, setDepartments] = useState<DoctorDepartment[]>(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDepartments()
      .then((items) => {
        if (!active) return;
        setDepartments(items);
        setError('');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setDepartments([]);
        setError(err instanceof Error ? err.message : 'Unable to load departments');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((department) => [department.name, department.code, department.description ?? ''].join(' ').toLowerCase().includes(q));
  }, [departments, query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-ink-muted">Good Morning,</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-ink">Welcome Back</h1>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft"
          >
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
          </button>
        </div>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <Search size={17} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, doctors, hospitals…"
            className="h-12 pl-10"
          />
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider">Find care faster</span>
            <span className="text-[11.5px] font-semibold text-white/80">Browse specialties</span>
          </div>
          <p className="mt-3 text-[17px] font-extrabold">Choose a department, then pick the doctor and time that suits you.</p>
          <p className="mt-1 text-[12.5px] text-white/80">Use the departments grid to start a booking flow.</p>
          <Button size="sm" className="mt-4 bg-white text-blue-700 hover:bg-blue-50" onClick={() => navigate('/departments')}>
            View Departments
          </Button>
        </div>

        <h2 className="mt-7 text-[16px] font-extrabold tracking-tight text-ink">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition hover:border-brand-200 active:scale-[0.98]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${action.tone}`}>
                <action.icon size={19} />
              </span>
              <span className="text-[13.5px] font-bold text-ink">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold tracking-tight text-ink">Nearby Specialties</h2>
          <button onClick={() => navigate('/departments')} className="text-[12.5px] font-bold text-brand-600">
            View All
          </button>
        </div>

        {loading ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-line bg-white px-2 py-4 shadow-card">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">Could not load departments.</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-white/70 p-5 text-center">
            <p className="text-[13.5px] font-bold text-ink">No specialties match your search</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">Try a different keyword or open the full departments view.</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.slice(0, 6).map((department) => (
              <button
                key={department.id}
                onClick={() => navigate(`/doctors?departmentId=${department.id}&name=${encodeURIComponent(department.name)}`)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white px-2 py-4 text-center shadow-card transition hover:border-brand-200 active:scale-[0.97]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Building2 size={20} />
                </span>
                <span className="text-[12px] font-bold leading-tight text-ink">{department.name}</span>
                <span className="text-[10.5px] font-medium text-ink-muted">{department.code}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-ink-faint">
          <Badge variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Live updates on
          </Badge>
          <span>·</span>
          <span>Patient Home</span>
        </div>
      </div>
    </main>
  );
}