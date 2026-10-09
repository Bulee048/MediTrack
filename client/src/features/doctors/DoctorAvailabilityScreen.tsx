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
  const source = doctorResult?.source ?? null;
  const fallbackReason = doctorResult?.fallbackReason;
  const selectedDay = availability?.days[selectedDayIndex] ?? availability?.days[0] ?? null;
  const selectedSlot = selectedDay?.slots.find((s) => s.id === selectedSlotId) ?? null;

  const handleContinue = () => {
    if (!doctor || !selectedDay || !selectedSlot) return;
    navigate(`/patient/doctors/${doctor.id}/review`, {
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
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div role="status" aria-label="Loading doctor availability" className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!doctor || !availability) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-[15px] font-extrabold">Availability unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">{error || "We could not load this doctor's availability."}</p>
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
            <p className="text-[13px] font-semibold text-slate-500">Availability</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Doctor Availability</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {source === 'mock' ? (
          <div role="note" className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            [Temporary demo data] Temporary demo availability is being shown because the live API is unavailable.
          </div>
        ) : null}

        {fallbackReason ? (
          <div role="note" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            {fallbackReason}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-[16px] font-extrabold text-slate-900">{doctor.name}</p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">{doctor.title || 'Specialist'}</p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[12.5px] font-bold text-slate-700">
            <Star size={13} className="fill-amber-500 text-amber-500" /> {doctor.rating.toFixed(1)}
          </div>
          <p className="mt-1 text-[12.5px] font-bold text-blue-700">{doctor.department}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1 text-[15px] font-extrabold text-slate-900">{statusLabel(availability.availabilityStatus)}</p>
            </div>
            <Clock3 size={18} className="text-blue-600" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
              <Users size={14} /> {doctor.languages?.length ? doctor.languages.join(', ') : 'Language not listed'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
              <MapPin size={14} /> Room {doctor.room}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-extrabold text-slate-900">Available Dates</p>
              <p className="mt-0.5 text-[12px] text-slate-500">Select a date to view available slots.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {availability.days.length} days
              </span>
              <button
                onClick={() => navigate(`/patient/doctors/${doctor.id}/date`, { state: { doctor } })}
                aria-label="Open full calendar"
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Calendar size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Available dates">
            {availability.days.map((day, index) => (
              <button
                key={day.date}
                role="tab"
                aria-selected={selectedDayIndex === index}
                onClick={() => {
                  setSelectedDayIndex(index);
                  setSelectedSlotId('');
                }}
                className={`min-h-[50px] min-w-[96px] shrink-0 rounded-xl border px-3.5 py-2.5 text-left text-[12.5px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  selectedDayIndex === index
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                }`}
              >
                <span className="block">{day.label}</span>
                <span className={`mt-0.5 block text-[11px] ${selectedDayIndex === index ? 'text-white/80' : 'text-slate-400'}`}>
                  {daySummary(day)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedDay ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-extrabold text-slate-900">{formatDate(selectedDay.date)}</p>
                <p className="mt-0.5 text-[12px] text-slate-500">{selectedDay.capacityLeft} slots remain open today</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                {selectedDay.totalCapacity} total capacity
              </span>
            </div>

            {selectedDay.slots.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                <p className="text-[13px] font-semibold">No slots available on this date.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-11 min-h-[44px]"
                  onClick={() => navigate(`/patient/doctors/${doctor.id}/date`, { state: { doctor } })}
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
                    className={`min-h-[52px] rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      !slot.available
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                        : selectedSlotId === slot.id
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                    }`}
                  >
                    <span className="block text-[12.5px] font-bold">{slot.label}</span>
                    <span
                      className={`mt-1 block text-[11px] ${
                        slot.available
                          ? selectedSlotId === slot.id
                            ? 'text-white/80'
                            : 'text-slate-400'
                          : 'text-slate-500'
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

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Patient guidance</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
            Fully booked slots are disabled. Choose an available slot and click Continue to proceed to review.
          </p>
        </div>

        <div className="sticky bottom-2 mt-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold text-slate-500">Selected slot</p>
            <p className="text-[15px] font-extrabold text-slate-900">
              {selectedSlot ? selectedSlot.label : 'No slot selected'}
            </p>
          </div>
          <Button
            size="lg"
            className="ml-auto h-12 min-h-[44px] flex-1 bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600"
            disabled={!selectedSlotId}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}