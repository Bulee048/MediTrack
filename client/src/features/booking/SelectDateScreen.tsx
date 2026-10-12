import { BookingSteps } from '@/components/ui/booking-steps';
import { hospitalDate } from '@/lib/hospitalDate';
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
      iso: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`,
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
  return hospitalDate();
}

export default function SelectDateScreen() {
  const params = useParams();
  const id = params.doctorId ?? params.id ?? '';
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
    if (!doctor || !selectedDate || !availabilityByDate.get(selectedDate)?.available) return;
    navigate(`/app/book/time/${doctor.id}`, {
      state: { doctor, date: selectedDate },
    });
  };

  if (loading) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div role="status" aria-label="Loading calendar dates" className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl bg-line" />
          <Skeleton className="h-24 rounded-2xl bg-line" />
          <Skeleton className="h-72 rounded-2xl bg-line" />
          <Skeleton className="h-16 rounded-2xl bg-line" />
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div className="mx-auto w-full max-w-3xl">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger">
            <p className="text-[0.9375rem] font-extrabold">Doctor unavailable</p>
            <p className="mt-1 text-[0.78125rem] font-medium">{error || 'We could not load the selected doctor.'}</p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="h-11 min-h-[44px] flex-1 border-danger/40 text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-danger font-semibold"
                onClick={() => navigate('/app/doctors')}
              >
                All Doctors
              </Button>
              <Button
                className="h-11 min-h-[44px] flex-1 bg-danger text-white hover:bg-danger-600 focus-visible:ring-2 focus-visible:ring-danger font-semibold"
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
    <main data-feature-accessibility className="patient-page page-enter">
      <div className="mx-auto w-full max-w-3xl space-y-0">
          <BookingSteps step={1}/>
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Booking</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Select Date</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="surface p-4 text-center shadow-sm">
          <p className="text-[0.9375rem] font-extrabold text-ink">{doctor.name}</p>
          <p className="mt-0.5 text-[0.78125rem] text-ink-muted">
            {doctor.title || 'Specialist'} · {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Experience not listed'}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[0.78125rem] font-bold text-ink">
            <Star size={13} className="fill-[#F5A623] text-warn" /> {doctor.availabilityStatus ?? 'AVAILABLE'}
          </p>
        </div>

        <div className="mt-4 surface p-4 shadow-sm">
          <label className="calendar-compact-only text-sm font-semibold text-ink">Available appointment date<select className="field" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}><option value="">Choose a date</option>{(availability?.days??[]).filter(day=>day.available&&day.date>=todayIso()).map(day=><option key={day.date} value={day.date}>{formatLongDate(day.date)}</option>)}</select></label>
          <div className="calendar-wide-only flex items-center justify-between">
            <p className="text-[0.9375rem] font-extrabold text-ink">
              {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMonthOffset((value) => value - 1)}
                disabled={monthOffset === 0}
                aria-label="Previous month"
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-canvas disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setMonthOffset((value) => Math.min(2, value + 1))}
                disabled={monthOffset >= 2}
                aria-label="Next month"
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-canvas disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {!availability?.days.some(day => day.available) && <p role="status" className="mt-4 text-sm">No dates have available capacity. Choose another doctor or try again later.</p>}
          <div className="calendar-wide-only mt-4 grid grid-cols-7 gap-1 text-center" role="group" aria-label="Month calendar">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <span key={day} className="pb-1 text-[0.71875rem] font-bold text-ink-muted">
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
                  className={`relative mx-auto grid h-11 w-full min-w-0 place-items-center rounded-full text-[0.8125rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm font-bold'
                      : available
                        ? 'text-ink hover:bg-brand-50 font-semibold'
                        : 'cursor-not-allowed text-ink-muted/40'
                  }`}
                >
                  {cell.day}
                  {available && !isSelected ? (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="calendar-wide-only mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-xs font-semibold text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink/70" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink/15" /> Unavailable
            </span>
          </div>
        </div>

        {selectedDate ? (
          <p className="mt-4 text-center text-[0.84375rem] font-bold text-brand-700">{formatLongDate(selectedDate)}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-line bg-white text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500 font-bold"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:bg-line disabled:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
            disabled={!selectedDate || !availabilityByDate.get(selectedDate)?.available}
            onClick={confirm}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}
