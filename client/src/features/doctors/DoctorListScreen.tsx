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
  AVAILABLE: 'bg-success-soft text-success border-success/30',
  LIMITED: 'bg-warn-soft text-warn border-warn/30',
  UNAVAILABLE: 'bg-canvas text-ink-muted border-line',
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
      const filteredDoctors = response.doctors.filter((doctor) => !minRating || (doctor.rating !== undefined && doctor.rating >= minRating));
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

  const resetFilters = () => {
    setQ('');
    setMinRating(null);
    setAvailableOnly(false);
  };

  return (
    <main data-feature-accessibility className="patient-page page-enter">
      <div className="mx-auto w-full max-w-3xl space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Browse</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">{departmentName}</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
              <Search size={18} />
            </span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctor…"
              aria-label="Search doctor by name or specialty"
              className="h-12 min-h-[44px] border-line bg-white pl-10 pr-10 text-ink placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Clear doctor search"
                className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-r-md"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {minRating !== null ? (
            <button
              onClick={() => setMinRating(null)}
              aria-label={`Clear rating filter ${minRating} stars`}
              className="flex h-12 min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-brand-600 bg-brand-50 px-3.5 text-[0.78125rem] font-bold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Star size={13} className="fill-[#F5A623] text-warn" /> {minRating}+ <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Doctor filters">
          <button
            onClick={() => setAvailableOnly((value) => !value)}
            aria-pressed={availableOnly}
            className={`min-h-[44px] shrink-0 rounded-full border px-3.5 py-2.5 text-[0.78125rem] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              availableOnly
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-white text-ink-soft hover:border-brand-200'
            }`}
          >
            {availableOnly ? 'Available only' : 'Any status'}
          </button>

          {(q || minRating !== null || availableOnly) ? (
            <button
              onClick={resetFilters}
              aria-label="Reset all filters"
              className="min-h-[44px] shrink-0 rounded-full border border-line bg-white px-3.5 py-2.5 text-[0.78125rem] font-bold text-ink-soft hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-brand-600 p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-brand-100">Doctors</p>
              <p className="mt-1 text-[0.9375rem] font-extrabold">Find the right specialist for your visit</p>
            </div>
            <Stethoscope size={20} className="opacity-90" />
          </div>
          <p className="mt-2 text-[0.78125rem] text-white/80">
            {departmentId ? 'Filtered by the selected department.' : 'Browse all specialists and refine by availability.'}
          </p>
        </div>

        {result.fallbackReason ? (
          <div role="note" className="mt-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-[0.78125rem] font-semibold text-warn">
            {result.fallbackReason}
          </div>
        ) : null}

        {loading ? (
          <div role="status" aria-label="Loading doctors" className="mt-5 space-y-3.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="surface shadow-sm">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 bg-line" />
                      <Skeleton className="h-3.5 w-56 bg-line" />
                      <Skeleton className="h-3.5 w-28 bg-line" />
                    </div>
                    <Skeleton className="h-6 w-14 rounded-full bg-line" />
                  </div>
                </div>
                <div className="border-t border-line px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-20 bg-line" />
                      <Skeleton className="h-4 w-32 bg-line" />
                    </div>
                    <Skeleton className="h-11 w-24 rounded-xl bg-line" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger">
            <p className="text-[0.875rem] font-extrabold">Could not load doctors</p>
            <p className="mt-1 text-[0.78125rem] font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-11 min-h-[44px] border-danger/40 text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-danger font-semibold"
              onClick={loadDoctors}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line bg-white/70 p-6 text-center">
            <p className="text-[0.875rem] font-bold text-ink">No doctors match your search.</p>
            <p className="mt-1 text-[0.78125rem] text-ink-muted">Try a different name or department filter.</p>
            <Button
              size="sm"
              className="mt-4 h-11 min-h-[44px] bg-brand-600 font-bold text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                <div key={doctor.id} className="overflow-hidden surface shadow-sm transition hover:shadow-md">
                  <button
                    onClick={() => navigate(`/app/doctor/${doctor.id}`)}
                    aria-label={`View profile of ${doctor.name}, ${doctor.title || 'Specialist'}`}
                    className="w-full px-4 pt-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-t-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.96875rem] font-extrabold tracking-tight text-ink">{doctor.name}</p>
                        <p className="mt-0.5 text-[0.78125rem] text-ink-muted">
                          {doctor.title || 'Specialist'} · {doctor.department}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.75rem] font-bold ${
                            AVAILABILITY_STYLES[status]
                          }`}
                        >
                          <Star size={12} className="fill-current" />
                          {AVAILABILITY_LABELS[status] ?? status}
                        </span>
                        {doctor.reviews!==undefined&&<p className="mt-1 text-xs font-semibold text-ink-muted">{doctor.reviews} reviews</p>}
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.78125rem] text-ink-soft">
                      <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 font-semibold text-ink-soft">
                        <Building2 size={12} /> {doctor.department}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 font-semibold text-ink-soft">
                        <MapPin size={12} /> Room {doctor.room}
                      </span>
                    </div>
                  </button>

                  <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Experience</p>
                      <p className={`mt-0.5 text-[0.84375rem] font-extrabold ${doctor.experienceYears ? 'text-ink' : 'text-ink-muted'}`}>
                        {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Not listed'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={status === 'UNAVAILABLE'}
                      className="h-11 min-h-[44px] shrink-0 bg-brand-600 px-6 font-bold text-white hover:bg-brand-700 disabled:bg-line disabled:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
                      onClick={() => navigate(`/app/book/date/${doctor.id}`)}
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