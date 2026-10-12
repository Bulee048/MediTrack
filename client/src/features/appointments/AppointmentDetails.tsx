import { useAuthSession } from '@/config/api';
import { hospitalDate } from '@/lib/hospitalDate';
import { QueueApiService } from '@/services/queueApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Clock3 } from 'lucide-react';
import { FeaturePageContent } from '@/components/FeaturePageContent';
import { Button } from '@/components/ui/button';
import { appointmentsApi } from './api/appointmentsApi';
import type { Appointment } from './types';
import { fmtMediumDate, inr, STATUS_STYLES } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function AppointmentDetails() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const pending = useRef(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const session = useAuthSession();
  const { data: appt, isPending: loading, error: queryError, refetch } = useQuery<Appointment>({
    queryKey: ['patientAppointment', session, id], queryFn: () => appointmentsApi.detail(id), enabled: Boolean(id),
    refetchInterval: 15000, refetchIntervalInBackground: true, refetchOnWindowFocus: 'always',
  });
  const error = queryError?.message ?? '';

  if (error) return <FeaturePageContent title="Appointment Details" back><p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm">{error}</p><button type="button" className="mt-3 underline" onClick={() => void refetch()}>Try again</button></FeaturePageContent>;

  if (loading || !appt) {
    return (
      <FeaturePageContent title="Appointment Details" back>
        <div role="status" className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-ink-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-[0.8125rem] font-medium">Loading details…</p>
        </div>
      </FeaturePageContent>
    );
  }

  const st = STATUS_STYLES[appt.status] ?? STATUS_STYLES.confirmed;
  const paySt = STATUS_STYLES[appt.paymentStatus] ?? { label: 'Not provided', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  const cancelled = appt.status === 'cancelled';
  const active = Boolean(appt.doctorId) && !appt.checkedIn && (appt.status === 'confirmed' || appt.status === 'rescheduled');

  const canCheckIn = active && appt.date === hospitalDate();
  const handleCheckIn = async () => {
    if (appt.checkedIn) { navigate('/queue'); return; }
    if (!canCheckIn || pending.current) return;
    pending.current = true; setCheckingIn(true); setCheckInError('');
    try {
      await QueueApiService.checkIn(appt.id);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['myActiveQueueTicket'] }),
        queryClient.invalidateQueries({ queryKey: ['myNotifications'] })]);
      navigate('/queue');
    } catch (e) { setCheckInError((e as Error).message); }
    finally { pending.current = false; setCheckingIn(false); }
  };


  return (
    <FeaturePageContent title="Appointment Details" back>
      <div className="surface p-5 shadow-card">
        {/* Status and Reference */}
        <div className="flex items-center justify-between">
          <span className={cn('chip border text-xs font-bold px-2.5 py-0.5', st.cls)}>
            {st.label}
          </span>
          <span className="text-[0.75rem] font-semibold text-ink-muted">ID: #{appt.ref}</span>
        </div>

        {/* Doctor Information Card */}
        <div className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3.5 text-center">
          <p className="text-[1.03125rem] font-extrabold text-ink">{appt.doctorName}</p>
          <p className="mt-0.5 text-[0.78125rem] text-ink-muted">
            {appt.doctor?.title ?? appt.department} ·{' '}
            {appt.doctor?.rating ? `${appt.doctor.rating.toFixed(1)} ★` : appt.room}
          </p>
        </div>

        {/* Hospital Location */}
        <div className="mt-4">
          <p className="label">Hospital Location</p>
          <div className="mt-2.5 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 size={17} />
            </span>
            <div>
              <p className="text-[0.875rem] font-extrabold text-ink">{appt.department}</p>
              <p className="mt-0.5 text-[0.75rem] text-ink-muted">
                Room {appt.room}
              </p>
            </div>
          </div>
        </div>

        {/* Date and Payment Grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <p className="label">Appointment Date</p>
            <p className="mt-1 text-[0.84375rem] font-extrabold text-ink">{fmtMediumDate(appt.date)}</p>
            <p className="text-[0.78125rem] text-ink-muted">{appt.time}</p>
          </div>
          <div>
            <p className="label">Payment Status</p>
            <p className="mt-1">
              <span className={cn('chip border text-xs font-bold px-2 py-0.5', paySt.cls)}>
                {paySt.label}
              </span>
            </p>
            <p className="mt-1 text-[0.8125rem] font-bold text-ink">{appt.paymentStatus === 'unknown' ? 'Payment information unavailable' : inr(appt.amount)}</p>
          </div>
        </div>

        {/* Family Member Badge */}
        {!appt.bookedForSelf && appt.familyMemberName && (
          <p className="mt-4 rounded-xl bg-canvas px-3.5 py-2.5 text-[0.78125rem] text-ink-muted">
            Booked for family member:{' '}
            <span className="font-extrabold text-ink">{appt.familyMemberName}</span>
          </p>
        )}

        {/* Reason for Visit */}
        {appt.reason && (
          <div className="mt-4">
            <p className="label">Reason for visit</p>
            <p className="mt-1.5 text-[0.8125rem] text-ink-soft leading-relaxed">{appt.reason}</p>
          </div>
        )}

        {/* Cancellation Reason if cancelled */}
        {cancelled && appt.cancelReason && (
          <div className="mt-4 rounded-xl bg-danger-soft p-3 border border-danger/20">
            <p className="text-xs font-bold uppercase tracking-wide text-danger-600">
              Cancellation Note
            </p>
            <p className="mt-1 text-[0.78125rem] text-danger-600 font-medium">{appt.cancelReason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {(canCheckIn || appt.checkedIn) && (
          <Button
            size="lg"
            className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
            disabled={checkingIn}
            onClick={() => void handleCheckIn()}
          >
            <Clock3 size={17} className="mr-2" />
            {checkingIn ? 'Checking in…' : appt.checkedIn ? 'View My Queue' : 'Check In to OPD Queue'}
          </Button>
        )}

        {active && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full font-bold"
              disabled={checkingIn}
              onClick={() => navigate(`/app/appointments/${appt.id}/reschedule`)}
            >
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-danger text-danger-600 hover:bg-danger-soft font-bold"
              disabled={checkingIn}
              onClick={() => navigate(`/app/appointments/${appt.id}/cancel`)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {checkInError && <p role="alert" className="mt-4 text-sm text-danger-600">{checkInError}</p>}
      {appt.checkedIn && <p role="status" className="mt-4 text-sm text-ink-muted">Checked-in appointments are managed through the OPD queue.</p>}
    </FeaturePageContent>
  );
}
