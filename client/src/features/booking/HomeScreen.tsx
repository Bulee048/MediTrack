import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarPlus, Clock3, LayoutGrid, RotateCcw, Search, User2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDepartments } from '@/features/doctors/departments.service';
import type { DoctorDepartment } from '@/features/doctors/types';

const QUICK_ACTIONS = [
  { label: 'Book OPD', icon: CalendarPlus, to: '/patient/departments', tone: 'bg-brand-50 text-brand-600' },
  { label: 'My Queue', icon: Clock3, to: '/patient/home', tone: 'bg-red-50 text-red-600' },
  { label: 'Departments', icon: LayoutGrid, to: '/patient/departments', tone: 'bg-sky-50 text-sky-600' },
  { label: 'My Profile', icon: User2, to: '/patient/home', tone: 'bg-purple-50 text-purple-600' },
];

export default function HomeScreen() {
  const navigate = useNavigate();
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-500">Good Morning,</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Welcome Back</h1>
          </div>
          <button
            onClick={() => navigate('/patient/home')}
            aria-label="View notifications"
            className="relative grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={18} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, doctors, specialties…"
            aria-label="Search departments, doctors, specialties"
            className="h-12 min-h-[44px] pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-blue-600"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-r-md"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-200">Find care faster</span>
            <span className="text-[11.5px] font-semibold text-white/80">Browse specialties</span>
          </div>
          <p className="mt-3 text-[17px] font-extrabold leading-snug">
            Choose a department, then pick the doctor and time that suits you.
          </p>
          <p className="mt-1 text-[12.5px] text-white/80">Use the departments directory to start booking an OPD visit.</p>
          <Button
            size="sm"
            className="mt-4 h-11 min-h-[44px] bg-white text-blue-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-white font-bold"
            onClick={() => navigate('/patient/departments')}
          >
            View Departments
          </Button>
        </div>

        <h2 className="mt-7 text-[16px] font-extrabold tracking-tight text-slate-900">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex min-h-[72px] flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.98]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${action.tone}`}>
                <action.icon size={19} />
              </span>
              <span className="text-[13.5px] font-bold text-slate-900">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold tracking-tight text-slate-900">Nearby Specialties</h2>
          <button
            onClick={() => navigate('/patient/departments')}
            className="inline-flex min-h-[44px] items-center px-2 text-[12.5px] font-bold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading specialties" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white px-2 py-4 shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-bold">Could not load departments.</p>
            <p className="mt-1 text-xs">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDepartments}
              className="mt-3 h-11 min-h-[44px] border-red-300 text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
            <p className="text-[14px] font-bold text-slate-900">No specialties match your search</p>
            <p className="mt-1 text-[12.5px] text-slate-500">Try a different keyword or browse all departments.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuery('')}
              className="mt-3 h-11 min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.slice(0, 6).map((department) => (
              <button
                key={department.id}
                onClick={() =>
                  navigate(`/patient/doctors?departmentId=${department.id}&name=${encodeURIComponent(department.name)}`)
                }
                aria-label={`Department: ${department.name}`}
                className="flex min-h-[80px] flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.97]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={20} />
                </span>
                <span className="text-[12px] font-bold leading-tight text-slate-900">{department.name}</span>
                <span className="text-[10.5px] font-medium text-slate-500">{department.code}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-slate-400">
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