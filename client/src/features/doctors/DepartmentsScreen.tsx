import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Baby, Bone, Brain, BrainCircuit, Droplet, Ear, Eye, Hand, HeartPulse, Search, Smile, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDepartments } from './departments.service';
import type { DoctorDepartment } from './types';

const ICONS: Record<string, typeof HeartPulse> = {
  'heart-pulse': HeartPulse,
  hand: Hand,
  baby: Baby,
  eye: Eye,
  brain: Brain,
  ear: Ear,
  bone: Bone,
  smile: Smile,
  'brain-circuit': BrainCircuit,
  droplet: Droplet,
  stethoscope: Stethoscope,
};

export default function DepartmentsScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery<DoctorDepartment[], Error>({
    queryKey: ['departments', query],
    queryFn: () => fetchDepartments(query),
    staleTime: 1000 * 60,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;

    return data.filter((department) => [department.name, department.code, department.description ?? ''].join(' ').toLowerCase().includes(q));
  }, [data, query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-ink-muted">Browse</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-ink">Departments</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft"
          >
            <span className="text-lg leading-none">‹</span>
          </button>
        </div>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <Search size={17} />
          </span>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search departments…" className="h-12 pl-10" />
        </div>

        {isLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        ) : isError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">Could not load departments.</p>
            <p className="mt-1">{error.message}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line bg-white/70 p-5 text-center">
            <p className="text-[13.5px] font-bold text-ink">No departments found</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">Try a different department name or code.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((department) => {
              const Icon = ICONS[department.icon ?? ''] ?? Stethoscope;

              return (
                <button
                  key={department.id}
                  onClick={() => navigate(`/doctors?departmentId=${department.id}&name=${encodeURIComponent(department.name)}`)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white px-2 py-4 text-center shadow-card transition hover:border-brand-200 active:scale-[0.97]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={20} />
                  </span>
                  <span className="text-[12px] font-bold leading-tight text-ink">{department.name}</span>
                  <span className="text-[10.5px] font-medium text-ink-muted">
                    {department.doctorCount ? `${department.doctorCount} Doctors` : department.code}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && data && !isLoading && !isError && (
          <p className="mt-10 text-center text-[13px] text-ink-muted">No department matches “{query}”.</p>
        )}
      </div>
    </main>
  );
}