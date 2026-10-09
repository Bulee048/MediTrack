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
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LIMITED: 'bg-amber-50 text-amber-700 border-amber-200',
  UNAVAILABLE: 'bg-slate-100 text-slate-600 border-slate-200',
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
      const filteredDoctors = response.doctors.filter((doctor) => !minRating || doctor.rating >= minRating);
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-500">Browse</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">{departmentName}</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctor…"
              aria-label="Search doctor by name or specialty"
              className="h-12 min-h-[44px] pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-blue-600"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Clear doctor search"
                className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-r-md"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {minRating !== null ? (
            <button
              onClick={() => setMinRating(null)}
              aria-label={`Clear rating filter ${minRating} stars`}
              className="flex h-12 min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-[12.5px] font-bold text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Star size={13} className="fill-blue-600 text-blue-600" /> {minRating}+ <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" role="toolbar" aria-label="Doctor filters">
          {[4.5, 4.7, 4.9].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(minRating === rating ? null : rating)}
              aria-pressed={minRating === rating}
              className={`min-h-[44px] shrink-0 rounded-full border px-3.5 py-2.5 text-[12.5px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                minRating === rating
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Star size={12} className={minRating === rating ? 'fill-white text-white' : 'text-amber-500 fill-amber-500'} /> {rating}+
              </span>
            </button>
          ))}

          <button
            onClick={() => setAvailableOnly((value) => !value)}
            aria-pressed={availableOnly}
            className={`min-h-[44px] shrink-0 rounded-full border px-3.5 py-2.5 text-[12.5px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              availableOnly
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
            }`}
          >
            {availableOnly ? 'Available only' : 'Any status'}
          </button>

          {(q || minRating !== null || availableOnly) ? (
            <button
              onClick={resetFilters}
              aria-label="Reset all filters"
              className="min-h-[44px] shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-slate-700 hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl bg-blue-700 p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-200">Doctors</p>
              <p className="mt-1 text-[15px] font-extrabold">Find the right specialist for your visit</p>
            </div>
            <Stethoscope size={20} className="opacity-90" />
          </div>
          <p className="mt-2 text-[12.5px] text-white/80">
            {departmentId ? 'Filtered by the selected department.' : 'Browse all specialists and refine by rating or availability.'}
          </p>
        </div>

        {usingTemporaryData ? (
          <div role="note" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            [Temporary demo data] Live doctor data is temporarily unavailable. Showing demo doctors instead.
          </div>
        ) : null}

        {result.fallbackReason ? (
          <div role="note" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            {result.fallbackReason}
          </div>
        ) : null}

        {loading ? (
          <div role="status" aria-label="Loading doctors" className="mt-5 space-y-3.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3.5 w-56" />
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </div>
                <div className="border-t border-slate-200 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-11 w-24 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-[14px] font-extrabold">Could not load doctors</p>
            <p className="mt-1 text-[12.5px] font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-11 min-h-[44px] border-red-300 text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-600 font-semibold"
              onClick={loadDoctors}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
            <p className="text-[14px] font-bold text-slate-900">No doctors match your search.</p>
            <p className="mt-1 text-[12.5px] text-slate-500">Try a different name, rating, or department filter.</p>
            <Button
              size="sm"
              className="mt-4 h-11 min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 font-bold"
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
                <div key={doctor.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  <button
                    onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                    aria-label={`View profile of ${doctor.name}, ${doctor.title || 'Specialist'}`}
                    className="w-full px-4 pt-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15.5px] font-extrabold tracking-tight text-slate-900">{doctor.name}</p>
                        <p className="mt-0.5 text-[12.5px] text-slate-500">
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
                        <p className="mt-1 text-[10.5px] font-semibold text-slate-400">{doctor.reviews} reviews</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12.5px] text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        <Building2 size={12} /> {doctor.department}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        <MapPin size={12} /> Room {doctor.room}
                      </span>
                    </div>
                  </button>

                  <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Experience</p>
                      <p className={`mt-0.5 text-[13.5px] font-extrabold ${doctor.experienceYears ? 'text-slate-900' : 'text-slate-400'}`}>
                        {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Not listed'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={status === 'UNAVAILABLE'}
                      className="h-11 min-h-[44px] shrink-0 bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600"
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