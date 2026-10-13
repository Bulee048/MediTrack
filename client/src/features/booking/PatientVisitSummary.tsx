import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuthSession } from '@/config/api';
import { appointmentsApi } from '@/features/appointments/api/appointmentsApi';
import { QueueApiService } from '@/services/queueApi';
import { LoadingState } from '@/components/ui/feedback';
import { CircularProgress } from '@/features/queue/components/CircularProgress';

export function PatientVisitSummary() {
  const navigate = useNavigate();
  const session = useAuthSession();

  const visits = useQuery({
    queryKey: ['patientAppointments', session, 'upcoming'],
    queryFn: () => appointmentsApi.list('upcoming'),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
  });

  const queue = useQuery({
    queryKey: ['myActiveQueueTicket', session],
    queryFn: QueueApiService.getMyActiveTicket,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    staleTime: 6000,
  });

  const next = [...(visits.data ?? [])].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  )[0];

  const ticket = queue.data;
  const progressPercent = ticket?.patientsAhead !== undefined
    ? Math.max(10, Math.min(100, Math.round(100 - ticket.patientsAhead * 18)))
    : 100;

  return (
    <div className="space-y-5" aria-label="Appointments and Queue Overview">
      {/* 1. NEXT APPOINTMENT CARD (Matching Reference Image) */}
      <div className="relative overflow-hidden rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F8]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#183247]">
            Next Appointment
          </span>
          <span className="inline-flex items-center rounded-full bg-[#E8F8F2] px-3 py-0.5 text-xs font-bold text-[#20A779]">
            Upcoming
          </span>
        </div>

        {visits.isPending ? (
          <div className="mt-4">
            <LoadingState compact label="Loading next visit..." />
          </div>
        ) : visits.isError ? (
          <p className="mt-4 text-xs font-semibold text-[#DE6470]">
            Could not load appointment details.
          </p>
        ) : next ? (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#146C94] to-[#18A6A6] text-white font-black text-lg shadow-sm">
                {next.doctorName ? next.doctorName.replace(/^Dr\.\s*/i, '').charAt(0) : 'D'}
              </div>
              <div>
                <p className="text-base font-black text-[#183247] leading-tight">
                  {next.doctorName}
                </p>
                <p className="text-xs font-semibold text-[#64798B] mt-0.5">
                  {next.department || 'General Medicine'}
                </p>
                <p className="text-xs font-bold text-[#146C94] mt-1 flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  <span>{next.date} · {next.time}</span>
                </p>
              </div>
            </div>

            <Link
              to="/app/appointments"
              className="inline-flex min-h-[38px] items-center justify-center rounded-2xl border border-[#DCE8EE] bg-white px-4 py-2 text-xs font-bold text-[#183247] shadow-xs transition hover:bg-[#F6FAFD] hover:border-[#146C94]/40 active:scale-95"
            >
              View Appointment
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#183247]">No upcoming appointment</p>
              <p className="text-xs font-semibold text-[#64798B] mt-0.5">
                Book an OPD consultation with a verified specialist.
              </p>
            </div>
            <Link
              to="/app/departments"
              className="inline-flex min-h-[38px] items-center justify-center rounded-2xl bg-[#146C94] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#105779] active:scale-95 transition"
            >
              Book Now
            </Link>
          </div>
        )}
      </div>

      {/* 2. SMART LIVE QUEUE HERO CARD (REGISTERED & UNREGISTERED STATES) */}
      {queue.isPending ? (
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm">
          <LoadingState compact label="Checking live queue status..." />
        </div>
      ) : ticket ? (
        /* REGISTERED STATE: Gradient Medical-Blue & Teal Hero Surface */
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#105779] via-[#146C94] to-[#18A6A6] p-6 text-white shadow-xl shadow-[#146C94]/25">
          {/* Subtle Glassmorphic Ambient Highlights */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#18A6A6]/20 blur-xl" />

          {/* Header Row: Label & Status Badge */}
          <div className="relative flex items-center justify-between">
            <span className="text-[0.6875rem] font-extrabold uppercase tracking-widest text-[#DDF3F2]">
              YOUR LIVE QUEUE
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#20A779] shadow-[0_0_8px_#20A779] animate-pulse" />
              Almost Your Turn
            </span>
          </div>

          {/* Main Body: Circular Position + Queue Details */}
          <div className="relative mt-5 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Circular Position Ring */}
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center rounded-full bg-white/10 p-2 backdrop-blur-md border border-white/20 shadow-inner">
                <CircularProgress
                  percentage={progressPercent}
                  size={120}
                  strokeWidth={10}
                  label={`${ticket.currentPosition ?? 1}`}
                  sublabel="Position"
                />
              </div>
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-white/80">
                  Current Position
                </p>
                <p className="text-2xl font-black text-white">
                  {ticket.currentPosition ? `${ticket.currentPosition}${getOrdinal(ticket.currentPosition)}` : '1st'}
                </p>
              </div>
            </div>

            {/* Right: Token, Serving, Ahead & Wait Time */}
            <div className="flex-1 w-full md:w-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-left">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-white/80">Token:</span>
                <span className="text-xl font-black text-white tracking-wide">{ticket.ticketNumber}</span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs font-semibold text-white/90 border-t border-white/10 pt-2.5">
                <div className="flex justify-between">
                  <span>Now Serving:</span>
                  <span className="font-bold text-[#DDF3F2]">{ticket.nowServing || 'CARD-021'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patients Ahead:</span>
                  <span className="font-bold text-white">{ticket.patientsAhead ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Wait:</span>
                  <span className="font-bold text-[#DDF3F2]">~{ticket.estimatedWaitMins || 12} min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="relative mt-6">
            <button
              onClick={() => navigate('/queue')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-3 px-4 text-sm font-black text-[#146C94] shadow-md hover:bg-[#F6FAFD] active:scale-98 transition"
            >
              <span>Track My Queue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* NOT REGISTERED STATE (Matching Reference Image) */
        <div className="relative overflow-hidden rounded-[28px] border border-[#DCE8EE] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF5FB] border border-[#DCE8EE] text-[#146C94]">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#183247]">
                  You&apos;re not in a queue yet
                </h3>
                <p className="text-xs font-medium text-[#64798B] mt-1 leading-relaxed">
                  Check in for your appointment to receive your queue token and track your turn in real time.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/queue')}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#146C94] px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#105779] active:scale-95 transition shrink-0"
            >
              Check In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
