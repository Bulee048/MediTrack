import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Clock, Users, Hospital, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QueueApiService, type QueueTicketData } from '@/services/queueApi';

interface PatientLiveQueueProps {
  onCheckInClick?: () => void;
}

export function PatientLiveQueue({ onCheckInClick }: PatientLiveQueueProps) {
  const [showQr, setShowQr] = useState(false);

  // Poll GET /api/queue/me every 15 seconds using TanStack Query
  const {
    data: ticket,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<QueueTicketData | null>({
    queryKey: ['myActiveQueueTicket'],
    queryFn: QueueApiService.getMyActiveTicket,
    refetchInterval: 15000, // 15 seconds live polling
    staleTime: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-slate-600 font-medium">Loading your queue status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Failed to load queue ticket</h3>
            <p className="text-sm text-red-700 mt-1">{(error as Error).message || 'Please check your connection and try again.'}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="border-red-300 text-red-800 hover:bg-red-100">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className="border-slate-200 shadow-sm text-center p-8">
        <CardContent className="space-y-4 pt-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Hospital className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">You are not in a queue yet</h3>
            <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
              Check in to your appointment to receive a digital queue token and live wait-time updates.
            </p>
          </div>
          {onCheckInClick && (
            <Button onClick={onCheckInClick} className="bg-blue-600 hover:bg-blue-700">
              Check in to my appointment
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const isWaiting = ticket.status === 'WAITING' || ticket.status === 'ALMOST_TURN';
  const isYourTurn = ticket.status === 'CALLING';
  const isAlmostTurn = ticket.status === 'ALMOST_TURN';
  const statusNotice = {
    IN_CONSULTATION: ['Consultation in progress', 'Your consultation has started.'],
    HELD: ['Queue ticket on hold', 'Your ticket is on hold. Please wait for staff instructions.'],
    SKIPPED: ['Queue ticket skipped', 'Your ticket was skipped. Please contact the reception counter.'],
    COMPLETED: ['Consultation completed', 'Your consultation is complete.'],
    CANCELLED: ['Queue ticket cancelled', 'Your ticket has been cancelled.'],
  };
  const notice = ticket.status in statusNotice
    ? statusNotice[ticket.status as keyof typeof statusNotice]
    : undefined;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Almost your turn banner */}
      {isAlmostTurn && !isYourTurn && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-sm animate-pulse">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Almost Your Turn!</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              You have only {ticket.patientsAhead} patient{ticket.patientsAhead === 1 ? '' : 's'} ahead. Please start moving towards {ticket.doctor.roomNumber || 'the OPD room'}.
            </p>
          </div>
        </div>
      )}

      {/* Your turn banner */}
      {isYourTurn && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">It's Your Turn!</h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Please proceed immediately to {ticket.doctor.roomNumber || 'the consultation room'}.
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
          <h4 className="font-bold text-sm">{notice[0]}</h4>
          <p className="text-xs text-slate-600 mt-0.5">{notice[1]}</p>
        </div>
      )}

      {/* Main Ticket Card */}
      <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
        <CardHeader className="text-center pb-2 bg-slate-50 border-b flex flex-row items-center justify-between">
          <div className="text-left">
            <CardTitle className="text-base font-bold text-slate-900">{ticket.department.name}</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {ticket.doctor.name} · Room {ticket.doctor.roomNumber || ticket.department.roomNumber}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="text-slate-500 hover:text-blue-600"
            title="Refresh Queue"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6 text-center">
          {/* QUEUE NUMBER DISPLAY */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Queue Number</span>
            <div className="relative mx-auto mt-3 h-32 w-32 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-blue-600" />
              <span className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" />
              <span className="text-3xl font-extrabold tracking-tight text-blue-700">
                {ticket.ticketNumber}
              </span>
            </div>
          </div>

          {/* DISTINCT METRICS GRID: Now Serving, Position, Est Wait */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            {/* CURRENT POSITION */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Current Position</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {isWaiting ? ticket.currentPosition : '—'}
              </span>
            </div>

            {/* NOW SERVING */}
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <span className="text-[11px] font-medium text-blue-700 block">Now Serving</span>
              <span className="text-lg font-bold text-blue-800 mt-0.5 block">
                {ticket.nowServing || '—'}
              </span>
            </div>

            {/* ESTIMATED WAIT */}
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-[11px] font-medium text-amber-700 block">Est. Wait</span>
              <span className="text-lg font-bold text-amber-800 mt-0.5 block">
                {isWaiting ? `~${ticket.estimatedWaitMins}m` : '—'}
              </span>
            </div>
          </div>

          {/* Patients ahead notice */}
          {isWaiting && <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium pt-1">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{ticket.patientsAhead} patient{ticket.patientsAhead === 1 ? '' : 's'} ahead of you</span>
          </div>}

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge className={
              isYourTurn
                ? 'bg-emerald-600 text-white'
                : isAlmostTurn
                ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white'
            }>
              {ticket.status.replaceAll('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-slate-600 border-slate-200">
              Checked in {new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </CardContent>

        {/* QR Code Section */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Show your digital QR code at the reception counter upon request.
          </p>
          {showQr ? (
            <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 inline-block">
              <QrCode className="h-24 w-24 text-slate-800 mx-auto" />
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowQr(true)} className="text-xs">
              <QrCode className="h-3.5 w-3.5 mr-1.5" /> Show Check-In QR
            </Button>
          )}
        </div>

        {/* Polling status footer */}
        <div className="px-4 py-2 bg-slate-100 border-t flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Live polling every 15s
          </span>
          <span>Updated {new Date(ticket.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </Card>
    </div>
  );
}
