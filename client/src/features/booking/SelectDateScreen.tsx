import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDoctorAvailability, fetchDoctorProfile } from '@/features/doctors/doctors.service';
import type { BookingDateSelection } from './types';
import type { DoctorAvailabilityView, DoctorProfileResult } from '@/features/doctors/types';

type LocationState = Partial<BookingDateSelection>;

function monthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return {
      iso: current.toISOString().split('T')[0],
      day: current.getDate(),
      inMonth: current.getMonth() === month,
      date: current,
    };
  });
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function todayIso() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export default function SelectDateScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityView | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(state.date ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([fetchDoctorProfile(id), fetchDoctorAvailability(id, todayIso())])
      .then(([profile, availabilityView]) => {
        if (!active) return;
        setDoctorResult(profile);
        setAvailability(availabilityView);
        if (!profile.doctor && !state.doctor) {
          setError('Doctor not found');
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load dates');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  };

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doctor = doctorResult?.doctor ?? state.doctor ?? null;

  const monthDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const grid = useMemo(() => monthGrid(monthDate), [monthDate]);
  const availabilityByDate = useMemo(
    () => new Map(availability?.days.map((day) => [day.date, day]) ?? []),
    [availability]
  );

  const confirm = () => {
    if (!doctor || !selectedDate) return;
    navigate(`/patient/doctors/${doctor.id}/time`, {
      state: { doctor, date: selectedDate },
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div role="status" aria-label="Loading calendar dates" className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-[15px] font-extrabold">Doctor unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">{error || 'We could not load the selected doctor.'}</p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="h-11 min-h-[44px] flex-1 border-red-300 text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-600 font-semibold"
                onClick={() => navigate('/patient/doctors')}
              >
                All Doctors
              </Button>
              <Button
                className="h-11 min-h-[44px] flex-1 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 font-semibold"
                onClick={loadData}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-500">Booking</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Select Date</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-[15px] font-extrabold text-slate-900">{doctor.name}</p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            {doctor.title || 'Specialist'} · {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Experience not listed'}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-700">
            <Star size={13} className="fill-amber-500 text-amber-500" /> {doctor.availabilityStatus ?? 'AVAILABLE'}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-extrabold text-slate-900">
              {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMonthOffset((value) => value - 1)}
                disabled={monthOffset === 0}
                aria-label="Previous month"
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setMonthOffset((value) => Math.min(2, value + 1))}
                disabled={monthOffset >= 2}
                aria-label="Next month"
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Month calendar">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <span key={day} className="pb-1 text-[11.5px] font-bold text-slate-400">
                {day}
              </span>
            ))}

            {grid.map((cell) => {
              const past = cell.iso < todayIso();
              const dayAvailability = availabilityByDate.get(cell.iso);
              const available = !past && cell.inMonth && Boolean(dayAvailability?.available);
              const isSelected = selectedDate === cell.iso;

              return (
                <button
                  key={cell.iso}
                  disabled={!available}
                  onClick={() => setSelectedDate(cell.iso)}
                  aria-pressed={isSelected}
                  aria-label={`${cell.day} ${formatLongDate(cell.iso)}, ${available ? 'Available' : 'Unavailable'}`}
                  className={`relative mx-auto grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-full text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : available
                        ? 'text-slate-900 hover:bg-blue-50 font-semibold'
                        : 'cursor-not-allowed text-slate-300'
                  }`}
                >
                  {cell.day}
                  {available && !isSelected ? (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> Unavailable
            </span>
          </div>
        </div>

        {selectedDate ? (
          <p className="mt-4 text-center text-[13.5px] font-bold text-blue-700">{formatLongDate(selectedDate)}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 font-bold"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600"
            disabled={!selectedDate}
            onClick={confirm}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}