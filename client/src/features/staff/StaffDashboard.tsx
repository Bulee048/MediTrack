import StaffShell, { staffPages } from './StaffShell';
import { hospitalDate } from '@/lib/hospitalDate';
import StaffTools from './StaffTools';
import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';

import { apiClient, getAccessToken, useAuthSession } from '@/config/api';

import { fetchCurrentUser, logoutPatient } from '@/features/auth/auth.service';

import { StaffQueueApiService } from '@/services/staffQueueApi';

import StaffAccount, { useStaffProfile } from './StaffAccount';
import TeamAccess from './TeamAccess';
import DoctorRoster from './DoctorRoster';
import { useHospitalQueueDate } from './useHospitalQueueDate';
import { QueueCallControl } from './QueueCallControl';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState, EmptyState, Notice, SectionHeader } from '@/components/ui/feedback';
import { Button } from '@/components/ui/button';
import { StaffAppointmentList, type StaffAppointment as Appointment } from './StaffAppointmentList';
import { CalendarDays, Clock3, Stethoscope, CheckCircle2, Activity, Users, UserPlus, BarChart3 } from 'lucide-react';


export default function StaffDashboard() {

  const session = useAuthSession();
  const path=useLocation().pathname;
  const { date, setDate, today } = useHospitalQueueDate();
  const [appointmentStatus,setAppointmentStatus]=useState('');
  const [queueStatus,setQueueStatus]=useState('');
  const flowView=path==='/staff/flow';
  const queueView=path==='/staff/queue'||flowView||path.startsWith('/staff/queue/');
  const status=queueView?queueStatus:appointmentStatus;
  const setStatus=queueView?setQueueStatus:setAppointmentStatus;

  const cache = useQueryClient();

  const [scopeParams,setScopeParams]=useSearchParams();
  const doctorId=scopeParams.get('doctorId')??'';
  const setDoctorId=(id:string)=>{const next=new URLSearchParams(scopeParams);if(id)next.set('doctorId',id);else next.delete('doctorId');setScopeParams(next);};

  const [search, setSearch] = useState('');

  const [feedback, setFeedback] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);

  const account = useQuery({ queryKey: ['staffAccount', session], queryFn: fetchCurrentUser, enabled: Boolean(getAccessToken()) });

  const authorized = ['STAFF', 'ADMIN'].includes(account.data?.user.role ?? '');

  const profile=useStaffProfile(authorized);
  const refresh=(profile.data?.staffPreferences?.refreshSeconds??15)*1000;
  const appointments = useQuery({ queryKey: ['staffAppointments', session, date], queryFn: async () => (await apiClient.get<{data:{appointments:Appointment[]}}>('/appointments',{params:{date}})).data.data.appointments, enabled: authorized, refetchInterval: refresh });

  const queue = useQuery({ queryKey: ['staffQueue', session, doctorId, date], queryFn: () => StaffQueueApiService.getAllForStaff({doctorId:doctorId||undefined,date}), enabled: authorized, refetchInterval: refresh, refetchIntervalInBackground: true, refetchOnWindowFocus: 'always' });

  const roster=useQuery({queryKey:['staffRoster',session],queryFn:async()=>(await apiClient.get<{data:{doctors:{_id:string;name:string;availabilityStatus:string;roomNumber?:string}[]}}>('/doctors')).data.data.doctors,enabled:authorized,refetchInterval:refresh});
  const action = useMutation({ mutationFn: async ({ operation, id }: { operation: string; id?: string }) => {

    if (operation === 'check-in') return apiClient.post('/queue/staff/check-in', { appointmentId: id });

    if (operation === 'call-next') {if(!doctorId)throw new Error('Select a doctor before calling next.');return StaffQueueApiService.callNext({doctorId});}

    if(!id)throw new Error('Select a queue ticket.');
    if(operation==='start-consultation')return StaffQueueApiService.startConsultation(id);
    if(operation==='complete')return StaffQueueApiService.completeConsultation(id);
    if(operation==='hold')return StaffQueueApiService.hold(id);
    if(operation==='resume')return StaffQueueApiService.resume(id);
    if(operation==='skip')return StaffQueueApiService.skip(id);
    if(operation==='cancel')return StaffQueueApiService.cancelTicket(id);
    throw new Error('Unsupported queue operation.');

  }, onMutate: () => setFeedback(null), onSuccess: async () => { await Promise.all([cache.invalidateQueries({queryKey:['staffQueue']}),cache.invalidateQueries({queryKey:['staffAppointments']})]); setFeedback({tone:'success',message:'Saved by the server.'}); }, onError: (error: Error) => setFeedback({tone:'error',message:error.message}) });

  if (!getAccessToken()) return <Navigate to="/staff/login" replace />;

  if (account.isLoading) return <main><p role="status">Loading staff account…</p></main>;

  if (!authorized) return <main className="p-6"><p role="alert">{account.error?.message ?? 'Staff or admin access is required.'}</p><button onClick={logoutPatient}>Sign out</button></main>;

  const doctors = new Map((roster.data ?? []).map(d => [d._id,d.name]));

  const links=[...staffPages,...(account.data?.user.role==='ADMIN'?[['/staff/team','Team access']]:[])];
  const title=links.find(([url])=>url===path)?.[1]??(path==='/staff/team'?'Team access':path.startsWith('/staff/queue/')?'Patient queue details':'Staff page');
  const selectedTicket=path.startsWith('/staff/queue/')?path.split('/')[3]:undefined;
  const doctorBusy=Boolean(doctorId && queue.data?.some(ticket=>ticket.doctor?._id===doctorId && ['CALLING','IN_CONSULTATION'].includes(ticket.status)));
  const matchesAppointment=(a:Appointment)=>`${a.familyMember?.name??''} ${a.patient?.name} ${a.patient?.phone} ${a._id}`.toLowerCase().includes(search.toLowerCase())&&(!doctorId||a.doctor?._id===doctorId)&&(!status||a.status===status);
  const visibleAppointments=(appointments.data??[]).filter(matchesAppointment);
  const visibleQueue=(queue.data??[]).filter(t=>(!selectedTicket||t._id===selectedTicket)&&(!status||t.status===status)&&(profile.data?.staffPreferences?.showCompletedTickets!==false||!['COMPLETED','CANCELLED'].includes(t.status)));
  const flowTickets=(queue.data??[]).filter(t=>['CALLING','IN_CONSULTATION'].includes(t.status));
  return <StaffShell name={profile.data?.name??account.data?.user.name} role={account.data!.user.role} title={title} date={hospitalDate()} onLogout={logoutPatient}>
      <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">Appointments and queue updates come from the same backend as the patient portal. Check-in is available only on the appointment day in Asia/Colombo.</p>

      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

      {(path==='/staff'||path==='/staff/stats')&&<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Today's activity">{[['Appointments',appointments.data?.length],['Waiting',queue.data?.filter(t=>['WAITING','ALMOST_TURN'].includes(t.status)).length],['In consultation',queue.data?.filter(t=>t.status==='IN_CONSULTATION').length],['Completed',queue.data?.filter(t=>t.status==='COMPLETED').length]].map(([label,count])=><article key={String(label)} className="metric-card glass-surface rounded-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink-muted">{label}</h2>{label==='Appointments'?<CalendarDays size={20} className="text-brand-700"/>:label==='Waiting'?<Clock3 size={20} className="text-warn"/>:label==='Completed'?<CheckCircle2 size={20} className="text-success"/>:<Stethoscope size={20} className="text-info"/>}</div><p className="text-4xl font-extrabold tabular-nums">{count??'—'}</p></article>)}</section>}
      {path==='/staff'&&<section className="surface p-6"><SectionHeader icon={Activity} title="Today's OPD" description="Check patients in from Appointments, then call, hold, skip and complete consultations in the patient queue." actions={<><Link className="button" to="/staff/appointments"><CalendarDays size={17} aria-hidden="true"/>Appointments</Link><Link className="ui-button inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-semibold text-ink-soft" to="/staff/queue"><Stethoscope size={17} aria-hidden="true"/>Open queue</Link><Link className="ui-button inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-semibold text-ink-soft" to="/staff/walk-in"><UserPlus size={17} aria-hidden="true"/>Register walk-in</Link></>}/>{appointments.isError&&<Notice tone="error">{appointments.error.message}</Notice>}{queue.isError&&<Notice tone="error">{queue.error.message}</Notice>}</section>}
      {path==='/staff'&&<div className="grid gap-5 lg:grid-cols-2"><section className="surface p-5"><SectionHeader icon={Activity} title="Active consultations &amp; calls" description="Patients currently being called or seen."/>{queue.data?.filter(t=>['CALLING','IN_CONSULTATION'].includes(t.status)).map(t=><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3" key={t._id}><div className="min-w-0"><Link className="font-bold text-brand-700 hover:underline" to={`/staff/queue/${t._id}`}>{t.ticketNumber} · {t.appointment?.familyMember?.name??t.patient?.name}</Link><p className="mt-1 text-sm text-ink-muted">{t.doctor?.name}</p></div><StatusBadge status={t.status}/></div>)}{queue.data&&!queue.data.some(t=>['CALLING','IN_CONSULTATION'].includes(t.status))&&<p className="text-sm text-ink-muted">No active consultations or calls right now.</p>}</section><section className="surface p-5"><SectionHeader icon={Users} title="Doctor availability" description="Current roster status."/>{roster.isPending&&<LoadingState compact label="Loading availability"/>}{roster.isError&&<Notice tone="error">{roster.error.message}</Notice>}{roster.data?.map(d=><div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2.5 last:border-0" key={d._id}><span className="min-w-0">{d.name} · Room {d.roomNumber??'—'}</span><span className="status-badge" data-tone={d.availabilityStatus==='AVAILABLE'?'success':d.availabilityStatus==='LIMITED'?'warning':'neutral'}>{d.availabilityStatus}</span></div>)}{roster.data?.length===0&&<p className="text-sm text-ink-muted">No active doctors.</p>}</section></div>}
      {path==='/staff/stats'&&<section className="surface p-5"><SectionHeader icon={BarChart3} title="Queue status breakdown" description="Today's recorded activity; no historical growth estimates are inferred."/>{(()=>{const states=['WAITING','ALMOST_TURN','CALLING','IN_CONSULTATION','HELD','SKIPPED','COMPLETED','CANCELLED'];const total=queue.data?.length??0;return <div className="space-y-3">{states.map(state=>{const count=queue.data?.filter(t=>t.status===state).length??0;const pct=total?Math.round(count/total*100):0;return <div key={state}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-ink-muted">{state.replaceAll('_',' ')}</span><strong className="tabular-nums text-ink">{queue.data?count:'—'}</strong></div><div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-canvas" role="presentation"><div className="analytics-bar" style={{width:`${pct}%`}}/></div></div>;})}</div>;})()}{queue.isError&&<Notice tone="error">{queue.error.message}</Notice>}</section>}
      {(path==='/staff/walk-in'||path==='/staff/patients')&&<StaffTools mode={path==='/staff/patients'?'patients':'walk-in'}/>}
      {path==='/staff/doctors'&&<><DoctorRoster/><StaffTools mode="doctors"/></>}
      {path==='/staff/settings'&&<StaffAccount/>}
      {path==='/staff/team'&&(account.data?.user.role==='ADMIN'?<TeamAccess/>:<Notice tone="error">Administrator access is required to manage the team.</Notice>)}
      {(path==='/staff/appointments'||(queueView&&!flowView))&&<section className="surface p-4"><div className="toolbar">{!queueView&&<label className="toolbar-field"><span>Appointment doctor</span><select value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">All doctors</option>{Array.from(doctors).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}<label className="toolbar-field"><span>{queueView?'Queue date':'Appointment date'}</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="toolbar-field"><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{(queueView?['WAITING','ALMOST_TURN','CALLING','IN_CONSULTATION','HELD','SKIPPED','COMPLETED','CANCELLED']:['BOOKED','RESCHEDULED','COMPLETED','CANCELLED']).map(st=><option key={st}>{st}</option>)}</select></label></div></section>}
      {path==='/staff/appointments'&&<section className="surface p-4"><SectionHeader icon={CalendarDays} title="Appointments" description="Register or locate a patient, then check in on the appointment day."/><label className="toolbar-field mt-1 max-w-md"><span>Find patient or appointment</span><input value={search} onChange={e=>setSearch(e.target.value)} /></label>

        {appointments.isLoading && <div className="mt-4"><LoadingState label="Loading appointments"/></div>}

        {appointments.isError && <Notice tone="error" className="mt-4">{appointments.error.message}<button type="button" className="ml-1 font-bold underline" onClick={()=>void appointments.refetch()}>Retry</button></Notice>}

        <StaffAppointmentList appointments={visibleAppointments} date={date} today={today} pending={action.isPending} pendingId={action.variables?.id} checkIn={id=>action.mutate({operation:'check-in',id})}/>
        {appointments.data && appointments.data.length>0 && visibleAppointments.length===0 && <p className="mt-4 text-sm text-ink-muted">No appointments match these filters.</p>}

        {appointments.data?.length===0 && <p className="mt-4 text-sm text-ink-muted">No appointments match this date.</p>}

      </section>}
      {queueView&&date!==today&&<div role="status" className="notice flex-wrap items-center justify-between gap-3" data-tone="info"><span>Viewing {date}. Patient live queues show today&apos;s tickets ({today}); this date is read-only.</span><button type="button" className="button" onClick={()=>setDate(today)}>Show today&apos;s queue</button></div>}
      {queueView&&!flowView&&<section className="surface p-4"><SectionHeader icon={Stethoscope} title="Queue" description="Select a doctor, then call, hold, skip and complete consultations in order."/><div className="toolbar"><label className="toolbar-field"><span>Doctor</span><select value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">All doctors</option>{Array.from(doctors).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><div className="min-w-0 flex-1"><QueueCallControl doctorSelected={Boolean(doctorId)} isToday={date===today} busy={doctorBusy} loading={queue.isFetching || queue.isError} pending={action.isPending} waiting={queue.data?.filter(t=>['WAITING','ALMOST_TURN'].includes(t.status)).length??0} onCall={()=>action.mutate({operation:'call-next'})}/></div></div>

        {queue.isError && <Notice tone="error" className="my-4">{queue.error.message}<button type="button" className="ml-1 font-bold underline" onClick={()=>void queue.refetch()}>Retry</button></Notice>}

        {queue.isLoading && <div className="my-4"><LoadingState label="Loading queue"/></div>}

        <div className="space-y-3">{visibleQueue.map(t=><article key={t._id} className="queue-record"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-base font-bold"><Link className="text-ink hover:text-brand-700 hover:underline" to={`/staff/queue/${t._id}`}>{t.ticketNumber} · {t.appointment?.familyMember?.name??t.patient?.name}</Link></h3><p className="mt-1 text-sm text-ink-muted">{t.doctor?.name??'Doctor unavailable'}</p></div><StatusBadge status={t.status}/></div>{!doctorId&&t.doctor&&<Link className="mt-1 inline-block py-1 text-sm font-semibold text-brand-700 hover:underline" to={`/staff/queue?doctorId=${t.doctor._id}`}>Manage doctor queue</Link>}<dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3"><div><dt className="text-xs text-ink-muted">Waiting position</dt><dd className="mt-1 text-base font-bold tabular-nums text-ink">{t.currentPosition||'—'}</dd></div><div><dt className="text-xs text-ink-muted">Estimated wait</dt><dd className="mt-1 text-base font-bold tabular-nums text-ink">{['WAITING','ALMOST_TURN'].includes(t.status)?`${t.estimatedWaitMins} min`:'—'}</dd></div></dl><div className="mt-3 flex flex-wrap gap-2">{[['start-consultation','Start consultation',t.status==='CALLING'],['complete','Complete',t.status==='IN_CONSULTATION'],['hold','Hold',['WAITING','ALMOST_TURN'].includes(t.status)],['resume','Resume waiting',t.status==='HELD'],['skip','Skip',['WAITING','ALMOST_TURN','CALLING'].includes(t.status)],['cancel','Cancel',['WAITING','HELD','CALLING'].includes(t.status)]].map(([op,label,valid])=>valid && <Button variant="outline" key={String(op)} loading={action.isPending&&action.variables?.id===t._id&&action.variables?.operation===op} disabled={action.isPending||date!==hospitalDate()} onClick={()=>action.mutate({operation:String(op),id:t._id})}>{label}</Button>)}</div></article>)}</div>

        {queue.data&&visibleQueue.length===0&&<EmptyState title="No queue tickets match these filters" description={queue.data.length?'Try another doctor or status to view available tickets.':'Check in an appointment for this date to issue a patient ticket.'} action={<Link to="/staff/appointments" className="button">Open appointments</Link>}/>}

      </section>}
{flowView&&<section className="surface p-4"><SectionHeader icon={Stethoscope} title="Flow control" description="Reception desk view: only called and in-consultation tickets, with large progress buttons and no filters."/>{queue.isError&&<Notice tone="error" className="my-4">{queue.error.message}<button type="button" className="ml-1 font-bold underline" onClick={()=>void queue.refetch()}>Retry</button></Notice>}{queue.isLoading&&<div className="my-4"><LoadingState label="Loading flow"/></div>}<div className="space-y-4">{flowTickets.map(t=><article key={t._id} className="queue-record"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-base font-bold">{t.ticketNumber} · {t.appointment?.familyMember?.name??t.patient?.name}</h3><p className="mt-1 text-sm text-ink-muted">{t.doctor?.name??'Doctor unavailable'}</p></div><StatusBadge status={t.status}/></div><div className="mt-4 flex flex-wrap gap-3">{t.status==='CALLING'&&<Button size="lg" className="min-h-14 flex-1 bg-brand-700 text-white hover:bg-brand-800 sm:flex-none" loading={action.isPending&&action.variables?.id===t._id&&action.variables?.operation==='start-consultation'} disabled={action.isPending||date!==hospitalDate()} onClick={()=>action.mutate({operation:'start-consultation',id:t._id})}>Start consultation</Button>}{t.status==='IN_CONSULTATION'&&<Button size="lg" className="min-h-14 flex-1 bg-success text-white hover:opacity-90 sm:flex-none" loading={action.isPending&&action.variables?.id===t._id&&action.variables?.operation==='complete'} disabled={action.isPending||date!==hospitalDate()} onClick={()=>action.mutate({operation:'complete',id:t._id})}>Complete</Button>}</div></article>)}{queue.data&&flowTickets.length===0&&<EmptyState title="No active consultations or calls" description="Called and in-consultation tickets appear here for the desk. Call the next patient from the patient queue first." action={<Link className="button" to="/staff/queue">Open patient queue</Link>}/>}</div></section>}
      {!links.some(([url])=>url===path)&&!selectedTicket&&path!=='/staff/team'&&<Notice tone="error">This staff page is unavailable. Choose an operation from navigation.</Notice>}
  </StaffShell>;

}
