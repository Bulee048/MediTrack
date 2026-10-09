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
  { label: 'Book OPD', icon: CalendarPlus, to: '/patient/departments', tone: 'bg-[#ECFDF9] text-[#0E8B7C]' },
  { label: 'My Queue', icon: Clock3, to: '/patient/home', tone: 'bg-[#FDECEF] text-[#E8455F]' },
  { label: 'Departments', icon: LayoutGrid, to: '/patient/departments', tone: 'bg-[#EBF2FE] text-[#3B82F6]' },
  { label: 'My Profile', icon: User2, to: '/patient/home', tone: 'bg-[#F3EEFE] text-[#8B5CF6]' },
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
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#6C7A90]">Good Morning,</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-[#101A2E]">Welcome Back</h1>
          </div>
          <button
            onClick={() => navigate('/patient/home')}
            aria-label="View notifications"
            className="relative grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#101A2E] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#E8455F]" />
          </button>
        </div>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
            <Search size={18} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, doctors, specialties…"
            aria-label="Search departments, doctors, specialties"
            className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 pr-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6C7A90] hover:text-[#101A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-r-md"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#0E8B7C] to-[#0C6F64] p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#D2F5EE]">Find care faster</span>
            <span className="text-[11.5px] font-semibold text-white/80">Browse specialties</span>
          </div>
          <p className="mt-3 text-[17px] font-extrabold leading-snug">
            Choose a department, then pick the doctor and time that suits you.
          </p>
          <p className="mt-1 text-[12.5px] text-white/80">Use the departments directory to start booking an OPD visit.</p>
          <Button
            size="sm"
            className="mt-4 h-11 min-h-[44px] bg-white font-bold text-[#0E8B7C] hover:bg-[#ECFDF9] focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => navigate('/patient/departments')}
          >
            View Departments
          </Button>
        </div>

        <h2 className="mt-7 text-[16px] font-extrabold tracking-tight text-[#101A2E]">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex min-h-[72px] flex-col items-start gap-3 rounded-2xl border border-[#E6ECF3] bg-white p-4 text-left shadow-sm transition hover:border-[#A7EADD] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-[0.98]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${action.tone}`}>
                <action.icon size={19} />
              </span>
              <span className="text-[13.5px] font-bold text-[#101A2E]">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold tracking-tight text-[#101A2E]">Nearby Specialties</h2>
          <button
            onClick={() => navigate('/patient/departments')}
            className="inline-flex min-h-[44px] items-center px-2 text-[12.5px] font-bold text-[#0E8B7C] hover:text-[#0C6F64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-lg"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading specialties" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[#E6ECF3] bg-white px-2 py-4 shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-11 w-11 rounded-xl bg-[#E6ECF3]" />
                  <Skeleton className="h-3.5 w-20 bg-[#E6ECF3]" />
                  <Skeleton className="h-2.5 w-10 bg-[#E6ECF3]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-3 rounded-2xl border border-[#E8455F]/30 bg-[#FDECEF] p-4 text-sm text-[#E8455F]">
            <p className="font-bold">Could not load departments.</p>
            <p className="mt-1 text-xs">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDepartments}
              className="mt-3 h-11 min-h-[44px] border-[#E8455F]/40 text-[#E8455F] hover:bg-[#FDECEF] focus-visible:ring-2 focus-visible:ring-[#E8455F]"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#E6ECF3] bg-white/70 p-6 text-center">
            <p className="text-[14px] font-bold text-[#101A2E]">No specialties match your search</p>
            <p className="mt-1 text-[12.5px] text-[#6C7A90]">Try a different keyword or browse all departments.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuery('')}
              className="mt-3 h-11 min-h-[44px] border-[#E6ECF3] text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794]"
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
                className="flex min-h-[80px] flex-col items-center gap-2 rounded-2xl border border-[#E6ECF3] bg-white px-2 py-4 text-center shadow-sm transition hover:border-[#A7EADD] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-[0.97]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ECFDF9] text-[#0E8B7C]">
                  <Building2 size={20} />
                </span>
                <span className="text-[12px] font-bold leading-tight text-[#101A2E]">{department.name}</span>
                <span className="text-[10.5px] font-medium text-[#6C7A90]">{department.code}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-[#6C7A90]">
          <Badge variant="secondary" className="border-[#2FBF71]/30 bg-[#E8F9F0] text-[#2FBF71]">
            Live updates on
          </Badge>
          <span>·</span>
          <span>Patient Home</span>
        </div>
      </div>
    </main>
  );
}