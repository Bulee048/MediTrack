import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Baby,
  Bone,
  Brain,
  BrainCircuit,
  ChevronLeft,
  Droplet,
  Ear,
  Eye,
  Hand,
  HeartPulse,
  RotateCcw,
  Search,
  Smile,
  Stethoscope,
  X,
} from 'lucide-react';
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

    return data.filter((department) =>
      [department.name, department.code, department.description ?? ''].join(' ').toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <main data-feature-accessibility className="patient-page page-enter">
      <div className="mx-auto w-full max-w-3xl space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Browse</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Departments</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <Search size={18} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments…"
            aria-label="Search departments"
            className="h-12 min-h-[44px] border-line bg-white pl-10 pr-10 text-ink placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-r-md"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div role="status" aria-label="Loading departments" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        ) : isError ? (
          <div role="alert" className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
            <p className="font-bold">Could not load departments.</p>
            <p className="mt-1 text-xs">{error?.message || 'Network error occurred'}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-11 min-h-[44px] border-danger/40 text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-danger font-semibold"
              onClick={() => refetch()}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line bg-white/70 p-6 text-center">
            <p className="text-[0.875rem] font-bold text-ink">No departments found</p>
            <p className="mt-1 text-[0.78125rem] text-ink-muted">
              {query ? `No department matches “${query}”.` : 'Try a different department name or code.'}
            </p>
            {query ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuery('')}
                className="mt-3 h-11 min-h-[44px] border-line text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Clear Search
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((department) => {
              const Icon = ICONS[department.icon ?? ''] ?? Stethoscope;

              return (
                <button
                  key={department.id}
                  onClick={() =>
                    navigate(
                      `/app/doctors?departmentId=${department.id}&name=${encodeURIComponent(department.name)}`
                    )
                  }
                  aria-label={`Department: ${department.name}, ${department.doctorCount ? `${department.doctorCount} Doctors` : department.code}`}
                  className="flex min-h-[88px] flex-col items-center justify-center gap-2 surface px-2 py-4 text-center shadow-sm transition hover:border-brand-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.97]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={20} />
                  </span>
                  <span className="text-[0.75rem] font-bold leading-tight text-ink">{department.name}</span>
                  <span className="text-xs font-medium text-ink-muted">
                    {department.doctorCount ? `${department.doctorCount} Doctors` : department.code}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}