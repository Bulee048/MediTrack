import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Bell, CheckCircle2, Clock, Hospital, Pause, RefreshCw, SkipForward, XCircle } from 'lucide-react';
import { PatientShell } from '@/components/layout/PatientShell';
import { Button } from '@/components/ui/button';
import { QueueApiService, type QueueTicketData } from '@/services/queueApi';
import { QueueStatusProgress } from './components/QueueStatusProgress';
import { getAuthErrorStatus, useAuthSession } from '@/config/api';
import { Link, useLocation } from 'react-router-dom';

type QueueStatus = QueueTicketData['status'];

const cardStyle = 'min-w-0 rounded-2xl border border-line bg-white shadow-card';
const labelStyle = 'text-[10px] font-bold uppercase tracking-wide text-ink-soft';
const statusLabels: Record<QueueStatus, string> = {
  WAITING: 'Waiting',
  ALMOST_TURN: 'Almost your turn',
  CALLING: "It's Your Turn!",
  IN_CONSULTATION: 'Consultation in progress',
  HELD: 'Queue ticket on hold',
  SKIPPED: 'Queue ticket skipped',
  COMPLETED: 'Consultation completed',
  CANCELLED: 'Queue ticket cancelled',
};

function formatTime(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function PatientLiveQueue() {
  const location = useLocation();
  const authSession = useAuthSession();
  const { data: ticket, isLoading, isFetching, error, refetch } = useQuery<QueueTicketData | null>({
    queryKey: ['myActiveQueueTicket', authSession],
    queryFn: QueueApiService.getMyActiveTicket,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const isWaiting = ticket?.status === 'WAITING' || ticket?.status === 'ALMOST_TURN';
  const authError = getAuthErrorStatus(error);
  const room = ticket?.doctor?.roomNumber || ticket?.department?.roomNumber;
  const checkedIn = formatTime(ticket?.checkedInAt);
  const updated = formatTime(ticket?.lastUpdated);

  return (
    <PatientShell title="Live OPD Ticket" back action={
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh queue status"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="h-11 w-11 shrink-0 rounded-xl border-line bg-white text-brand-700 shadow-soft hover:bg-brand-50 focus-visible:ring-brand-700"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'motion-safe:animate-spin' : ''}`} />
        </Button>
    }>
    <div className="w-full min-w-0 space-y-4 text-ink">

      {isLoading ? (
        <section className={`${cardStyle} px-5 py-10 text-center`} role="status" aria-live="polite" aria-busy="true">
          <Clock aria-hidden="true" className="mx-auto h-9 w-9 text-teal-700" />
          <h2 className="mt-4 text-lg font-bold">Loading your queue</h2>
          <p className="mt-2 text-sm text-slate-600">Getting the latest information for your ticket.</p>
        </section>
      ) : error && (!ticket || authError) ? (
        <section className={`${cardStyle} border-rose-200 px-5 py-8 text-center`} role="alert">
          <XCircle aria-hidden="true" className="mx-auto h-9 w-9 text-rose-700" />
          <h2 className="mt-4 text-lg font-bold">{authError === 401 ? 'Sign in to view your queue' : authError === 403 ? 'Queue access unavailable' : 'Unable to load your queue'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{authError === 401 ? 'Your session is missing or has expired. Please sign in, then try again.' : authError === 403 ? 'This page is available to patient accounts.' : 'Please check your connection and try again.'}</p>
          {authError === 401 ? (
            <Link to="/login" state={{ from: location.pathname }} className="mt-5 inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">Sign in</Link>
          ) : <Button onClick={() => void refetch()} disabled={isFetching} aria-label="Retry loading queue status"
            className="mt-5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-700">
            <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" /> Try again
          </Button>}
        </section>
      ) : !ticket ? (
        <section className={`${cardStyle} px-5 py-8 text-center`}>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-50 text-teal-700">
            <Hospital aria-hidden="true" className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-lg font-extrabold">You are not in a queue yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Check in to your appointment to receive your queue ticket and waiting-time updates.
          </p>
          <PatientCheckIn key={authSession} authSession={authSession} />
        </section>
      ) : (
        <>
          {error && (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Updates are temporarily unavailable. Your last queue information is shown; use Refresh to try again.
            </p>
          )}
          <section className={`${cardStyle} p-4 min-[360px]:p-5`} aria-labelledby="queue-number-label">
            <div className="text-center">
              <h2 id="queue-number-label" className={labelStyle}>Your queue number</h2>
              <div className="relative mx-auto mt-4 grid h-36 w-36 place-items-center rounded-full border-[6px] border-brand-600 bg-white p-2">
                <p className={`max-w-full break-all font-extrabold leading-tight tracking-tight text-brand-700 ${ticket.ticketNumber.length > 10 ? 'text-[20px]' : ticket.ticketNumber.length > 7 ? 'text-[24px]' : 'text-[30px]'}`}>
                  {ticket.ticketNumber}
                </p>
              </div>
              <p className="mt-5 break-words text-[17px] font-extrabold tracking-tight">
                {ticket.department?.name || 'OPD'}{room ? ` — Room ${room}` : ''}
              </p>
              {ticket.doctor?.name && <p className="mt-1 break-words text-[12.5px] text-ink-soft">{ticket.doctor.name}</p>}
            </div>

            <dl className="mt-5">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-3">
                <dt className="text-[13px] font-bold text-brand-900">Current position</dt>
                <dd className="text-2xl font-extrabold leading-none text-brand-800">
                  {isWaiting ? ticket.currentPosition : <span className="text-[12px] font-semibold">Not waiting</span>}
                </dd>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div className="min-w-0">
                  <dt className={labelStyle}>Now serving</dt>
                  <dd className="mt-1 break-all text-[19px] font-extrabold text-brand-700">{ticket.nowServing || '—'}</dd>
                </div>
                <div className="min-w-0 text-right">
                  <dt className={labelStyle}>Estimated wait</dt>
                  <dd className="mt-1 break-words text-[19px] font-extrabold text-danger-600">
                    {isWaiting ? `~${ticket.estimatedWaitMins} mins` : '—'}
                  </dd>
                </div>
              </div>
            </dl>
            {isWaiting && <p className="mt-3 text-left text-[11.5px] font-medium text-ink-soft">{ticket.patientsAhead} patient{ticket.patientsAhead === 1 ? '' : 's'} ahead of you</p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-brand-800">{statusLabels[ticket.status]}</span>
              {checkedIn && <span className="rounded-full bg-canvas px-3 py-1.5 text-ink-soft">Checked in {checkedIn}</span>}
            </div>
          </section>

          <QueueStatusCard status={ticket.status} room={room} doctorName={ticket.doctor?.name} position={ticket.currentPosition} />
          <QueueStatusProgress status={ticket.status} />
          {['COMPLETED', 'CANCELLED', 'SKIPPED'].includes(ticket.status) && <section className={`${cardStyle} p-5`}><PatientCheckIn key={authSession} authSession={authSession} /></section>}

          {isWaiting && (
            <aside className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 text-center">
              <h2 className="text-sm font-extrabold text-teal-900">Hospital counter check-in</h2>
              <p className="mt-2 text-sm leading-relaxed text-teal-900">Keep this ticket handy. Show your queue number at reception if requested.</p>
            </aside>
          )}
          {updated && <p className="pb-2 text-center text-xs text-slate-600">Last updated {updated}</p>}
        </>
      )}
    </div>
    </PatientShell>
  );
}

function PatientCheckIn({ authSession }: { authSession: number }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState('');
  const appointments = useQuery({
    queryKey: ['queueCheckInAppointments', authSession],
    queryFn: QueueApiService.getMyAppointments,
    refetchInterval: 15000,
  });
  // Appointment dates are calendar dates stored at UTC midnight; queue day is Colombo.
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const today = ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
  const eligible = (appointments.data ?? []).filter(appointment =>
    ['BOOKED', 'RESCHEDULED'].includes(appointment.status) &&
    appointment.appointmentDate.slice(0, 10) === today && !appointment.queueTicket && appointment.doctor
  );
  const appointmentId = eligible.find(appointment => appointment._id === selectedId)?._id ?? eligible[0]?._id;
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myActiveQueueTicket'] }),
      queryClient.invalidateQueries({ queryKey: ['queueCheckInAppointments'] }),
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] }),
    ]);
  };
  const checkIn = useMutation({
    mutationFn: QueueApiService.checkIn,
    onSuccess: refresh,
    onError: async error => {
      if (isAxiosError(error) && error.response?.status === 409) await refresh();
    },
  });
  const error = checkIn.error ?? appointments.error;
  const authError = getAuthErrorStatus(error);
  const duplicate = isAxiosError(error) && error.response?.status === 409;

  return <div className="mt-5 space-y-3 text-left">
    {appointments.isLoading ? <p role="status" className="text-sm text-slate-600">Loading your appointments…</p> : error ? (
      <div role="alert" className="space-y-2 text-sm text-rose-700">
        <p>{authError === 401 ? 'Please sign in again to check in.' : authError === 403 ? 'You do not have permission to check in to this appointment.' : duplicate ? 'This appointment is already checked in. Your queue has been refreshed.' : 'Unable to check in or load appointments. Please try again.'}</p>
        {authError === 401 && <Link to="/login" state={{ from: location.pathname }} className="font-semibold underline">Sign in</Link>}
        {appointments.error && !authError && <Button variant="outline" onClick={() => void appointments.refetch()}>Retry appointments</Button>}
      </div>
    ) : null}
    {!appointments.isLoading && !appointments.error && eligible.length === 0 && <p role="status" className="text-sm text-slate-600">No appointment is available for check-in today. You need a booked appointment for today that has not already been checked in.</p>}
    {eligible.length > 0 && !appointments.error && !authError && <>
      <label htmlFor="queue-check-in-appointment" className="block text-sm font-semibold">Today's appointment</label>
      <select id="queue-check-in-appointment" value={appointmentId} onChange={event => { setSelectedId(event.target.value); checkIn.reset(); }} disabled={checkIn.isPending} className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
        {eligible.map(appointment => <option key={appointment._id} value={appointment._id}>{appointment.timeSlot} — {appointment.doctor?.name}</option>)}
      </select>
      <Button disabled={!appointmentId || checkIn.isPending} onClick={() => { if (appointmentId) checkIn.mutate(appointmentId); }} className="h-auto w-full whitespace-normal rounded-xl bg-teal-700 px-4 py-3 text-white hover:bg-teal-800 focus-visible:ring-teal-700">
        {checkIn.isPending ? 'Checking in…' : 'Check in to my appointment'}
      </Button>
    </>}
  </div>;
}

function QueueStatusCard({ status, room, doctorName, position }: { status: QueueStatus; room?: string; doctorName?: string; position: number }) {
  const calling = status === 'CALLING';
  const almost = status === 'ALMOST_TURN';
  const Icon = calling || status === 'COMPLETED' ? CheckCircle2 : almost ? Bell : status === 'HELD' ? Pause : status === 'SKIPPED' ? SkipForward : status === 'CANCELLED' ? XCircle : status === 'IN_CONSULTATION' ? Hospital : Clock;
  const tones: Record<QueueStatus, string> = {
    WAITING: 'border-brand-200 bg-brand-50/60 text-brand-900',
    ALMOST_TURN: 'border-rose-200 bg-danger-soft text-rose-900',
    CALLING: 'border-brand-700 bg-gradient-to-b from-brand-700 to-brand-800 text-white shadow-card',
    IN_CONSULTATION: 'border-sky-200 bg-info-soft text-sky-900',
    HELD: 'border-amber-200 bg-warn-soft text-amber-950',
    SKIPPED: 'border-rose-200 bg-danger-soft text-rose-900',
    COMPLETED: 'border-brand-200 bg-brand-50 text-brand-900',
    CANCELLED: 'border-line bg-canvas text-ink-soft',
  };
  const description: Record<QueueStatus, string> = {
    WAITING: position === 1 ? 'You are at the front of the waiting queue. Please wait until your ticket is called.' : 'Please wait for your ticket to be called. Your position updates as the queue moves.',
    ALMOST_TURN: `Please be ready near ${room ? `Room ${room}` : 'the OPD room'}. Wait for your ticket to be called before entering.`,
    CALLING: `Please proceed now to ${room ? `Room ${room}` : 'the consultation room'}.`,
    IN_CONSULTATION: 'Your consultation has started. You are no longer in the waiting queue.',
    HELD: 'Your ticket is on hold. Please contact reception for guidance.',
    SKIPPED: 'Your ticket has been skipped. Please speak to reception about the next steps.',
    COMPLETED: 'Your consultation is complete. You are no longer in the queue.',
    CANCELLED: 'This queue ticket has been cancelled. Please contact reception if you need help.',
  };
  return (
    <section
      role="status"
      aria-live={calling ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`min-w-0 rounded-2xl border p-5 ${tones[status]}`}
    >
      <div className={calling || almost ? 'flex flex-col items-center text-center' : 'flex items-start gap-3'}>
        <span className={`grid shrink-0 place-items-center rounded-full ${calling ? 'h-20 w-20 bg-white/10 ring-2 ring-white/25' : almost ? 'h-16 w-16 bg-rose-100 text-rose-700' : 'h-10 w-10 bg-white/80'}`}>
          <Icon aria-hidden="true" className={calling || almost ? 'h-8 w-8' : 'h-5 w-5'} />
        </span>
        <div className="min-w-0">
          <h2 className={`font-extrabold tracking-tight ${calling ? 'mt-5 text-[26px]' : almost ? 'mt-4 text-[22px]' : 'text-[15px]'}`}>{statusLabels[status]}</h2>
          <p className="mt-2 break-words text-[12.5px] leading-relaxed">{description[status]}</p>
        </div>
      </div>
      {calling && <div className="mt-5 rounded-xl bg-white p-4 text-center text-ink shadow-soft">
        <p className="break-words text-[24px] font-extrabold text-brand-700">{room ? `Room ${room}` : 'Consultation room'}</p>
        {doctorName && <p className="mt-2 border-t border-line pt-3 text-[13px] font-bold">{doctorName}</p>}
      </div>}
    </section>
  );
}
