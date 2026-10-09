import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, ChevronLeft, Clock3, MapPin, RotateCcw, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDoctorAvailability, fetchDoctorProfile } from './doctors.service';
import type { DoctorAvailabilityView, DoctorProfileResult } from './types';

const BADGE_STYLES: Record<string, string> = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  LIMITED: 'border-amber-200 bg-amber-50 text-amber-700',
  UNAVAILABLE: 'border-slate-200 bg-slate-100 text-slate-600',
};

function prettyStatus(status?: string) {
  if (!status) return 'Unknown';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DoctorProfileScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityView | null>(null);
  const [loading, setLoading] = useState(true);
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
        if (!profile.doctor) {
          setError('Doctor not found');
        }
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load doctor profile');
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div role="status" aria-label="Loading doctor profile" className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl" />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-36" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </div>
          </div>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!doctor) {
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
            <p className="text-[15px] font-extrabold">Doctor profile unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">{error || 'We could not find this doctor.'}</p>
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

  const status = doctor.availabilityStatus ?? 'AVAILABLE';
  const topDay = availability?.days[0];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-500">Profile</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Doctor Profile</h1>
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
            [Temporary demo data] Demo doctor profile shown because the live API is unavailable.
          </div>
        ) : null}

        {fallbackReason ? (
          <div role="note" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
            {fallbackReason}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-[18px] font-extrabold tracking-tight text-slate-900">{doctor.name}</p>
          <p className="mt-1 text-[13px] text-slate-500">{doctor.title || 'Specialist'}</p>
          <p className="mt-1 text-[13.5px] font-bold text-blue-700">
            {doctor.experienceYears ? `${doctor.experienceYears} Years Experience` : 'Experience not listed'}
          </p>

          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Patients</p>
              <p className="mt-1 text-[15px] font-extrabold text-slate-900">{doctor.patientsTreated}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rating</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[15px] font-extrabold text-slate-900">
                <Star size={14} className="fill-amber-500 text-amber-500" /> {doctor.rating.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reviews</p>
              <p className="mt-1 text-[15px] font-extrabold text-slate-900">{doctor.reviews}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Availability Status</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12.5px] font-bold ${BADGE_STYLES[status]}`}>
              {prettyStatus(status)}
            </span>
            <Button
              size="sm"
              className="h-11 min-h-[44px] bg-blue-600 px-4 font-bold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={() => navigate(`/patient/doctors/${doctor.id}/availability`)}
            >
              View Availability
            </Button>
          </div>
        </div>

        <h2 className="mt-6 text-[15px] font-extrabold text-slate-900">About Doctor</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{doctor.about || 'No profile description is available right now.'}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
            <Users size={14} /> Speaks {doctor.languages?.length ? doctor.languages.join(', ') : 'not listed'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
            <Building2 size={14} /> {doctor.department}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
            <MapPin size={14} /> Room {doctor.room}
          </span>
        </div>

        {availability ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-extrabold text-slate-900">Upcoming Availability</h3>
                <p className="mt-0.5 text-[12px] text-slate-500">Available dates and slot capacity at a glance.</p>
              </div>
              <Clock3 size={18} className="text-blue-600" />
            </div>

            {topDay ? (
              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-[12.5px] text-blue-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">Next date</span>
                  <span className="font-semibold">{formatDate(topDay.date)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-blue-700">
                  <span>{topDay.available ? 'Slots available' : 'No slots available'}</span>
                  <span className="font-bold">{topDay.capacityLeft} left</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="sticky bottom-2 mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold text-slate-500">Consultation Fee</p>
            <p className="text-[19px] font-extrabold text-blue-700">LKR {doctor.fee ?? 0}</p>
          </div>
          <Button
            size="lg"
            className="ml-auto h-12 min-h-[44px] flex-1 bg-blue-600 font-bold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
            onClick={() => navigate(`/patient/doctors/${doctor.id}/date`)}
          >
            Book OPD
          </Button>
        </div>
      </div>
    </main>
  );
}