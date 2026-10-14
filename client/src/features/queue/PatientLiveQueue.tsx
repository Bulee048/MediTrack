import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Hospital,
  RefreshCw,
  QrCode,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueueApiService, type QueueTicketData } from '@/services/queueApi';
import { getAuthErrorStatus, useAuthSession } from '@/config/api';
import { CircularProgress } from './components/CircularProgress';
import { QueueProgressTimeline } from './components/QueueProgressTimeline';
import { DigitalQueueTicketModal } from './components/DigitalQueueTicketModal';
import { ApproachingTurnCard, CalledTurnCard } from './components/TurnStatusAlerts';
import { LoadingState } from '@/components/ui/feedback';

type PatientTab = 'dashboard' | 'ticket' | 'live' | 'progress';

export function PatientLiveQueue({ onCheckInClick }: { onCheckInClick?: () => void }) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PatientTab>('dashboard');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const { data: ticket, isLoading, isFetching, error, refetch } = useQuery<QueueTicketData | null>({
    queryKey: ['myActiveQueueTicket', authSession],
    queryFn: QueueApiService.getMyActiveTicket,
    refetchInterval: 12000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    staleTime: 8000,
  });

  const cancel = useMutation({
    mutationFn: (ticketId: string) => QueueApiService.cancelTicket(ticketId),
    onMutate: () => {
      setCancelError('');
      setCancelSuccess(false);
    },
    onSuccess: async () => {
      setCancelSuccess(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myActiveQueueTicket'] }),
        queryClient.invalidateQueries({ queryKey: ['patientAppointment'] }),
        queryClient.invalidateQueries({ queryKey: ['patientAppointments'] }),
        queryClient.invalidateQueries({ queryKey: ['myNotifications'] }),
      ]);
    },
    onError: (err: Error) => setCancelError(err.message),
  });

  const authError = getAuthErrorStatus(error);
  const room = ticket?.doctor?.roomNumber || ticket?.department?.roomNumber || 'Room 03';
  const isCalling = ticket?.status === 'CALLING';
  const isAlmostTurn = ticket?.status === 'ALMOST_TURN';
  const canCancel = ticket?.status === 'WAITING' || ticket?.status === 'HELD';

  // Compute animated progress:
  // Position 1 means 80-90% progressed toward being seen; total queue size approximation
  const position = ticket?.currentPosition ?? 1;
  const ahead = ticket?.patientsAhead ?? 0;
  const totalInLine = position + ahead;
  const progressPercent = totalInLine > 0 ? Math.round(Math.max(15, ((totalInLine - position + 1) / totalInLine) * 100)) : 24;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-md py-12 text-center">
        <LoadingState label="Loading your CareFlow queue ticket..." />
      </div>
    );
  }

  if (error && (!ticket || authError)) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#DCE8EE] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DE6470]/10 text-[#DE6470]">
          <ShieldAlert size={28} />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#183247]">
          {authError === 401 ? 'Please Sign In' : 'Queue Access Unavailable'}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#64798B]">
          {authError === 401
            ? 'Sign in with your patient account to view real-time OPD tracking.'
            : 'Unable to connect to the hospital queue server. Please check your internet.'}
        </p>
        <Button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-6 rounded-2xl bg-[#146C94] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#105779]"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#DCE8EE] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18A6A6] to-[#146C94] text-white shadow-md">
          <Hospital size={32} />
        </div>
        <h2 className="mt-5 text-xl font-black text-[#183247]">You are not in a queue yet</h2>
        <p className="mt-2 text-xs leading-relaxed text-[#64798B]">
          Check in to your today&apos;s appointment to receive your live digital token and turn notifications.
        </p>
        {onCheckInClick ? (
          <Button
            onClick={onCheckInClick}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] py-3 text-sm font-bold text-white shadow-md"
          >
            Check in to my appointment
          </Button>
        ) : (
          <Button
            onClick={() => { window.location.href = '/app/appointments'; }}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] py-3 text-sm font-bold text-white shadow-md"
          >
            Go to Appointments
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 pb-20">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#18A6A6] via-[#146C94] to-[#105779] text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 4v16m-8-8h16" />
            </svg>
          </span>
          <div>
            <h1 className="text-base font-black text-[#183247] leading-none">CareFlow</h1>
            <p className="text-[0.6875rem] font-semibold text-[#64798B]">Smart OPD Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8F2] px-2.5 py-1 text-[0.6875rem] font-bold text-[#20A779]">
            <Radio size={12} className="animate-pulse" />
            Live
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh Queue"
            className="h-8 w-8 rounded-full border border-[#DCE8EE] text-[#146C94]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Screen 6: It's Your Turn Urgent Banner */}
      {isCalling && (
        <CalledTurnCard
          ticket={ticket}
          onAcknowledge={() => setActiveTab('live')}
        />
      )}

      {/* Screen 5: Almost Your Turn Warning Banner */}
      {isAlmostTurn && !isCalling && (
        <ApproachingTurnCard ticket={ticket} />
      )}

      {/* Screen Selector Tabs (Screen 1 vs Screen 3 vs Screen 4) */}
      <div className="flex rounded-2xl bg-[#EBF2F6] p-1 text-xs font-bold text-[#64798B]">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 rounded-xl py-2 transition-all ${
            activeTab === 'dashboard' ? 'bg-white text-[#146C94] shadow-sm' : 'hover:text-[#183247]'
          }`}
        >
          My Queue
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex-1 rounded-xl py-2 transition-all ${
            activeTab === 'live' ? 'bg-white text-[#146C94] shadow-sm' : 'hover:text-[#183247]'
          }`}
        >
          Live Tracking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={`flex-1 rounded-xl py-2 transition-all ${
            activeTab === 'progress' ? 'bg-white text-[#146C94] shadow-sm' : 'hover:text-[#183247]'
          }`}
        >
          Progress
        </button>
      </div>

      {/* SCREEN 1: MY QUEUE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Patient greeting & Doctor Info Card */}
          <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">
                  Assigned OPD Visit
                </p>
                <h2 className="text-sm font-extrabold text-[#183247]">
                  {ticket.department?.name || 'General Medicine'}
                </h2>
                <p className="text-xs font-semibold text-[#146C94]">
                  {ticket.doctor?.name || 'Assigned Consultant'} · Room {room}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(true)}
                className="flex items-center gap-1 rounded-2xl border border-[#DCE8EE] bg-[#F6FAFD] px-3 py-2 text-xs font-bold text-[#146C94] hover:bg-[#EBF5FB]"
              >
                <QrCode size={16} />
                <span>Ticket</span>
              </button>
            </div>

            {/* Token Highlight Banner */}
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] p-5 text-center text-white shadow-md shadow-[#146C94]/20">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                Your Queue Number
              </p>
              <p className="mt-1 text-4xl font-black tracking-tight">{ticket.ticketNumber}</p>
            </div>

            {/* Queue 3-Metric Mini Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-[#DCE8EE] bg-[#F6FAFD] p-2.5">
                <p className="text-[0.625rem] font-bold uppercase text-[#64798B]">Position</p>
                <p className="text-base font-black text-[#183247]">{ticket.currentPosition}</p>
              </div>
              <div className="rounded-2xl border border-[#DCE8EE] bg-[#F6FAFD] p-2.5">
                <p className="text-[0.625rem] font-bold uppercase text-[#64798B]">Now Serving</p>
                <p className="text-base font-black text-[#146C94]">{ticket.nowServing || '—'}</p>
              </div>
              <div className="rounded-2xl border border-[#DCE8EE] bg-[#F6FAFD] p-2.5">
                <p className="text-[0.625rem] font-bold uppercase text-[#64798B]">Ahead</p>
                <p className="text-base font-black text-[#183247]">{ticket.patientsAhead ?? 0}</p>
              </div>
            </div>

            {/* Progress Circular & Wait */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#DCE8EE] bg-[#F6FAFD] p-4">
              <div className="flex items-center gap-3">
                <CircularProgress
                  percentage={progressPercent}
                  size={104}
                  strokeWidth={10}
                  label={`${progressPercent}%`}
                />
                <div>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">
                    Queue Progress
                  </p>
                  <p className="text-xs font-bold text-[#20A779] flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#20A779]" />
                    Queue is moving
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">
                  Est. Wait
                </p>
                <p className="text-lg font-black text-[#146C94]">~{ticket.estimatedWaitMins} min</p>
              </div>
            </div>

            {/* Track My Queue CTA */}
            <Button
              onClick={() => setActiveTab('live')}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95"
            >
              Track My Queue →
            </Button>
          </div>
        </div>
      )}

      {/* SCREEN 3: LIVE QUEUE TRACKING */}
      {activeTab === 'live' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Token Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-[#DCE8EE] bg-white p-4 shadow-sm text-center">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">
                Now Serving
              </p>
              <p className="mt-1 text-2xl font-black text-[#146C94]">
                {ticket.nowServing || '—'}
              </p>
            </div>
            <div className="rounded-3xl border border-[#DCE8EE] bg-gradient-to-br from-[#146C94] to-[#18A6A6] p-4 text-center text-white shadow-sm">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-white/80">
                Your Token
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight">{ticket.ticketNumber}</p>
            </div>
          </div>

          {/* Large Live Circular Indicator */}
          <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm flex flex-col items-center text-center">
            <CircularProgress
              percentage={progressPercent}
              size={190}
              strokeWidth={14}
              label={String(ticket.currentPosition)}
              sublabel={`${ticket.patientsAhead ?? 0} Patients Ahead`}
            />

            <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[#EBF5FB] px-4 py-1 text-xs font-bold text-[#146C94]">
              <Clock size={14} />
              <span>Est. Wait: ~{ticket.estimatedWaitMins} min</span>
            </div>

            {/* Horizontal Mini Status Icons */}
            <div className="mt-6 flex w-full justify-between border-t border-[#DCE8EE] pt-5 text-center text-[0.6875rem] font-bold">
              <div>
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#20A779] text-white">
                  ✓
                </span>
                <span className="mt-1 block text-[#183247]">Checked In</span>
              </div>
              <div>
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#146C94] text-white">
                  {ticket.currentPosition}
                </span>
                <span className="mt-1 block text-[#146C94]">Waiting</span>
              </div>
              <div>
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#F6FAFD] text-[#8EA3B0] border border-[#CBDCE6]">
                  🔔
                </span>
                <span className="mt-1 block text-[#8EA3B0]">Almost Turn</span>
              </div>
              <div>
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#F6FAFD] text-[#8EA3B0] border border-[#CBDCE6]">
                  📢
                </span>
                <span className="mt-1 block text-[#8EA3B0]">Called</span>
              </div>
            </div>
          </div>

          {/* Recent Queue Activity */}
          <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64798B]">
              Recent Updates
            </h3>
            <div className="mt-3 divide-y divide-[#EBF2F6] text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="font-bold text-[#183247]">{ticket.nowServing || ticket.ticketNumber}</span>
                <span className="text-[#20A779] font-semibold">Now Serving</span>
                <span className="text-[#64798B]">Just now</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-bold text-[#183247]">{ticket.ticketNumber}</span>
                <span className="text-[#146C94] font-semibold">Position {ticket.currentPosition}</span>
                <span className="text-[#64798B]">Live order</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: QUEUE PROGRESS TIMELINE */}
      {activeTab === 'progress' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <QueueProgressTimeline
            status={ticket.status}
            currentPosition={ticket.currentPosition}
            departmentName={ticket.department?.name}
          />
        </div>
      )}

      {/* Cancel Queue Ticket Option (HCI Safety Action) */}
      {canCancel && (
        <div className="pt-2 text-center">
          <Button
            variant="ghost"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(ticket.ticketId)}
            className="text-xs font-bold text-[#DE6470] hover:bg-[#FDECEF]"
          >
            {cancel.isPending ? 'Cancelling...' : 'Cancel queue ticket'}
          </Button>
          {cancelError && <p className="mt-1 text-xs text-[#DE6470]">{cancelError}</p>}
          {cancelSuccess && (
            <p className="mt-1 text-xs text-[#20A779]">Queue ticket cancelled successfully.</p>
          )}
        </div>
      )}

      {/* SCREEN 2: DIGITAL QUEUE TICKET MODAL */}
      {showTicketModal && (
        <DigitalQueueTicketModal
          ticket={ticket}
          onClose={() => setShowTicketModal(false)}
          onViewLive={() => setActiveTab('live')}
        />
      )}
    </div>
  );
}
