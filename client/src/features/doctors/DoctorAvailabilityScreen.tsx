import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ChevronLeft, Clock3, MapPin, RotateCcw, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDoctorAvailability, fetchDoctorProfile } from './doctors.service';
import type { DoctorAvailabilityDayView, DoctorAvailabilityView, DoctorProfileResult } from './types';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function daySummary(day: DoctorAvailabilityDayView) {
  return `${day.capacityLeft} slots left`;
}

export default function DoctorAvailabilityScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([fetchDoctorProfile(id), fetchDoctorAvailability(id, new Date().toISOString().split('T')[0])])
      .then(([profile, availabilityView]) => {
        if (!active) return;
        setDoctorResult(profile);
        setAvailability(availabilityView);
        setSelectedDayIndex(0);
        setSelectedSlotId('');
        if (!profile.doctor) {
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
  }, [id]);

  const doctor = doctorResult?.doctor ?? null;
  const fallbackReason = doctorResult?.fallbackReason;
  const selectedDay = availability?.days[selectedDayIndex] ?? availability?.days[0] ?? null;
  const selectedSlot = selectedDay?.slots.find((s) => s.id === selectedSlotId) ?? null;

  const handleContinue = () => {
    if (!doctor || !selectedDay || !selectedSlot?.available) return;
    navigate(`/app/book/review`, {
      state: {
        doctor,
        date: selectedDay.date,
        slotId: selectedSlot.id,
        slotLabel: selectedSlot.label,
      },
    });
  };

  if (loading) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div role="status" aria-label="Loading doctor availability" className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl bg-line" />
          <Skeleton className="h-24 rounded-2xl bg-line" />
          <Skeleton className="h-20 rounded-2xl bg-line" />
          <Skeleton className="h-44 rounded-2xl bg-line" />
        </div>
      </main>
    );
  }

  if (!doctor || !availability) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger">
            <p className="text-[0.9375rem] font-extrabold">Availability unavailable</p>
            <p className="mt-1 text-[0.78125rem] font-medium">{error || "We could not load this doctor's availability."}</p>
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
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Availability</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Doctor Availability</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {fallbackReason ? (
          <div role="note" className="mt-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-[0.78125rem] font-semibold text-warn">
            {fallbackReason}
          </div>
        ) : null}

        <div className="mt-4 surface p-4 text-center shadow-sm">
          <p className="text-[1rem] font-extrabold text-ink">{doctor.name}</p>
          <p className="mt-0.5 text-[0.78125rem] text-ink-muted">{doctor.title || 'Specialist'}</p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[0.78125rem] font-bold text-ink">
            <Star size={13} className="fill-[#F5A623] text-warn" /> {doctor.rating?.toFixed(1) ?? 'Not rated'}
          </div>
          <p className="mt-1 text-[0.78125rem] font-bold text-brand-600">{doctor.department}</p>
        </div>

        <div className="mt-4 surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-muted">Status</p>
              <p className="mt-1 text-[0.9375rem] font-extrabold text-ink">{statusLabel(availability.availabilityStatus)}</p>
            </div>
            <Clock3 size={18} className="text-brand-600" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 font-semibold text-ink-soft">
              <Users size={14} /> {doctor.languages?.length ? doctor.languages.join(', ') : 'Language not listed'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 font-semibold text-ink-soft">
              <MapPin size={14} /> Room {doctor.room}
            </span>
          </div>
        </div>

        <div className="mt-5 surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.875rem] font-extrabold text-ink">Available Dates</p>
              <p className="mt-0.5 text-[0.75rem] text-ink-muted">Select a date to view available slots.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600">
                {availability.days.length} days
              </span>
              <button
                onClick={() => navigate(`/app/book/date/${doctor.id}`, { state: { doctor } })}
                aria-label="Open full calendar"
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-line text-ink-soft hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Calendar size={18} />
              </button>
            </div>
          </div>

          {availability.days.length === 0 && <p role="status" className="mt-4 text-sm">No availability has been published for this doctor.</p>}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Available dates">
            {availability.days.map((day, index) => (
              <button
                key={day.date}
                aria-pressed={selectedDayIndex === index}
                onClick={() => {
                  setSelectedDayIndex(index);
                  setSelectedSlotId('');
                }}
                className={`min-h-[50px] min-w-[96px] shrink-0 rounded-xl border px-3.5 py-2.5 text-left text-[0.78125rem] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  selectedDayIndex === index
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                    : 'border-line bg-white text-ink-soft hover:border-brand-200'
                }`}
              >
                <span className="block">{day.label}</span>
                <span className={`mt-0.5 block text-xs ${selectedDayIndex === index ? 'text-white/80' : 'text-ink-muted'}`}>
                  {daySummary(day)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedDay ? (
          <div className="mt-5 surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.875rem] font-extrabold text-ink">{formatDate(selectedDay.date)}</p>
                <p className="mt-0.5 text-[0.75rem] text-ink-muted">{selectedDay.capacityLeft} slots remain open today</p>
              </div>
              <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-soft">
                {selectedDay.totalCapacity} total capacity
              </span>
            </div>

            {selectedDay.slots.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line p-4 text-center text-ink-muted">
                <p className="text-[0.8125rem] font-semibold text-ink">No slots available on this date.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-11 min-h-[44px] border-line text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500"
                  onClick={() => navigate(`/app/book/date/${doctor.id}`, { state: { doctor } })}
                >
                  Pick from Calendar
                </Button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {selectedDay.slots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlotId(slot.id)}
                    aria-pressed={selectedSlotId === slot.id}
                    aria-label={`${slot.label}, ${slot.available ? `${slot.capacity - slot.bookedCount} slots left` : 'Fully booked'}`}
                    className={`min-h-[52px] rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      !slot.available
                        ? 'cursor-not-allowed border-line bg-canvas text-ink-muted/60 line-through'
                        : selectedSlotId === slot.id
                          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
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
            )}
          </div>
        ) : null}

        <div className="mt-6 surface p-4 shadow-sm">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-muted">Patient guidance</p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">
            Fully booked slots are disabled. Choose an available slot and click Continue to proceed to review.
          </p>
        </div>

        <div className="patient-sticky-action mt-7 flex items-center gap-4 surface p-4 shadow-lg">
          <div className="min-w-0">
            <p className="text-[0.71875rem] font-semibold text-ink-muted">Selected slot</p>
            <p className="text-[0.9375rem] font-extrabold text-ink">
              {selectedSlot ? selectedSlot.label : 'No slot selected'}
            </p>
          </div>
          <Button
            size="lg"
            className="ml-auto h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:bg-line disabled:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
            disabled={!selectedSlot?.available}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}