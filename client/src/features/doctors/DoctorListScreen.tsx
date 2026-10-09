import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Star, X, ChevronLeft, Building2, MapPin, Stethoscope, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDoctors } from './doctors.service';
import type { DoctorListFilters, DoctorSummary, DoctorsResult } from './types';

type LoadState = {
  doctors: DoctorSummary[];
  source: DoctorsResult['source'] | null;
  fallbackReason?: string;
};

const AVAILABILITY_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-[#E8F9F0] text-[#2FBF71] border-[#2FBF71]/30',
  LIMITED: 'bg-[#FFF6E6] text-[#F5A623] border-[#F5A623]/30',
  UNAVAILABLE: 'bg-[#F4F7FA] text-[#6C7A90] border-[#E6ECF3]',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  LIMITED: 'Limited',
  UNAVAILABLE: 'Unavailable',
};

export default function DoctorListScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const departmentId = params.get('departmentId') ?? undefined;
  const departmentName = params.get('name') ?? 'All Specialists';

  const [q, setQ] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LoadState>({ doctors: [], source: null });

  const filters = useMemo<DoctorListFilters>(
    () => ({
      departmentId,
      q,
      available: availableOnly || undefined,
      minRating: minRating ?? undefined,
    }),
    [availableOnly, departmentId, minRating, q],
  );

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchDoctors(filters);
      const filteredDoctors = response.doctors.filter((doctor) => !minRating || (doctor.rating !== null && doctor.rating >= minRating));
      setResult({
        doctors: filteredDoctors,
        source: response.source,
        fallbackReason: response.fallbackReason,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load doctors');
      setResult({ doctors: [], source: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, availableOnly, minRating, q]);

  const doctors = result.doctors;
  const usingTemporaryData = result.source === 'mock';

  const resetFilters = () => {
    setQ('');
    setMinRating(null);
    setAvailableOnly(false);
  };

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#6C7A90]">Browse</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-[#101A2E]">{departmentName}</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#101A2E] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
              <Search size={18} />
            </span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctor…"
              aria-label="Search doctor by name or specialty"
              className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 pr-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Clear doctor search"
                className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6C7A90] hover:text-[#101A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-r-md"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {minRating !== null ? (
            <button
              onClick={() => setMinRating(null)}
              aria-label={`Clear rating filter ${minRating} stars`}
              className="flex h-12 min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-[#0E8B7C] bg-[#ECFDF9] px-3.5 text-[12.5px] font-bold text-[#0C6F64] hover:bg-[#D2F5EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794]"
            >
              <Star size={13} className="fill-[#F5A623] text-[#F5A623]" /> {minRating}+ <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" role="toolbar" aria-label="Doctor filters">
          {[4.5, 4.7, 4.9].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(minRating === rating ? null : rating)}
              aria-pressed={minRating === rating}
              className={`min-h-[44px] shrink-0 rounded-full border px-3.5 py-2.5 text-[12.5px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] ${
                minRating === rating
                  ? 'border-[#0E8B7C] bg-[#0E8B7C] text-white'
                  : 'border-[#E6ECF3] bg-white text-[#3A465C] hover:border-[#A7EADD]'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Star size={12} className={minRating === rating ? 'fill-white text-white' : 'text-[#F5A623] fill-[#F5A623]'} /> {rating}+
              </span>
            </button>
          ))}

          <button
            onClick={() => setAvailableOnly((value) => !value)}
            aria-pressed={availableOnly}
            className={`min-h-[44px] shrink-0 rounded-full border px-3.5 py-2.5 text-[12.5px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] ${
              availableOnly
                ? 'border-[#0E8B7C] bg-[#0E8B7C] text-white'
                : 'border-[#E6ECF3] bg-white text-[#3A465C] hover:border-[#A7EADD]'
            }`}
          >
            {availableOnly ? 'Available only' : 'Any status'}
          </button>

          {(q || minRating !== null || availableOnly) ? (
            <button
              onClick={resetFilters}
              aria-label="Reset all filters"
              className="min-h-[44px] shrink-0 rounded-full border border-[#E6ECF3] bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-[#3A465C] hover:border-[#A7EADD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-[#0E8B7C] p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#D2F5EE]">Doctors</p>
              <p className="mt-1 text-[15px] font-extrabold">Find the right specialist for your visit</p>
            </div>
            <Stethoscope size={20} className="opacity-90" />
          </div>
          <p className="mt-2 text-[12.5px] text-white/80">
            {departmentId ? 'Filtered by the selected department.' : 'Browse all specialists and refine by rating or availability.'}
          </p>
        </div>

        {usingTemporaryData ? (
          <div role="note" className="mt-3 rounded-2xl border border-[#F5A623]/30 bg-[#FFF6E6] px-4 py-3 text-[12.5px] font-semibold text-[#F5A623]">
            [Temporary demo data] Live doctor data is temporarily unavailable. Showing demo doctors instead.
          </div>
        ) : null}

        {result.fallbackReason ? (
          <div role="note" className="mt-3 rounded-2xl border border-[#F5A623]/30 bg-[#FFF6E6] px-4 py-3 text-[12.5px] font-semibold text-[#F5A623]">
            {result.fallbackReason}
          </div>
        ) : null}

        {loading ? (
          <div role="status" aria-label="Loading doctors" className="mt-5 space-y-3.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[#E6ECF3] bg-white shadow-sm">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 bg-[#E6ECF3]" />
                      <Skeleton className="h-3.5 w-56 bg-[#E6ECF3]" />
                      <Skeleton className="h-3.5 w-28 bg-[#E6ECF3]" />
                    </div>
                    <Skeleton className="h-6 w-14 rounded-full bg-[#E6ECF3]" />
                  </div>
                </div>
                <div className="border-t border-[#E6ECF3] px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-20 bg-[#E6ECF3]" />
                      <Skeleton className="h-4 w-32 bg-[#E6ECF3]" />
                    </div>
                    <Skeleton className="h-11 w-24 rounded-xl bg-[#E6ECF3]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-5 rounded-2xl border border-[#E8455F]/30 bg-[#FDECEF] p-5 text-[#E8455F]">
            <p className="text-[14px] font-extrabold">Could not load doctors</p>
            <p className="mt-1 text-[12.5px] font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-11 min-h-[44px] border-[#E8455F]/40 text-[#E8455F] hover:bg-[#FDECEF] focus-visible:ring-2 focus-visible:ring-[#E8455F] font-semibold"
              onClick={loadDoctors}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#E6ECF3] bg-white/70 p-6 text-center">
            <p className="text-[14px] font-bold text-[#101A2E]">No doctors match your search.</p>
            <p className="mt-1 text-[12.5px] text-[#6C7A90]">Try a different name, rating, or department filter.</p>
            <Button
              size="sm"
              className="mt-4 h-11 min-h-[44px] bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-3.5">
            {doctors.map((doctor) => {
              const status = doctor.availabilityStatus ?? (doctor.nextSlot ? 'AVAILABLE' : 'UNAVAILABLE');

              return (
                <div key={doctor.id} className="overflow-hidden rounded-2xl border border-[#E6ECF3] bg-white shadow-sm transition hover:shadow-md">
                  <button
                    onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                    aria-label={`View profile of ${doctor.name}, ${doctor.title || 'Specialist'}`}
                    className="w-full px-4 pt-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-t-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15.5px] font-extrabold tracking-tight text-[#101A2E]">{doctor.name}</p>
                        <p className="mt-0.5 text-[12.5px] text-[#6C7A90]">
                          {doctor.title || 'Specialist'} · {doctor.department}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold ${
                            AVAILABILITY_STYLES[status]
                          }`}
                        >
                          <Star size={12} className="fill-current" />
                          {AVAILABILITY_LABELS[status] ?? status}
                        </span>
                        <p className="mt-1 text-[10.5px] font-semibold text-[#6C7A90]">{doctor.reviews ?? 'Not listed'} reviews</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12.5px] text-[#3A465C]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F7FA] px-2.5 py-1 font-semibold text-[#3A465C]">
                        <Building2 size={12} /> {doctor.department}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F7FA] px-2.5 py-1 font-semibold text-[#3A465C]">
                        <MapPin size={12} /> Room {doctor.room}
                      </span>
                    </div>
                  </button>

                  <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#E6ECF3] px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#6C7A90]">Experience</p>
                      <p className={`mt-0.5 text-[13.5px] font-extrabold ${doctor.experienceYears ? 'text-[#101A2E]' : 'text-[#6C7A90]'}`}>
                        {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Not listed'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={status === 'UNAVAILABLE'}
                      className="h-11 min-h-[44px] shrink-0 bg-[#0E8B7C] px-6 font-bold text-white hover:bg-[#0C6F64] disabled:bg-[#E6ECF3] disabled:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                      onClick={() => navigate(`/patient/doctors/${doctor.id}/date`)}
                    >
                      Book OPD
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}