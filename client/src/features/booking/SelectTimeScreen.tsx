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
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
        <div role="status" aria-label="Loading available time slots" className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl bg-[#E6ECF3]" />
          <Skeleton className="h-20 rounded-2xl bg-[#E6ECF3]" />
          <Skeleton className="h-32 rounded-2xl bg-[#E6ECF3]" />
          <Skeleton className="h-16 rounded-2xl bg-[#E6ECF3]" />
        </div>
      </main>
    );
  }

  if (!doctor || !availability) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#101A2E] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div role="alert" className="mt-4 rounded-2xl border border-[#E8455F]/30 bg-[#FDECEF] p-5 text-[#E8455F]">
            <p className="text-[15px] font-extrabold">Availability unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">{error || "We could not load the selected doctor's availability."}</p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="h-11 min-h-[44px] flex-1 border-[#E8455F]/40 text-[#E8455F] hover:bg-[#FDECEF] focus-visible:ring-2 focus-visible:ring-[#E8455F] font-semibold"
                onClick={() => navigate('/app/doctors')}
              >
                All Doctors
              </Button>
              <Button
                className="h-11 min-h-[44px] flex-1 bg-[#E8455F] text-white hover:bg-[#D3304A] focus-visible:ring-2 focus-visible:ring-[#E8455F] font-semibold"
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
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#6C7A90]">Booking</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-[#101A2E]">Select Time</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#101A2E] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="rounded-2xl border border-[#E6ECF3] bg-white p-4 text-center shadow-sm">
          <p className="text-[15px] font-extrabold text-[#101A2E]">{doctor.name}</p>
          <p className="mt-0.5 text-[12.5px] text-[#6C7A90]">
            {doctor.title || 'Specialist'} · {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Experience not listed'}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#101A2E]">
            <Star size={13} className="fill-[#F5A623] text-[#F5A623]" /> {doctor.availabilityStatus ?? 'AVAILABLE'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#0E8B7C] bg-[#ECFDF9] px-4 py-3 text-[13.5px] font-bold text-[#0C6F64]">
          <div className="inline-flex items-center gap-2">
            <CalendarDays size={18} className="text-[#0E8B7C]" />
            <span>{selectedDate ? formatLongDate(selectedDate) : 'Select a date first'}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 min-h-[36px] font-bold text-[#0C6F64] hover:bg-[#D2F5EE]"
            onClick={() => navigate(`/app/book/date/${doctor.id}`, { state: { doctor, date: selectedDate } })}
          >
            Change Date
          </Button>
        </div>

        {error ? (
          <div role="alert" className="mt-4 rounded-2xl border border-[#E8455F]/30 bg-[#FDECEF] p-4 text-[13px] font-semibold text-[#E8455F]">
            {error}
          </div>
        ) : null}

        {topDay ? (
          <div className="mt-4 rounded-2xl border border-[#E6ECF3] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-extrabold text-[#101A2E]">Available Slots</h2>
                <p className="mt-0.5 text-[12px] text-[#6C7A90]">{topDay.capacityLeft} slots remain open today</p>
              </div>
              <span className="rounded-full bg-[#F4F7FA] px-2.5 py-1 text-[11px] font-bold text-[#3A465C]">
                {topDay.totalCapacity} total
              </span>
            </div>

            {groupedSlots.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#E6ECF3] p-6 text-center text-[#6C7A90]">
                <p className="text-[14px] font-bold text-[#101A2E]">No time slots available</p>
                <p className="mt-1 text-xs">All appointments for this date are fully booked.</p>
                <Button
                  size="sm"
                  className="mt-3 h-11 min-h-[44px] bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64]"
                  onClick={() => navigate(`/app/book/date/${doctor.id}`, { state: { doctor } })}
                >
                  Choose Another Date
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {groupedSlots.map((group) => (
                  <div key={group.period}>
                    <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-[#6C7A90]">{group.period}</p>
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
                          className={`min-h-[52px] rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] ${
                            !slot.available
                              ? 'cursor-not-allowed border-[#E6ECF3] bg-[#F4F7FA] text-[#6C7A90]/60 line-through'
                              : selectedSlotId === slot.id
                                ? 'border-[#0E8B7C] bg-[#0E8B7C] text-white shadow-sm font-bold'
                                : 'border-[#E6ECF3] bg-white text-[#3A465C] hover:border-[#A7EADD]'
                          }`}
                        >
                          <span className="block text-[12.5px] font-bold">{slot.label}</span>
                          <span
                            className={`mt-1 block text-[11px] ${
                              slot.available
                                ? selectedSlotId === slot.id
                                  ? 'text-white/80'
                                  : 'text-[#6C7A90]'
                                : 'text-[#6C7A90]'
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

        <div className="mt-6 rounded-2xl border border-[#E6ECF3] bg-white p-4 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6C7A90]">Patient guidance</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#3A465C]">
            Unavailable or full times are disabled. Pick a visible slot to continue to appointment review.
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-[#E6ECF3] bg-white text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794] font-bold"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] disabled:bg-[#E6ECF3] disabled:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
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