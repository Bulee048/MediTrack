import { BookingSteps } from '@/components/ui/booking-steps';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, MoveLeft, QrCode, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookingAppointment } from './types';

import { fetchAppointment } from './appointment.service';

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BookingConfirmedScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<BookingAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setAppointment(null);
    setError('');
    fetchAppointment(id).then(value => { if (active) setAppointment(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load appointment'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const appointmentIdentifier = appointment?.ref ?? '';
  const selectedDate = appointment?.date ?? '';
  const selectedTime = appointment?.slotLabel ?? '';
  const department = appointment?.department ?? '';
  if (loading) return <main data-feature-accessibility className="p-6" role="status">Loading saved appointment…</main>;

  if (!appointment) {
    return (
      <main data-feature-accessibility className="patient-page page-enter">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-line bg-white text-ink-soft shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <MoveLeft size={20} />
          </button>
          <div role="alert" className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-ink">
            <h1 className="text-[0.9375rem] font-extrabold">Confirmation unavailable</h1>
            <p className="mt-1 text-[0.78125rem] font-medium text-ink-soft">{error || 'We could not find the booking details for this appointment.'}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 min-h-[44px] flex-1 border-line text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500 font-bold"
              onClick={() => navigate(`/app/doctors`)}
            >
              Browse Doctors
            </Button>
            <Button
              className="h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={() => navigate('/app/home')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main data-feature-accessibility className="patient-page page-enter">
      <div className="mx-auto w-full max-w-3xl space-y-0">
          <BookingSteps step={4}/>
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[0.8125rem] font-semibold text-ink-muted">Booking</p>
            <h1 className="mt-0.5 page-title font-extrabold tracking-tight text-ink">Booking Confirmed</h1>
          </div>
          <button
            onClick={() => navigate('/app/home')}
            aria-label="Return to patient home"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-soft shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95"
          >
            <MoveLeft size={20} />
          </button>
        </div>

        <div role="status" className="mt-2 rounded-3xl border border-brand-600/20 bg-brand-50 px-5 py-6 text-center shadow-sm">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-brand-600/30 bg-brand-600 text-white shadow-sm">
            <Check size={36} strokeWidth={3} />
          </span>
          <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-tight text-ink">{appointment.status === 'BOOKED' || appointment.status === 'RESCHEDULED' ? 'Appointment Confirmed' : `Appointment ${appointment.status.toLowerCase()}`}</h2>
          <p className="mt-1.5 text-[0.8125rem] text-ink-soft">Your appointment has been saved successfully.</p>
          {appointmentIdentifier ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-600/30 bg-white px-3.5 py-1.5 text-[0.78125rem] font-bold text-brand-600 shadow-sm">
              <Ticket size={15} /> Reference: {appointmentIdentifier}
            </p>
          ) : null}
        </div>

        <div className="mt-4 surface p-5 shadow-sm">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-muted">Appointment Details</p>

          <div className="mt-4 space-y-3.5">
            <DetailRow label="Patient" value={appointment.patientName} />
            <DetailRow label="Doctor" value={appointment.doctorName} />
            <DetailRow label="Department" value={department} />
            <DetailRow label="Date" value={selectedDate ? formatLongDate(selectedDate) : 'Date not listed'} />
            <DetailRow label="Time" value={selectedTime || 'Time not listed'} />
          </div>

          <div className="mt-5 rounded-2xl bg-canvas p-4 border border-line">
            <p className="text-[0.71875rem] font-semibold uppercase tracking-wide text-ink-muted">Appointment reference</p>
            <p className="mt-1 text-[1rem] font-extrabold text-ink">{appointmentIdentifier || 'Pending'}</p>
          </div>
        </div>

        <div className="mt-4 surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <QrCode size={24} />
            </span>
            <div>
              <p className="text-[0.875rem] font-extrabold text-ink">Keep this confirmation</p>
              <p className="mt-0.5 text-[0.78125rem] text-ink-soft">Show this ticket at the counter upon arrival.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-line text-ink-soft hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand-500 font-bold"
            onClick={() => navigate('/app/home')}
          >
            Back to Home
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-brand-600 font-bold text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
            onClick={() => navigate('/app/appointments')}
          >
            My Appointments
          </Button>
        </div>


      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[0.8125rem] font-medium text-ink-muted">{label}</span>
      <span className="text-right text-[0.84375rem] font-bold text-ink">{value}</span>
    </div>
  );
}