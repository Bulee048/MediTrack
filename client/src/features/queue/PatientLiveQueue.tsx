import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock, Hospital, Pause, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueueApiService, type QueueTicketData } from '@/services/queueApi';
import { QueueStatusProgress } from './components/QueueStatusProgress';
import { getAuthErrorStatus, useAuthSession } from '@/config/api';
import { Link, useLocation } from 'react-router-dom';

type QueueStatus = QueueTicketData['status'];

interface PatientLiveQueueProps {
  // Supplied only by a parent with a real appointment/check-in context.
  onCheckInClick?: () => void;
}

const cardStyle = 'min-w-0 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,26,46,0.04),0_8px_24px_-12px_rgba(16,26,46,0.12)]';
const labelStyle = 'text-xs font-semibold uppercase tracking-wide text-slate-600';
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

export function PatientLiveQueue({ onCheckInClick }: PatientLiveQueueProps) {
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
    <div className="mx-auto w-full min-w-0 max-w-md space-y-4 text-slate-900">
      <header className="flex min-w-0 items-center justify-between gap-3 pb-1">
        <h1 className="min-w-0 text-xl font-extrabold tracking-tight">Live OPD Ticket</h1>
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh queue status"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="shrink-0 rounded-xl border-slate-200 bg-white text-teal-700 hover:bg-teal-50 focus-visible:ring-teal-700"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'motion-safe:animate-spin' : ''}`} />
        </Button>
      </header>

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
          {onCheckInClick && (
            <Button onClick={onCheckInClick} className="mt-5 h-auto w-full whitespace-normal rounded-xl bg-teal-700 px-4 py-3 text-white hover:bg-teal-800 focus-visible:ring-teal-700">
              Check in to my appointment
            </Button>
          )}
        </section>
      ) : (
        <>
          {error && (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Updates are temporarily unavailable. Your last queue information is shown; use Refresh to try again.
            </p>
          )}
          <section className={`${cardStyle} px-5 py-6 sm:px-6`} aria-labelledby="queue-number-label">
            <div className="text-center">
              <h2 id="queue-number-label" className={labelStyle}>Your queue number</h2>
              <div className="relative mx-auto mt-4 grid min-h-40 w-40 place-items-center rounded-full border-[6px] border-teal-700 bg-teal-50/40 p-2 ring-4 ring-teal-100/60">
                <p className="max-w-full break-all text-[28px] font-extrabold leading-tight tracking-tight text-teal-700">
                  {ticket.ticketNumber}
                </p>
              </div>
              <p className="mt-5 break-words text-lg font-extrabold tracking-tight">
                {ticket.department?.name || 'OPD'}{room ? ` — Room ${room}` : ''}
              </p>
              {ticket.doctor?.name && <p className="mt-1 break-words text-sm text-slate-600">{ticket.doctor.name}</p>}
            </div>

            <dl className="mt-6">
              <div className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-4">
                <dt className="text-sm font-bold text-teal-900">Current position</dt>
                <dd className="shrink-0 text-2xl font-extrabold leading-none text-teal-800">
                  {isWaiting ? ticket.currentPosition : <span className="text-sm font-semibold">Not waiting</span>}
                </dd>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-b border-slate-200 pb-5">
                <div className="min-w-0">
                  <dt className={labelStyle}>Now serving</dt>
                  <dd className="mt-1 break-all text-xl font-extrabold text-teal-700">{ticket.nowServing || '—'}</dd>
                </div>
                <div className="min-w-0 text-right">
                  <dt className={labelStyle}>Estimated wait</dt>
                  <dd className="mt-1 break-words text-xl font-extrabold text-rose-700">
                    {isWaiting ? `~${ticket.estimatedWaitMins} mins` : '—'}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-800">{statusLabels[ticket.status]}</span>
              {checkedIn && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Checked in {checkedIn}</span>}
            </div>
          </section>

          <QueueStatusCard status={ticket.status} room={room} position={ticket.currentPosition} />
          <QueueStatusProgress status={ticket.status} />

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
  );
}

function QueueStatusCard({ status, room, position }: { status: QueueStatus; room?: string; position: number }) {
  const calling = status === 'CALLING';
  const almost = status === 'ALMOST_TURN';
  const exceptional = ['HELD', 'SKIPPED', 'CANCELLED'].includes(status);
  const Icon = calling || status === 'COMPLETED' ? CheckCircle2 : almost ? Bell : exceptional ? Pause : Clock;
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
      className={`rounded-2xl p-5 ${calling ? 'bg-gradient-to-b from-teal-700 to-teal-900 text-white shadow-lg' : almost ? 'border border-amber-200 bg-amber-50 text-amber-950' : exceptional ? 'border border-slate-300 bg-slate-100 text-slate-900' : 'border border-teal-200 bg-teal-50/60 text-teal-900'}`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${calling ? 'bg-white/15' : 'bg-white/80'}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className={`font-extrabold tracking-tight ${calling ? 'text-2xl' : 'text-lg'}`}>{statusLabels[status]}</h2>
          <p className={`mt-2 break-words text-sm leading-relaxed ${calling ? 'text-white' : ''}`}>{description[status]}</p>
        </div>
      </div>
    </section>
  );
}
