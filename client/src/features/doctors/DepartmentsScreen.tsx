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
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#6C7A90]">Browse</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-[#101A2E]">Departments</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#101A2E] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
            <Search size={18} />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments…"
            aria-label="Search departments"
            className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 pr-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6C7A90] hover:text-[#101A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-r-md"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div role="status" aria-label="Loading departments" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        ) : isError ? (
          <div role="alert" className="mt-5 rounded-2xl border border-[#E8455F]/30 bg-[#FDECEF] p-4 text-sm text-[#E8455F]">
            <p className="font-bold">Could not load departments.</p>
            <p className="mt-1 text-xs">{error?.message || 'Network error occurred'}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-11 min-h-[44px] border-[#E8455F]/40 text-[#E8455F] hover:bg-[#FDECEF] focus-visible:ring-2 focus-visible:ring-[#E8455F] font-semibold"
              onClick={() => refetch()}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#E6ECF3] bg-white/70 p-6 text-center">
            <p className="text-[14px] font-bold text-[#101A2E]">No departments found</p>
            <p className="mt-1 text-[12.5px] text-[#6C7A90]">
              {query ? `No department matches “${query}”.` : 'Try a different department name or code.'}
            </p>
            {query ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuery('')}
                className="mt-3 h-11 min-h-[44px] border-[#E6ECF3] text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794]"
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
                      `/patient/doctors?departmentId=${department.id}&name=${encodeURIComponent(department.name)}`
                    )
                  }
                  aria-label={`Department: ${department.name}, ${department.doctorCount ? `${department.doctorCount} Doctors` : department.code}`}
                  className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#E6ECF3] bg-white px-2 py-4 text-center shadow-sm transition hover:border-[#A7EADD] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-[0.97]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ECFDF9] text-[#0E8B7C]">
                    <Icon size={20} />
                  </span>
                  <span className="text-[12px] font-bold leading-tight text-[#101A2E]">{department.name}</span>
                  <span className="text-[10.5px] font-medium text-[#6C7A90]">
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