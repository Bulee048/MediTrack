import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, Star } from 'lucide-react';
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
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState(state.slotId ?? '');
  const [error, setError] = useState('');

  const doctor = doctorResult?.doctor ?? state.doctor ?? null;
  const selectedDate = state.date ?? '';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([fetchDoctorProfile(id), fetchDoctorAvailability(id, selectedDate || new Date().toISOString().split('T')[0])])
      .then(([profile, availabilityView]) => {
        if (!active) return;
        setDoctorResult(profile);
        setAvailability(availabilityView);
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
  }, [id, selectedDate]);

  const topDay = useMemo(() => availability?.days.find((day) => day.date === selectedDate) ?? availability?.days[0] ?? null, [availability, selectedDate]);

  const selectedSlot = useMemo(() => topDay?.slots.find((slot) => slot.id === selectedSlotId) ?? null, [selectedSlotId, topDay]);

  const continueTo = () => {
    if (!doctor || !selectedDate || !selectedSlot) return;
    navigate(`/patient/doctors/${doctor.id}/availability`, {
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
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!doctor || !availability) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <ChevronLeft size={18} />
          </button>
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-red-700">
            <p className="text-[15px] font-extrabold">Availability unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">We could not load the selected doctor's availability.</p>
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
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Select Time</h1>
          </div>
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-[15px] font-extrabold text-slate-900">{doctor.name}</p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            {doctor.title || 'Specialist'} · {doctor.experienceYears ? `${doctor.experienceYears} Yrs Exp` : 'Experience not listed'}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-700">
            <Star size={13} className="fill-amber-500 text-amber-500" /> {doctor.rating?.toFixed?.(1) ?? '0.0'}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13.5px] font-bold text-blue-700">
          <CalendarDays size={17} className="mr-2 inline-block align-text-bottom" />
          {selectedDate ? formatLongDate(selectedDate) : 'Select a date first'}
        </div>

        {topDay ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-extrabold text-slate-900">Available Slots</p>
                <p className="mt-0.5 text-[12px] text-slate-500">{topDay.capacityLeft} slots remain open today</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">{topDay.totalCapacity} total</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {topDay.slots.map((slot) => (
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
            Unavailable or full times are disabled. Pick a visible slot to continue.
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <Button variant="outline" className="h-12 flex-1 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={!selectedSlotId} onClick={continueTo}>
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}