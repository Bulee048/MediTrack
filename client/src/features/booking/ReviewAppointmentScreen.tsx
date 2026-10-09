import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Building2, CalendarDays, ChevronLeft, Clock3, Loader2, MapPin, Pencil, RotateCcw, Star, User2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { fetchCurrentUser } from '@/features/auth/auth.service';
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
  const [patientName, setPatientName] = useState('');
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

    Promise.all([fetchDoctorProfile(id), fetchCurrentUser()])
      .then(([profile, currentUser]) => {
        if (!active) return;
        if (profile.doctor) {
          setDoctorResult(profile);
        }
        setPatientName(currentUser.user.name);

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
    if (!doctor || !selectedDate || !selectedSlotId) return;

    setSubmitting(true);
    setError('');

    try {
      const appointment = await createAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        slotId: selectedSlotId,
        slotLabel: selectedSlotLabel,
        reason,
      });

      navigate(`/app/book/done/${appointment.id}`);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to confirm appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
        <div role="status" aria-label="Loading review details" className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-11 w-32 rounded-xl bg-[#E6ECF3]" />
          <Skeleton className="h-24 rounded-2xl bg-[#E6ECF3]" />
          <Skeleton className="h-20 rounded-2xl bg-[#E6ECF3]" />
          <Skeleton className="h-20 rounded-2xl bg-[#E6ECF3]" />
          <Skeleton className="h-20 rounded-2xl bg-[#E6ECF3]" />
        </div>
      </main>
    );
  }

  if (!doctor) {
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
            <p className="text-[15px] font-extrabold">Review unavailable</p>
            <p className="mt-1 text-[12.5px] font-medium">{error || 'We could not load the selected doctor.'}</p>
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
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-[#101A2E]">Review Appointment</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#101A2E] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {error ? (
          <div role="alert" className="mt-2 rounded-2xl border border-[#E8455F]/30 bg-[#FDECEF] p-4 text-[13px] font-semibold text-[#E8455F]">
            {error}
          </div>
        ) : null}

        <SectionCard label="Doctor & Specialty" onEdit={goToDate} editLabel="Edit Doctor">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15.5px] font-extrabold text-[#101A2E]">{doctor.name}</p>
              <p className="mt-0.5 text-[12.5px] text-[#6C7A90]">
                {doctor.title || 'Specialist'} · {doctor.department}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#101A2E]">
                <Star size={13} className="fill-[#F5A623] text-[#F5A623]" /> {doctor.availabilityStatus ?? 'AVAILABLE'}
              </p>
            </div>
            <span className="rounded-full bg-[#F4F7FA] px-2.5 py-1 text-[11px] font-bold text-[#3A465C]">
              {doctor.room ? `Room ${doctor.room}` : 'Room not listed'}
            </span>
          </div>
        </SectionCard>

        <SectionCard label="Date & Time" onEdit={goToTime} editLabel="Edit Time">
          <div className="space-y-2 text-[13px] text-[#3A465C]">
            <p className="inline-flex items-center gap-2 font-bold text-[#101A2E]">
              <CalendarDays size={16} className="text-[#0E8B7C]" />
              {selectedDate ? formatLongDate(selectedDate) : 'Select a date'}
            </p>
            <p className="inline-flex items-center gap-2 font-semibold text-[#3A465C]">
              <Clock3 size={16} className="text-[#0E8B7C]" />
              {formatSlotLabel(selectedSlotLabel)}
            </p>
          </div>
        </SectionCard>

        <SectionCard label="Patient Info">
          <div className="space-y-2 text-[13px] text-[#3A465C]">
            <p className="inline-flex items-center gap-2 font-bold text-[#101A2E]">
              <User2 size={16} className="text-[#0E8B7C]" />
              {patientSummary}
            </p>
            <p className="inline-flex items-center gap-2 font-semibold text-[#3A465C]">
              <Building2 size={16} className="text-[#0E8B7C]" />
              {doctor.department}
            </p>
            <p className="inline-flex items-center gap-2 font-semibold text-[#3A465C]">
              <MapPin size={16} className="text-[#0E8B7C]" />
              {doctor.room ? `Room ${doctor.room}` : 'Location not listed'}
            </p>
          </div>
        </SectionCard>

        <div className="mt-4 rounded-2xl border border-[#E6ECF3] bg-white p-4 shadow-sm">
          <Label htmlFor="visit-reason" className="text-[12px] font-semibold uppercase tracking-wide text-[#6C7A90]">
            Reason for visit (optional)
          </Label>
          <Textarea
            id="visit-reason"
            className="mt-2 border-[#E6ECF3] text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Chest pain on exertion for 2 weeks"
          />
          <p className="mt-2 text-[12px] text-[#6C7A90]">Shared with the doctor before your consultation.</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-[#E6ECF3] bg-white text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794] font-bold"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Back
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] disabled:bg-[#E6ECF3] disabled:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
            disabled={submitting || !patientName || !selectedDate || !selectedSlotId}
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
    <div className="mt-4 rounded-2xl border border-[#E6ECF3] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6C7A90]">{label}</p>
        {onEdit ? (
          <button
            onClick={onEdit}
            aria-label={editLabel || `Edit ${label}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-bold text-[#0E8B7C] hover:text-[#0C6F64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-lg"
          >
            <Pencil size={13} /> Edit
          </button>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
