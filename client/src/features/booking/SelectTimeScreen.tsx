import { BookingSteps } from '@/components/ui/booking-steps';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDoctorAvailability, fetchDoctorProfile } from '@/features/doctors/doctors.service';
import type { BookingDateSelection, BookingTimeSelection } from './types';
import type { DoctorAvailabilityView, DoctorProfileResult } from '@/features/doctors/types';

type LocationState = Partial<BookingTimeSelection> | Partial<BookingDateSelection>;

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function slotPeriod(startTime: string) {
  const hour = Number(startTime.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default function SelectTimeScreen() {
  const params = useParams();
  const id = params.doctorId ?? params.id ?? '';
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState('slotId' in state ? state.slotId ?? '' : '');
  const [error, setError] = useState('');

  const doctor = doctorResult?.doctor ?? state.doctor ?? null;
  const selectedDate = state.date ?? '';

  const loadData = () => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      fetchDoctorProfile(id),
      fetchDoctorAvailability(id, selectedDate || new Date().toISOString().split('T')[0]),
    ])
      .then(([profile, availabilityView]) => {
        if (!active) return;
        setDoctorResult(profile);
        setAvailability(availabilityView);
        if (!profile.doctor && !state.doctor) {
          setError('Doctor not found');
        }
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load availability');
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
  }, [id, selectedDate]);

  const topDay = useMemo(
    () =>
      availability?.days.find((day) => day.date === selectedDate) ??
      null,
    [availability, selectedDate]
  );

  const groupedSlots = useMemo(() => {
    if (!topDay) return [];

    const periods = ['Morning', 'Afternoon', 'Evening'] as const;
    return periods
      .map((period) => ({
        period,
        slots: topDay.slots.filter((slot) => slotPeriod(slot.startTime) === period),
      }))
      .filter((group) => group.slots.length > 0);
  }, [topDay]);

  const selectedSlot = useMemo(
    () => topDay?.slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId, topDay]
  );

  const continueTo = () => {
    if (!doctor || !selectedDate || !selectedSlot?.available) return;
    navigate(`/app/book/review`, {
      state: {
        doctor,
        date: selectedDate,
        slotId: selectedSlot.id,
        slotLabel: selectedSlot.label,
      },
    });
  };

  if (loading) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div role="status" aria-label="Loading available time slots" className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl bg-line" />
          <Skeleton className="h-20 rounded-2xl bg-line" />
          <Skeleton className="h-32 rounded-2xl bg-line" />
          <Skeleton className="h-16 rounded-2xl bg-line" />
        </div>
      </main>
    );
  }

  if (!doctor || !availability) {
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
            <p className="text-[0.9375rem] font-extrabold">Availability unavailable</p>
            <p className="mt-1 text-[0.78125rem] font-medium">{error || "We could not load the selected doctor's availability."}</p>
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
          <BookingSteps step={2}/>
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Booking</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Select Time</h1>
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

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-brand-600 bg-brand-50 px-4 py-3 text-[0.84375rem] font-bold text-brand-700">
          <div className="inline-flex items-center gap-2">
            <CalendarDays size={18} className="text-brand-600" />
            <span>{selectedDate ? formatLongDate(selectedDate) : 'Select a date first'}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 min-h-[36px] font-bold text-brand-700 hover:bg-brand-100"
            onClick={() => navigate(`/app/book/date/${doctor.id}`, { state: { doctor, date: selectedDate } })}
          >
            Change Date
          </Button>
        </div>

        {error ? (
          <div role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-[0.8125rem] font-semibold text-danger">
            {error}
          </div>
        ) : null}

        {topDay ? (
          <div className="mt-4 surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[0.875rem] font-extrabold text-ink">Available Slots</h2>
                <p className="mt-0.5 text-[0.75rem] text-ink-muted">{topDay.capacityLeft} slots remain open on this date</p>
              </div>
              <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-soft">
                {topDay.totalCapacity} total
              </span>
            </div>

            {groupedSlots.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-ink-muted">
                <p className="text-[0.875rem] font-bold text-ink">No time slots available</p>
                <p className="mt-1 text-xs">All appointments for this date are fully booked.</p>
                <Button
                  size="sm"
                  className="mt-3 h-11 min-h-[44px] bg-brand-600 font-bold text-white hover:bg-brand-700"
                  onClick={() => navigate(`/app/book/date/${doctor.id}`, { state: { doctor } })}
                >
                  Choose Another Date
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {groupedSlots.map((group) => (
                  <div key={group.period}>
                    <p className="mb-2 text-[0.71875rem] font-bold uppercase tracking-wide text-ink-muted">{group.period}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {group.slots.map((slot) => (
                        <button
                          key={slot.id}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlotId(slot.id)}
                          aria-pressed={selectedSlotId === slot.id}
                          aria-label={`${slot.label}, ${
                            slot.available ? `${slot.capacity - slot.bookedCount} slots left` : 'Fully booked'
                          }`}
                          className={`min-h-[52px] rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                            !slot.available
                              ? 'cursor-not-allowed border-line bg-canvas text-ink-muted/60 line-through'
                              : selectedSlotId === slot.id
                                ? 'border-brand-600 bg-brand-600 text-white shadow-sm font-bold'
                                : 'border-line bg-white text-ink-soft hover:border-brand-200'
                          }`}
                        >
                          <span className="block text-[0.78125rem] font-bold">{slot.label}</span>
                          <span
                            className={`mt-1 block text-xs ${
                              slot.available
                                ? selectedSlotId === slot.id
                                  ? 'text-white/80'
                                  : 'text-ink-muted'
                                : 'text-ink-muted'
                            }`}
                          >
                            {slot.available ? `${slot.capacity - slot.bookedCount} slots left` : 'Fully booked'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 surface p-4 shadow-sm">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-muted">Patient guidance</p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">
            Unavailable or full times are disabled. Pick a visible slot to continue to appointment review.
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-line bg-white text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500 font-bold"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:bg-line disabled:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
            disabled={!selectedSlot?.available}
            onClick={continueTo}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}