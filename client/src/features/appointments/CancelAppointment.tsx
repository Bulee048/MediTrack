import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { FeaturePageContent } from '@/components/FeaturePageContent';
import { Button } from '@/components/ui/button';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { appointmentsApi } from './api/appointmentsApi';
import type { Appointment } from './types';
import { fmtMediumDate, inr } from '@/lib/formatters';

const POLICY =
  'Cancellation releases the reserved slot. Refund information is not provided by the current backend.';

export default function CancelAppointment() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setAppt(null); setError('');
    setDone(false);
    appointmentsApi
      .detail(id)
      .then((appointment) => { if (active) setAppt(appointment); })
      .catch((e) => { if (active) setError((e as Error).message); });
    return () => { active = false; };
  }, [id]);

  const executeCancel = async () => {
    setBusy(true);
    try {
      await appointmentsApi.cancel(id);
      setDone(true);
      toast.success('Appointment cancelled', {
        description: 'Slot released.',
      });
    } catch (e) {
      toast.error((e as Error).message || 'Could not cancel appointment');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <FeaturePageContent title="Cancel Appointment" back><p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm">{error}</p></FeaturePageContent>;

  if (!appt) {
    return (
      <FeaturePageContent title="Cancel Appointment" back>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-ink-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-[13px] font-medium">Loading details…</p>
        </div>
      </FeaturePageContent>
    );
  }

  return (
    <FeaturePageContent title="Cancel Appointment" back>
      {(appt.checkedIn || !['confirmed', 'rescheduled'].includes(appt.status)) && <p role="status" className="mb-4 text-sm text-ink-muted">This appointment cannot be changed here. Checked-in visits are managed through the OPD queue.</p>}
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 border border-danger/20">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger-600" />
        <p className="text-[13px] font-semibold leading-relaxed text-danger-600">
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </p>
      </div>

      {/* Appointment Summary */}
      <div className="mt-4 rounded-2xl border border-line bg-white p-5 text-center shadow-card">
        <p className="label">Appointment Summary</p>
        <p className="mt-2 text-[16px] font-extrabold text-ink">{appt.doctorName}</p>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          {appt.department} · {appt.room}
        </p>
        <div className="mt-4 flex items-end justify-between border-t border-line pt-4 text-left">
          <div>
            <p className="label">Date</p>
            <p className="mt-0.5 text-[13.5px] font-extrabold text-ink">{fmtMediumDate(appt.date)}</p>
          </div>
          <div className="text-right">
            <p className="label">Time</p>
            <p className="mt-0.5 text-[13.5px] font-extrabold text-ink">{appt.time}</p>
          </div>
        </div>
      </div>

      {/* Policy Card */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand-300 bg-brand-50/70 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <p className="text-[13px] font-bold text-brand-700">Cancellation &amp; Refund Policy</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
            {POLICY}{' '}
            {appt.paymentStatus === 'paid' ? `Amount paid: ${inr(appt.amount)}.` : ''}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {!done && (
        <div className="mt-7 space-y-3">
          <Button
            variant="destructive"
            size="lg"
            className="w-full font-bold shadow-soft"
            disabled={busy || appt.checkedIn || !['confirmed', 'rescheduled'].includes(appt.status)}
            onClick={() => setConfirmDialogOpen(true)}
          >
            {busy ? 'Cancelling…' : 'Yes, Cancel Appointment'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full font-bold"
            onClick={() => navigate(-1)}
          >
            Keep Appointment
          </Button>
        </div>
      )}

      {/* Cancellation Success State */}
      {done && (
        <div className="mt-6 rounded-2xl border border-success/40 bg-success-soft p-5 text-center animate-in fade-in">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <p className="text-[14px] font-extrabold text-success">
            Appointment cancelled successfully
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 font-bold"
            onClick={() => navigate('/app/appointments', { replace: true })}
          >
            Back to My Appointments
          </Button>
        </div>
      )}

      {/* MANDATORY Confirmation Dialog (AlertDialog) */}
      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirm Cancellation"
        description={`Are you sure you want to cancel your appointment with ${appt.doctorName} on ${fmtMediumDate(appt.date)} at ${appt.time}? This cannot be undone.`}
        confirmText="Confirm Cancel"
        cancelText="Nevermind"
        variant="destructive"
        onConfirm={executeCancel}
      />
    </FeaturePageContent>
  );
}
