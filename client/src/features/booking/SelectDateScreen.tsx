import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
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

  const doctor = doctorResult?.doctor ?? state.doctor ?? null;

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([fetchDoctorProfile(id), fetchDoctorAvailability(id, todayIso())])
      .then(([profile, availabilityView]) => {
        if (!active) return;
        setDoctorResult(profile);
        setAvailability(availabilityView);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const monthDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const grid = useMemo(() => monthGrid(monthDate), [monthDate]);
  const availabilityByDate = useMemo(() => new Map(availability?.days.map((day) => [day.date, day]) ?? []), [availability]);

  const confirm = () => {
    if (!doctor || !selectedDate) return;
    navigate(`/patient/doctors/${doctor.id}/availability`, {
      state: { doctor, date: selectedDate },
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-28 rounded-xl" />
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
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <ChevronLeft size={18} />
          </button>
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-red-700">
            <p className="text-[15px] font-extrabold">Doctor unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">We could not load the selected doctor.</p>
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

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-extrabold text-slate-900">
              {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMonthOffset((value) => value - 1)}
                disabled={monthOffset === 0}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setMonthOffset((value) => Math.min(2, value + 1))}
                disabled={monthOffset >= 2}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <span key={day} className="pb-1 text-[11.5px] font-semibold text-slate-400">
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
                  title={dayAvailability ? (dayAvailability.available ? 'Available' : 'Unavailable') : 'Unavailable'}
                  className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : available
                        ? 'text-slate-900 hover:bg-blue-50'
                        : 'cursor-not-allowed text-slate-300'
                  }`}
                >
                  {cell.day}
                  {available && !isSelected ? <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-blue-600" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" /> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-700" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-200" /> Unavailable
            </span>
          </div>
        </div>

        {selectedDate ? (
          <p className="mt-4 text-center text-[13px] font-semibold text-blue-700">{formatLongDate(selectedDate)}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="h-12 flex-1 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={!selectedDate} onClick={confirm}>
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}