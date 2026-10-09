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
  if (loading) return <main className="p-6" role="status">Loading saved appointment…</main>;

  if (!appointment) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#3A465C] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <MoveLeft size={20} />
          </button>
          <div role="alert" className="rounded-2xl border border-[#F5A623]/30 bg-[#FFF6E6] p-5 text-[#101A2E]">
            <h1 className="text-[15px] font-extrabold">Confirmation unavailable</h1>
            <p className="mt-1 text-[12.5px] font-medium text-[#3A465C]">{error || 'We could not find the booking details for this appointment.'}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 min-h-[44px] flex-1 border-[#E6ECF3] text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794] font-bold"
              onClick={() => navigate(`/app/doctors`)}
            >
              Browse Doctors
            </Button>
            <Button
              className="h-12 min-h-[44px] flex-1 bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
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
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-0">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#6C7A90]">Booking</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-[#101A2E]">Booking Confirmed</h1>
          </div>
          <button
            onClick={() => navigate('/app/home')}
            aria-label="Return to patient home"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[#E6ECF3] bg-white text-[#3A465C] shadow-sm transition hover:bg-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] active:scale-95"
          >
            <MoveLeft size={20} />
          </button>
        </div>

        <div role="status" className="mt-2 rounded-3xl border border-[#0E8B7C]/20 bg-[#ECFDF9] px-5 py-6 text-center shadow-sm">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-[#0E8B7C]/30 bg-[#0E8B7C] text-white shadow-sm">
            <Check size={36} strokeWidth={3} />
          </span>
          <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#101A2E]">{appointment.status === 'BOOKED' || appointment.status === 'RESCHEDULED' ? 'Appointment Confirmed' : `Appointment ${appointment.status.toLowerCase()}`}</h2>
          <p className="mt-1.5 text-[13px] text-[#3A465C]">Your appointment has been saved successfully.</p>
          {appointmentIdentifier ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#0E8B7C]/30 bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-[#0E8B7C] shadow-sm">
              <Ticket size={15} /> Reference: {appointmentIdentifier}
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-[#E6ECF3] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6C7A90]">Appointment Details</p>

          <div className="mt-4 space-y-3.5">
            <DetailRow label="Doctor" value={appointment.doctorName} />
            <DetailRow label="Department" value={department} />
            <DetailRow label="Date" value={selectedDate ? formatLongDate(selectedDate) : 'Date not listed'} />
            <DetailRow label="Time" value={selectedTime || 'Time not listed'} />
          </div>

          <div className="mt-5 rounded-2xl bg-[#F4F7FA] p-4 border border-[#E6ECF3]">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#6C7A90]">Appointment reference</p>
            <p className="mt-1 text-[16px] font-extrabold text-[#101A2E]">{appointmentIdentifier || 'Pending'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#E6ECF3] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ECFDF9] text-[#0E8B7C]">
              <QrCode size={24} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-[#101A2E]">Keep this confirmation</p>
              <p className="mt-0.5 text-[12.5px] text-[#3A465C]">Show this ticket at the counter upon arrival.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-[#E6ECF3] text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794] font-bold"
            onClick={() => navigate('/app/home')}
          >
            Back to Home
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
            onClick={() => navigate('/app/home')}
          >
            Done
          </Button>
        </div>


      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] font-medium text-[#6C7A90]">{label}</span>
      <span className="text-right text-[13.5px] font-bold text-[#101A2E]">{value}</span>
    </div>
  );
}