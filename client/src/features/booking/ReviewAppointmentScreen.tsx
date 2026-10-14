import { BookingSteps } from '@/components/ui/booking-steps';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Building2, CalendarDays, ChevronLeft, Clock3, Loader2, MapPin, Pencil, RotateCcw, Star, User2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/features/profile/context/ProfileContext';
import { useBookingPatient } from '@/features/family/context/BookingPatientContext';
import { useQueryClient } from '@tanstack/react-query';
import { fetchDoctorProfile } from '@/features/doctors/doctors.service';
import type { BookingTimeSelection } from './types';
import { createAppointment } from './appointment.service';
import type { DoctorProfileResult } from '@/features/doctors/types';

type LocationState = Partial<BookingTimeSelection>;

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatSlotLabel(slotLabel: string) {
  const trimmed = slotLabel.trim();
  if (!trimmed) return 'Select a time';
  return trimmed;
}

export default function ReviewAppointmentScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const id = state.doctor?.id ?? params.id ?? '';

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const { user } = useProfile();
  const { patient, loading: patientLoading, error: patientError, selectPatient } = useBookingPatient();
  const patientName = patient?.name ?? user?.name ?? '';
  const pending = useRef(false);
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const doctor = doctorResult?.doctor ?? null;
  const selectedDate = state.date ?? '';
  const selectedSlotId = state.slotId ?? '';
  const selectedSlotLabel = state.slotLabel ?? '';

  const loadData = () => {
    let active = true;
    setLoading(true);
    setError('');

    fetchDoctorProfile(id)
      .then((profile) => {
        if (!active) return;
        if (profile.doctor) {
          setDoctorResult(profile);
        }


        if (!profile.doctor && !state.doctor) {
          setError('Doctor not found');
        }
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load review details');
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
  }, [id, state.doctor]);

  const patientSummary = patientName;

  const goToDate = () => {
    if (!doctor) return;
    navigate(`/app/book/date/${doctor.id}`, {
      state: { doctor, date: selectedDate },
    });
  };

  const goToTime = () => {
    if (!doctor) return;
    navigate(`/app/book/time/${doctor.id}`, {
      state: { doctor, date: selectedDate, slotId: selectedSlotId, slotLabel: selectedSlotLabel },
    });
  };

  const confirm = async () => {
    if (!doctor || !selectedDate || !selectedSlotId || patientLoading || patientError || pending.current) return;
    pending.current = true;

    setSubmitting(true);
    setError('');

    try {
      const appointment = await createAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        slotId: selectedSlotId,
        slotLabel: selectedSlotLabel,
        reason, familyMemberId: patient?.id,
      });

      selectPatient(null);
      await queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
      navigate(`/app/book/done/${appointment.id}`);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to confirm appointment');
    } finally {
      pending.current = false; setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div role="status" aria-label="Loading review details" className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-11 w-32 rounded-xl bg-line" />
          <Skeleton className="h-24 rounded-2xl bg-line" />
          <Skeleton className="h-20 rounded-2xl bg-line" />
          <Skeleton className="h-20 rounded-2xl bg-line" />
          <Skeleton className="h-20 rounded-2xl bg-line" />
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
            <p className="text-[0.9375rem] font-extrabold">Review unavailable</p>
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
          <BookingSteps step={3}/>
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Booking</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Review Appointment</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {error || patientError ? (
          <div role="alert" className="mt-2 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-[0.8125rem] font-semibold text-danger">
            {error || patientError}
          </div>
        ) : null}

        <SectionCard label="Doctor & Specialty" onEdit={goToDate} editLabel="Edit Doctor">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#146C94] to-[#18A6A6] text-white font-black text-lg shadow-sm">
                {doctor.name ? doctor.name.replace(/^Dr\.\s*/i, '').charAt(0) : 'D'}
              </div>
              <div>
                <p className="text-[1.0625rem] font-black text-[#183247]">{doctor.name}</p>
                <p className="text-xs font-semibold text-[#64798B] mt-0.5">
                  {doctor.title || 'Specialist'} · {doctor.department}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF7EC] px-2 py-0.5 text-xs font-bold text-[#E9A23B]">
                    <Star size={12} className="fill-[#E9A23B] text-[#E9A23B]" /> {doctor.availabilityStatus ?? 'AVAILABLE'}
                  </span>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 self-start sm:self-center rounded-full bg-[#F6FAFD] border border-[#DCE8EE] px-3 py-1 text-xs font-extrabold text-[#146C94]">
              {doctor.room ? `Room ${doctor.room}` : 'Room not listed'}
            </span>
          </div>
        </SectionCard>

        <SectionCard label="Date & Time" onEdit={goToTime} editLabel="Edit Time">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[0.875rem]">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F6FAFD] border border-[#E5F0F5] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#146C94]">
                <CalendarDays size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">Date</p>
                <p className="font-extrabold text-[#183247] truncate">
                  {selectedDate ? formatLongDate(selectedDate) : 'Select a date'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#F6FAFD] border border-[#E5F0F5] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDF3F2] text-[#18A6A6]">
                <Clock3 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">Time Slot</p>
                <p className="font-extrabold text-[#183247] truncate">
                  {formatSlotLabel(selectedSlotLabel)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard label="Patient Info">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#F6FAFD] border border-[#E5F0F5] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#146C94] to-[#18A6A6] text-white shadow-sm font-black text-base">
                {patientSummary ? patientSummary.charAt(0).toUpperCase() : <User2 size={20} />}
              </div>
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">Patient Name</p>
                <p className="font-extrabold text-[#183247] text-[0.9375rem]">{patientSummary || 'Not selected'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5F0F5]">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#146C94] border border-[#DCE8EE] shadow-2xs">
                <Building2 size={14} className="text-[#18A6A6]" />
                {doctor.department}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#183247] border border-[#DCE8EE] shadow-2xs">
                <MapPin size={14} className="text-[#DE6470]" />
                {doctor.room ? `Room ${doctor.room}` : 'Location not listed'}
              </span>
            </div>
          </div>
        </SectionCard>

        <div className="mt-4 rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
          <Label htmlFor="visit-reason" className="text-[0.75rem] font-extrabold uppercase tracking-wider text-[#64798B]">
            Reason for visit (optional)
          </Label>
          <Textarea
            id="visit-reason"
            className="mt-2.5 rounded-2xl border-[#DCE8EE] bg-[#F6FAFD] p-3.5 text-[0.875rem] text-[#183247] placeholder:text-[#64798B]/70 focus-visible:ring-2 focus-visible:ring-[#146C94] focus-visible:bg-white transition"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Chest pain on exertion for 2 weeks"
          />
          <p className="mt-2 text-[0.75rem] font-medium text-[#64798B]">Shared with the doctor before your consultation.</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-line bg-white text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500 font-bold"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Back
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:bg-line disabled:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand-500"
            disabled={submitting || patientLoading || Boolean(patientError) || !patientName || !selectedDate || !selectedSlotId}
            onClick={confirm}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
              </>
            ) : (
              'Confirm Appointment'
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}

function SectionCard({
  label,
  onEdit,
  editLabel,
  children,
}: {
  label: string;
  onEdit?: () => void;
  editLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F8]">
        <p className="text-[0.75rem] font-extrabold uppercase tracking-wider text-[#64798B]">{label}</p>
        {onEdit ? (
          <button
            onClick={onEdit}
            aria-label={editLabel || `Edit ${label}`}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#146C94] bg-[#EBF5FB] hover:bg-[#DDF3F2] hover:text-[#105779] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C94] transition active:scale-95"
          >
            <Pencil size={12} /> Edit
          </button>
        ) : null}
      </div>
      <div className="pt-3.5">{children}</div>
    </div>
  );
}
