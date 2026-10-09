import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, MoveLeft, QrCode, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookingAppointment, BookingDoctorRef } from './types';

type LocationState = {
  appointment?: BookingAppointment;
  doctor?: BookingDoctorRef;
};

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
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const appointment = state.appointment ?? null;
  const doctor = state.doctor ?? null;

  const appointmentIdentifier = appointment?.ref || appointment?.id || '';
  const selectedDate = appointment?.date ?? '';
  const selectedTime = appointment?.slotLabel ?? '';
  const department = appointment?.department ?? doctor?.department ?? 'Department not listed';
  const room = doctor?.room ?? '';

  const roomLabel = useMemo(() => {
    if (!room) return 'Location not listed';
    return `Room ${room}`;
  }, [room]);

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <MoveLeft size={20} />
          </button>
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <h1 className="text-[15px] font-extrabold">Confirmation unavailable</h1>
            <p className="mt-1 text-[12.5px] font-medium">We could not find the booking details for this appointment.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 min-h-[44px] flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 font-bold"
              onClick={() => navigate(`/patient/doctors/${id}/review`)}
            >
              Back to Review
            </Button>
            <Button
              className="h-12 min-h-[44px] flex-1 bg-blue-600 font-bold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={() => navigate('/patient/home')}
            >
              Back to Home
            </Button>
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
            <h1 className="mt-0.5 text-[22px] font-extrabold uppercase tracking-tight text-slate-900">Booking Confirmed</h1>
          </div>
          <button
            onClick={() => navigate('/patient/home')}
            aria-label="Return to patient home"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <MoveLeft size={20} />
          </button>
        </div>

        <div role="status" className="mt-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center shadow-sm">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-emerald-200 bg-emerald-600 text-white shadow-sm">
            <Check size={36} strokeWidth={3} />
          </span>
          <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-slate-900">Appointment Confirmed</h2>
          <p className="mt-1.5 text-[13px] text-slate-600">Your appointment has been saved successfully.</p>
          {appointmentIdentifier ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-emerald-700 shadow-sm">
              <Ticket size={15} /> Reference: {appointmentIdentifier}
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Appointment Details</p>

          <div className="mt-4 space-y-3.5">
            <DetailRow label="Doctor" value={doctor?.name ?? appointment.doctorName} />
            <DetailRow label="Department" value={department} />
            <DetailRow label="Date" value={selectedDate ? formatLongDate(selectedDate) : 'Date not listed'} />
            <DetailRow label="Time" value={selectedTime || 'Time not listed'} />
            <DetailRow label="Location" value={roomLabel} />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">Queue reference</p>
            <p className="mt-1 text-[16px] font-extrabold text-slate-900">{appointmentIdentifier || 'Pending'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <QrCode size={24} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-slate-900">Keep this confirmation</p>
              <p className="mt-0.5 text-[12.5px] text-slate-600">Show this ticket at the counter upon arrival.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 font-bold"
            onClick={() => navigate('/patient/home')}
          >
            Back to Home
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 bg-blue-600 font-bold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
            onClick={() => navigate('/patient/home')}
          >
            Done
          </Button>
        </div>

        <button
          onClick={() => navigate(`/patient/doctors/${id}/review`, { replace: true })}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center py-2 text-[13.5px] font-bold text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
        >
          Edit booking
        </button>
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] font-medium text-slate-500">{label}</span>
      <span className="text-right text-[13.5px] font-bold text-slate-900">{value}</span>
    </div>
  );
}