import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock3, MapPin, Star, Users } from 'lucide-react';
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

  useEffect(() => {
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
  }, [id]);

  const doctor = doctorResult?.doctor ?? null;
  const source = doctorResult?.source ?? null;
  const fallbackReason = doctorResult?.fallbackReason;
  const selectedDay = availability?.days[selectedDayIndex] ?? availability?.days[0] ?? null;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-28 rounded-xl" />
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
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-red-700">
            <p className="text-[15px] font-extrabold">Availability unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">We could not load this doctor's availability.</p>
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {source === 'mock' ? (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            Temporary demo availability is being shown because the live API is unavailable.
          </div>
        ) : null}

        {fallbackReason ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            {fallbackReason}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-[15px] font-extrabold text-slate-900">{doctor.name}</p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">{doctor.title || 'Specialist'}</p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[12.5px] font-bold text-slate-700">
            <Star size={13} className="fill-amber-500 text-amber-500" /> {doctor.rating.toFixed(1)}
          </div>
          <p className="mt-1 text-[12.5px] text-blue-700">{doctor.department}</p>
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
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              <Users size={14} /> {doctor.languages?.length ? doctor.languages.join(', ') : 'Language not listed'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
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
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              {availability.days.length} days
            </span>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {availability.days.map((day, index) => (
              <button
                key={day.date}
                onClick={() => {
                  setSelectedDayIndex(index);
                  setSelectedSlotId('');
                }}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-left text-[12.5px] font-bold transition ${
                  selectedDayIndex === index
                    ? 'border-blue-600 bg-blue-600 text-white'
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
                <p className="mt-0.5 text-[12px] text-slate-500">{selectedDay.capacityLeft} slots remain open</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                {selectedDay.totalCapacity} total capacity
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {selectedDay.slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    !slot.available
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                      : selectedSlotId === slot.id
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                  }`}
                >
                  <span className="block text-[12.5px] font-bold">{slot.label}</span>
                  <span className={`mt-1 block text-[11px] ${slot.available ? (selectedSlotId === slot.id ? 'text-white/80' : 'text-slate-400') : 'text-slate-500'}`}>
                    {slot.available ? `${slot.capacity - slot.bookedCount} slots left` : 'Fully booked'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Patient guidance</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
            Fully booked slots are disabled. Choose an available slot to continue booking when the next step is available.
          </p>
        </div>

        <div className="sticky bottom-2 mt-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold text-slate-500">Selected slot</p>
            <p className="text-[15px] font-extrabold text-slate-900">{selectedSlotId ? '1 slot selected' : 'No slot selected'}</p>
          </div>
          <Button
            size="lg"
            className="ml-auto flex-1 bg-blue-600 text-white hover:bg-blue-700"
            disabled={!selectedSlotId}
            onClick={() => navigate(`/patient/doctor/${doctor.id}`)}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}