import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ArrowUpRight, Ticket } from 'lucide-react';
import { useAuthSession } from '@/config/api';
import { appointmentsApi } from '@/features/appointments/api/appointmentsApi';
import { QueueApiService } from '@/services/queueApi';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/feedback';
export function PatientVisitSummary() {
  const session = useAuthSession();
  const visits = useQuery({ queryKey: ['patientAppointments', session, 'upcoming'], queryFn: () => appointmentsApi.list('upcoming'), refetchInterval: 15000, refetchIntervalInBackground: true, refetchOnWindowFocus: 'always' });
  const queue = useQuery({ queryKey: ['myActiveQueueTicket', session], queryFn: QueueApiService.getMyActiveTicket, refetchInterval: 15000, refetchIntervalInBackground: true, refetchOnWindowFocus: 'always', staleTime: 10000 });
  const next = [...(visits.data ?? [])].sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  return <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Your visit overview">
    <div className="surface p-5"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><CalendarDays size={18} className="text-brand-700"/>Next appointment</span><Link to="/app/appointments" aria-label="View your appointments" className="icon-button"><ArrowUpRight size={18}/></Link></div>{visits.isPending ? <LoadingState compact label="Checking your appointments"/> : visits.isError ? <p className="mt-4 text-sm text-danger">Could not load appointments. Open Visits to retry.</p> : next ? <div className="mt-3"><p className="text-lg font-bold">{next.doctorName}</p><p className="mt-1 text-sm text-ink-muted">{next.date} · {next.time}</p>{next.familyMemberName && <p className="mt-1 text-sm">For {next.familyMemberName}</p>}</div> : <div className="mt-3"><p className="font-bold">Your next visit starts here</p><p className="mt-1 text-sm text-ink-muted">Choose a department and an available appointment.</p></div>}</div>
    <div className="glass-surface rounded-3xl p-5"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><Ticket size={18} className="text-brand-700"/>Live queue</span><Link to="/queue" aria-label="Open your live queue" className="icon-button"><ArrowUpRight size={18}/></Link></div>{queue.isPending ? <LoadingState compact label="Checking your ticket"/> : queue.isError ? <p className="mt-4 text-sm text-danger">Queue updates are unavailable. Open Queue to retry.</p> : queue.data ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-2xl font-extrabold tabular-nums text-brand-800">{queue.data.ticketNumber}</p><StatusBadge status={queue.data.status}/></div> : <div className="mt-3"><p className="font-bold">No ticket yet</p><p className="mt-1 text-sm text-ink-muted">Check in for your appointment to follow your turn.</p></div>}</div>
  </section>;
}
