import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Building2, CalendarDays, ChevronLeft, Clock3, MapPin, Pencil, Star, User2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { fetchCurrentUser } from '@/features/auth/auth.service';
import { fetchDoctorProfile } from '@/features/doctors/doctors.service';
import type { BookingTimeSelection } from './types';
import { createAppointment, getAppointmentQuote } from './appointment.service';
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
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [doctorResult, setDoctorResult] = useState<DoctorProfileResult | null>(null);
  const [patientName, setPatientName] = useState('Nayana Perera');
  const [reason, setReason] = useState('');
  const [quote, setQuote] = useState<{ consultationFee: number; platformFee: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const doctor = doctorResult?.doctor ?? state.doctor ?? null;
  const selectedDate = state.date ?? '';
  const selectedSlotId = state.slotId ?? '';
  const selectedSlotLabel = state.slotLabel ?? '';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([fetchDoctorProfile(id), fetchCurrentUser().catch(() => null)])
      .then(([profile, currentUser]) => {
        if (!active) return;
        if (profile.doctor) {
          setDoctorResult(profile);
        }
        setPatientName(currentUser?.user.name ?? 'Nayana Perera');

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
  }, [id, state.doctor]);

  useEffect(() => {
    if (!doctor || !selectedSlotId) return;

    let active = true;

    getAppointmentQuote({
      doctorId: doctor.id,
      slotId: selectedSlotId,
      consultationFee: doctor.fee ?? 0,
    })
      .then((result) => {
        if (active) {
          setQuote(result);
        }
      })
      .catch(() => {
        if (active) {
          setQuote({
            consultationFee: doctor.fee ?? 0,
            platformFee: 20,
            total: (doctor.fee ?? 0) + 20,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [doctor, selectedSlotId]);

  const totalAmount = quote?.total ?? (doctor?.fee ?? 0) + 20;
  const patientSummary = useMemo(() => patientName || 'Nayana Perera', [patientName]);

  const goToDate = () => {
    if (!doctor) return;
    navigate(`/patient/doctors/${doctor.id}/date`, {
      state: { doctor, date: selectedDate },
    });
  };

  const goToTime = () => {
    if (!doctor) return;
    navigate(`/patient/doctors/${doctor.id}/time`, {
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
        doctorName: doctor.name,
        department: doctor.department,
        date: selectedDate,
        slotId: selectedSlotId,
        slotLabel: selectedSlotLabel,
        reason,
        forSelf: true,
        familyMemberName: patientSummary,
        amount: totalAmount,
        patientName: patientSummary,
      });

      navigate(`/patient/doctors/${doctor.id}/confirmed`, {
        state: {
          appointment,
          doctor,
        },
      });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to confirm appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
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
            <p className="text-[15px] font-extrabold">Review unavailable</p>
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
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Review Appointment</h1>
          </div>
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <ChevronLeft size={18} />
          </button>
        </div>

        {error ? (
          <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <SectionCard label="Doctor & Specialty" onEdit={goToDate}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-slate-900">{doctor.name}</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">{doctor.title || 'Specialist'} · {doctor.department}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-700">
                <Star size={13} className="fill-amber-500 text-amber-500" /> {doctor.availabilityStatus ?? 'AVAILABLE'}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">{doctor.room ? `Room ${doctor.room}` : 'Room not listed'}</span>
          </div>
        </SectionCard>

        <SectionCard label="Date & Time" onEdit={goToTime}>
          <div className="space-y-2 text-[13px] text-slate-700">
            <p className="inline-flex items-center gap-2 font-bold text-slate-900">
              <CalendarDays size={15} className="text-blue-600" />
              {selectedDate ? formatLongDate(selectedDate) : 'Select a date'}
            </p>
            <p className="inline-flex items-center gap-2 font-semibold text-slate-600">
              <Clock3 size={15} className="text-blue-600" />
              {formatSlotLabel(selectedSlotLabel)}
            </p>
          </div>
        </SectionCard>

        <SectionCard label="Patient Info">
          <div className="space-y-2 text-[13px] text-slate-700">
            <p className="inline-flex items-center gap-2 font-bold text-slate-900">
              <User2 size={15} className="text-blue-600" />
              {patientSummary}
            </p>
            <p className="inline-flex items-center gap-2 font-semibold text-slate-600">
              <Building2 size={15} className="text-blue-600" />
              {doctor.department}
            </p>
            <p className="inline-flex items-center gap-2 font-semibold text-slate-600">
              <MapPin size={15} className="text-blue-600" />
              {doctor.room ? `Room ${doctor.room}` : 'Location not listed'}
            </p>
          </div>
        </SectionCard>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Fee Breakdown</p>
          <div className="mt-3 space-y-2 text-[13.5px]">
            <Row label="OPD Consultation Fee" value={`LKR ${quote?.consultationFee ?? doctor.fee ?? 0}`} />
            <Row label="Platform Convenience Fee" value={`LKR ${quote?.platformFee ?? 20}`} />
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <p className="text-[14px] font-extrabold text-slate-900">Total Amount</p>
              <p className="text-[17px] font-extrabold text-blue-700">LKR {totalAmount}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Reason for visit (optional)</p>
          <Textarea
            className="mt-3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Chest pain on exertion for 2 weeks"
          />
          <p className="mt-2 text-[12.5px] text-slate-500">Shared with the doctor before your consultation.</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="h-12 flex-1 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={submitting || !selectedDate || !selectedSlotId} onClick={confirm}>
            {submitting ? 'Confirming...' : 'Confirm Appointment'}
          </Button>
        </div>
      </div>
    </main>
  );
}

function SectionCard({ label, onEdit, children }: { label: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {onEdit ? (
          <button onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-700">
            <Pencil size={12} /> Edit
          </button>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}