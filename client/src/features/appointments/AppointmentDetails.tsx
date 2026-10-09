import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Clock3, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneShell } from '@/components/PhoneShell';
import { Button } from '@/components/ui/button';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { appointmentsApi } from './api/appointmentsApi';
import type { Appointment } from './types';
import { fmtMediumDate, inr, STATUS_STYLES } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function AppointmentDetails() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    appointmentsApi
      .detail(id)
      .then(setAppt)
      .catch(() => navigate('/app/appointments', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading || !appt) {
    return (
      <PhoneShell title="Appointment Details" back>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-ink-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-[13px] font-medium">Loading details…</p>
        </div>
      </PhoneShell>
    );
  }

  const st = STATUS_STYLES[appt.status] ?? STATUS_STYLES.confirmed;
  const paySt = STATUS_STYLES[appt.paymentStatus] ?? STATUS_STYLES.pending;
  const inQueue = Boolean(appt.queueEntry && appt.queueEntry.status === 'waiting');
  const cancelled = appt.status === 'cancelled';

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const updated = await appointmentsApi.checkIn(appt.id);
      setAppt(updated);
      toast.success('Checked into OPD Live Queue', {
        description: `Your token is ${updated.queueEntry?.token}.`,
      });
    } catch {
      toast.error('Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const confirmFastCancel = async () => {
    try {
      const { appointment } = await appointmentsApi.cancel(
        appt.id,
        'Cancelled by patient directly from details screen'
      );
      setAppt(appointment);
      toast.success('Appointment cancelled', {
        description: 'Your slot has been released.',
      });
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  return (
    <PhoneShell title="Appointment Details" back>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        {/* Status and Reference */}
        <div className="flex items-center justify-between">
          <span className={cn('chip border text-[11px] font-bold px-2.5 py-0.5', st.cls)}>
            {st.label}
          </span>
          <span className="text-[12px] font-semibold text-ink-muted">ID: #{appt.ref}</span>
        </div>

        {/* Doctor Information Card */}
        <div className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3.5 text-center">
          <p className="text-[16.5px] font-extrabold text-ink">{appt.doctorName}</p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            {appt.doctor?.title ?? appt.department} ·{' '}
            {appt.doctor?.rating ? `${appt.doctor.rating.toFixed(1)} ★` : appt.room}
          </p>
        </div>

        {/* Live Queue Status Widget */}
        {inQueue && appt.queueEntry && (
          <div className="mt-4 rounded-2xl border border-brand-300 bg-brand-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-wide text-brand-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-brand-600" />
                </span>
                Live Queue Status
              </span>
              <span className="text-[14px] font-extrabold text-brand-700">
                {appt.queueEntry.token}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-brand-700/70">
                  Current turn
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold text-brand-700">
                  {appt.queueEntry.nowServing || '—'}
                </p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-brand-700/70">
                  Your position
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold text-brand-700">
                  #{String(appt.queueEntry.position).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-brand-700/70">
                  Est. wait
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold text-danger-600">
                  ~{appt.queueEntry.estWaitMins} mins
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hospital Location */}
        <div className="mt-4">
          <p className="label">Hospital Location</p>
          <div className="mt-2.5 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 size={17} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-ink">Colombo General Hospital</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                OPD Wing B, Regent Street, Colombo 08
              </p>
            </div>
          </div>
        </div>

        {/* Date and Payment Grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <p className="label">Appointment Date</p>
            <p className="mt-1 text-[13.5px] font-extrabold text-ink">{fmtMediumDate(appt.date)}</p>
            <p className="text-[12.5px] text-ink-muted">{appt.time}</p>
          </div>
          <div>
            <p className="label">Payment Status</p>
            <p className="mt-1">
              <span className={cn('chip border text-[11px] font-bold px-2 py-0.5', paySt.cls)}>
                {paySt.label}
              </span>
            </p>
            <p className="mt-1 text-[13px] font-bold text-ink">{inr(appt.amount)}</p>
          </div>
        </div>

        {/* Family Member Badge */}
        {!appt.bookedForSelf && appt.familyMemberName && (
          <p className="mt-4 rounded-xl bg-canvas px-3.5 py-2.5 text-[12.5px] text-ink-muted">
            Booked for family member:{' '}
            <span className="font-extrabold text-ink">{appt.familyMemberName}</span>
          </p>
        )}

        {/* Reason for Visit */}
        {appt.reason && (
          <div className="mt-4">
            <p className="label">Reason for visit</p>
            <p className="mt-1.5 text-[13px] text-ink-soft leading-relaxed">{appt.reason}</p>
          </div>
        )}

        {/* Cancellation Reason if cancelled */}
        {cancelled && appt.cancelReason && (
          <div className="mt-4 rounded-xl bg-danger-soft p-3 border border-danger/20">
            <p className="text-[11px] font-bold uppercase tracking-wide text-danger-600">
              Cancellation Note
            </p>
            <p className="mt-1 text-[12.5px] text-danger-600 font-medium">{appt.cancelReason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {appt.status === 'confirmed' &&
          (inQueue ? (
            <div className="rounded-xl bg-brand-50 p-3 text-center border border-brand-200">
              <p className="text-[13px] font-bold text-brand-700 flex items-center justify-center gap-1.5">
                <Timer size={16} /> Token {appt.queueEntry?.token} is live in queue
              </p>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
              disabled={checkingIn}
              onClick={handleCheckIn}
            >
              <Clock3 size={17} className="mr-2" />
              {checkingIn ? 'Joining Live Queue…' : 'Join OPD Queue (Check In)'}
            </Button>
          ))}

        {!cancelled && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full font-bold"
              onClick={() => navigate(`/app/appointments/${appt.id}/reschedule`)}
            >
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-danger text-danger-600 hover:bg-danger-soft font-bold"
              onClick={() => navigate(`/app/appointments/${appt.id}/cancel`)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation AlertDialog for cancellation */}
      <AlertDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel Appointment"
        description={`Are you sure you want to cancel your appointment with ${appt.doctorName} on ${fmtMediumDate(appt.date)}? This action cannot be undone.`}
        confirmText="Yes, Cancel"
        cancelText="Keep Appointment"
        variant="destructive"
        onConfirm={confirmFastCancel}
      />
    </PhoneShell>
  );
}
