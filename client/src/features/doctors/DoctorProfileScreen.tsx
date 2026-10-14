import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, ChevronLeft, Clock3, MapPin, RotateCcw, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDoctorAvailability, fetchDoctorProfile } from './doctors.service';
import type { DoctorAvailabilityView, DoctorProfileResult } from './types';

const BADGE_STYLES: Record<string, string> = {
  AVAILABLE: 'border-success/30 bg-success-soft text-success',
  LIMITED: 'border-warn/30 bg-warn-soft text-warn',
  UNAVAILABLE: 'border-line bg-canvas text-ink-muted',
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
  const fallbackReason = doctorResult?.fallbackReason;

  if (loading) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div role="status" aria-label="Loading doctor profile" className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-11 w-28 rounded-xl bg-line" />
          <div className="surface p-5 shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-5 w-44 bg-line" />
              <Skeleton className="h-3.5 w-28 bg-line" />
              <Skeleton className="h-3.5 w-36 bg-line" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Skeleton className="h-16 rounded-xl bg-line" />
                <Skeleton className="h-16 rounded-xl bg-line" />
                <Skeleton className="h-16 rounded-xl bg-line" />
              </div>
            </div>
          </div>
          <Skeleton className="h-24 rounded-2xl bg-line" />
          <Skeleton className="h-36 rounded-2xl bg-line" />
        </div>
      </main>
    );
  }

  if (!doctor) {
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
            <p className="text-[0.9375rem] font-extrabold">Doctor profile unavailable</p>
            <p className="mt-1 text-[0.78125rem] font-medium">{error || 'We could not find this doctor.'}</p>
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

  const status = doctor.availabilityStatus ?? 'AVAILABLE';
  const topDay = availability?.days[0];

  return (
    <main data-feature-accessibility className="patient-page page-enter">
      <div className="mx-auto w-full max-w-3xl space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Profile</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Doctor Profile</h1>
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

        <div className="mt-4 surface p-5 text-center shadow-sm">
          <p className="text-[1.125rem] font-extrabold tracking-tight text-ink">{doctor.name}</p>
          <p className="mt-1 text-[0.8125rem] text-ink-muted">{doctor.title || 'Specialist'}</p>
          <p className="mt-1 text-[0.84375rem] font-bold text-brand-600">
            {doctor.experienceYears ? `${doctor.experienceYears} Years Experience` : 'Experience not listed'}
          </p>

          {(doctor.patientsTreated!==undefined||doctor.rating!==undefined||doctor.reviews!==undefined)&&<div className="mt-4 flex flex-wrap justify-center gap-5 border-t border-line pt-4">
            {doctor.patientsTreated!==undefined&&<div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Patients</p>
              <p className="mt-1 text-[0.9375rem] font-extrabold text-ink">{doctor.patientsTreated ?? 'Not available'}</p>
            </div>}
            {doctor.rating!==undefined&&<div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Rating</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[0.9375rem] font-extrabold text-ink">
                <Star size={14} className="fill-[#F5A623] text-warn" /> {doctor.rating?.toFixed(1) ?? 'Not rated'}
              </p>
            </div>}
            {doctor.reviews!==undefined&&<div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Reviews</p>
              <p className="mt-1 text-[0.9375rem] font-extrabold text-ink">{doctor.reviews ?? 'Not available'}</p>
            </div>}
          </div>}
        </div>

        <div className="mt-4 surface p-4 shadow-sm">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-muted">Availability Status</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[0.78125rem] font-bold ${BADGE_STYLES[status]}`}>
              {prettyStatus(status)}
            </span>
            <Button
              size="sm"
              className="h-11 min-h-[44px] bg-brand-600 px-4 font-bold text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={() => navigate(`/app/doctor/${doctor.id}/availability`)}
            >
              View Availability
            </Button>
          </div>
        </div>

        <h2 className="mt-6 text-[0.9375rem] font-extrabold text-ink">About Doctor</h2>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">{doctor.about || 'No profile description is available right now.'}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-soft">
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 font-semibold text-ink-soft">
            <Users size={14} /> Speaks {doctor.languages?.length ? doctor.languages.join(', ') : 'not listed'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 font-semibold text-ink-soft">
            <Building2 size={14} /> {doctor.department}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 font-semibold text-ink-soft">
            <MapPin size={14} /> Room {doctor.room}
          </span>
        </div>

        {availability ? (
          <div className="mt-6 surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[0.875rem] font-extrabold text-ink">Upcoming Availability</h3>
                <p className="mt-0.5 text-[0.75rem] text-ink-muted">Available dates and slot capacity at a glance.</p>
              </div>
              <Clock3 size={18} className="text-brand-600" />
            </div>

            {topDay ? (
              <div className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-[0.78125rem] text-brand-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">Next date</span>
                  <span className="font-semibold">{formatDate(topDay.date)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-brand-600">
                  <span>{topDay.available ? 'Slots available' : 'No slots available'}</span>
                  <span className="font-bold">{topDay.capacityLeft} left</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="patient-sticky-action mt-7 flex items-center gap-3 surface p-4 shadow-lg">
          <div className="min-w-0">
            <p className="text-[0.71875rem] font-semibold text-ink-muted">Consultation Fee</p>
            <p className="text-[1.1875rem] font-extrabold text-brand-600">{doctor.fee !== undefined ? `LKR ${doctor.fee}` : 'Fee not listed'}</p>
          </div>
          <Button
            size="lg"
            className="ml-auto h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
            onClick={() => navigate(`/app/book/date/${doctor.id}`)}
          >
            Book OPD
          </Button>
        </div>
      </div>
    </main>
  );
}
