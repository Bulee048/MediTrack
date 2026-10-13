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
import { CalendarDays, Stethoscope } from 'lucide-react';
import { StaffOverviewScreen, StaffMonitoringScreen } from './CareFlowStaffScreens';


export default function StaffDashboard() {

  const session = useAuthSession();
  const path=useLocation().pathname;
  const { date, setDate, today } = useHospitalQueueDate();
  const [appointmentStatus,setAppointmentStatus]=useState('');
  const [queueStatus,setQueueStatus]=useState('');
  const flowView=path==='/staff/flow';
  const queueDate=flowView?today:date;
  const queueView=path==='/staff/queue'||path==='/staff/flow'||path.startsWith('/staff/queue/');
  const status=queueView?queueStatus:appointmentStatus;
  const setStatus=queueView?setQueueStatus:setAppointmentStatus;

  const cache = useQueryClient();

  const [scopeParams,setScopeParams]=useSearchParams();
  const doctorId=scopeParams.get('doctorId')??'';
  const queueDoctorId=flowView?'':doctorId;
  const setDoctorId=(id:string)=>{const next=new URLSearchParams(scopeParams);if(id)next.set('doctorId',id);else next.delete('doctorId');setScopeParams(next);};

  const [search, setSearch] = useState('');

  const [feedback, setFeedback] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);

  const account = useQuery({ queryKey: ['staffAccount', session], queryFn: fetchCurrentUser, enabled: Boolean(getAccessToken()) });

  const authorized = ['STAFF', 'ADMIN'].includes(account.data?.user.role ?? '');

  const profile=useStaffProfile(authorized);
  const refresh=(profile.data?.staffPreferences?.refreshSeconds??15)*1000;
  const appointments = useQuery({ queryKey: ['staffAppointments', session, date], queryFn: async () => (await apiClient.get<{data:{appointments:Appointment[]}}>('/appointments',{params:{date}})).data.data.appointments, enabled: authorized, refetchInterval: refresh });

  const queue = useQuery({ queryKey: ['staffQueue', session, queueDoctorId, queueDate], queryFn: () => StaffQueueApiService.getAllForStaff({doctorId:queueDoctorId||undefined,date:queueDate}), enabled: authorized, refetchInterval: refresh, refetchIntervalInBackground: true, refetchOnWindowFocus: 'always' });

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
  const visibleQueue=(queue.data??[]).filter(t=>(flowView?['CALLING','IN_CONSULTATION'].includes(t.status):(!selectedTicket||t._id===selectedTicket)&&(!status||t.status===status))&&(profile.data?.staffPreferences?.showCompletedTickets!==false||!['COMPLETED','CANCELLED'].includes(t.status)));
  return <StaffShell name={profile.data?.name??account.data?.user.name} role={account.data!.user.role} title={title} date={hospitalDate()} onLogout={logoutPatient}>
      <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">Appointments and queue updates come from the same backend as the patient portal. Check-in is available only on the appointment day in Asia/Colombo.</p>

      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}


      {path==='/staff' && (
        <StaffOverviewScreen
          queue={queue.data ?? []}
          doctors={doctors}
          onCallNext={() => action.mutate({ operation: 'call-next' })}
          actionPending={action.isPending}
        />
      )}

      {path==='/staff/stats' && (
        <StaffMonitoringScreen
          queue={queue.data ?? []}
        />
      )}
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
      {queueView&&!flowView&&date!==today&&<div role="status" className="notice flex-wrap items-center justify-between gap-3" data-tone="info"><span>Viewing {date}. Patient live queues show today&apos;s tickets ({today}); this date is read-only.</span><button type="button" className="button" onClick={()=>setDate(today)}>Show today&apos;s queue</button></div>}
      {queueView&&<section className="surface p-4"><SectionHeader icon={Stethoscope} title={flowView?"Flow control":"Queue"} description={flowView?"Today’s called patients and consultations. Call the next patient from Patient queue.":"Select a doctor, then call, hold, skip and complete consultations in order."}/>{!flowView&&<div className="toolbar"><label className="toolbar-field"><span>Doctor</span><select value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">All doctors</option>{Array.from(doctors).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><div className="min-w-0 flex-1"><QueueCallControl doctorSelected={Boolean(doctorId)} isToday={date===today} busy={doctorBusy} loading={queue.isFetching || queue.isError} pending={action.isPending} waiting={queue.data?.filter(t=>['WAITING','ALMOST_TURN'].includes(t.status)).length??0} onCall={()=>action.mutate({operation:'call-next'})}/></div></div>}

        {queue.isError && <Notice tone="error" className="my-4">{queue.error.message}<button type="button" className="ml-1 font-bold underline" onClick={()=>void queue.refetch()}>Retry</button></Notice>}

        {queue.isLoading && <div className="my-4"><LoadingState label="Loading queue"/></div>}

        <div className="space-y-3">{visibleQueue.map(t=><article key={t._id} className="queue-record"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-base font-bold"><Link className="text-ink hover:text-brand-700 hover:underline" to={`/staff/queue/${t._id}`}>{t.ticketNumber} · {t.appointment?.familyMember?.name??t.patient?.name}</Link></h3><p className="mt-1 text-sm text-ink-muted">{t.doctor?.name??'Doctor unavailable'}</p></div><StatusBadge status={t.status}/></div>{!flowView&&!doctorId&&t.doctor&&<Link className="mt-1 inline-block py-1 text-sm font-semibold text-brand-700 hover:underline" to={`/staff/queue?doctorId=${t.doctor._id}`}>Manage doctor queue</Link>}{!flowView&&<dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3"><div><dt className="text-xs text-ink-muted">Waiting position</dt><dd className="mt-1 text-base font-bold tabular-nums text-ink">{t.currentPosition||'—'}</dd></div><div><dt className="text-xs text-ink-muted">Estimated wait</dt><dd className="mt-1 text-base font-bold tabular-nums text-ink">{['WAITING','ALMOST_TURN'].includes(t.status)?`${t.estimatedWaitMins} min`:'—'}</dd></div></dl>}<div className="mt-3 flex flex-wrap gap-2">{[['start-consultation','Start consultation',t.status==='CALLING'],['complete','Complete',t.status==='IN_CONSULTATION'],['hold','Hold',['WAITING','ALMOST_TURN'].includes(t.status)],['resume','Resume waiting',t.status==='HELD'],['skip','Skip',['WAITING','ALMOST_TURN','CALLING'].includes(t.status)],['cancel','Cancel',['WAITING','HELD','CALLING'].includes(t.status)]].map(([op,label,valid])=>valid && (!flowView||op==='start-consultation'||op==='complete') && <Button size={flowView?'lg':'default'} className={flowView?'min-h-14 w-full text-lg sm:w-auto sm:px-8':undefined} variant={flowView?'default':'outline'} key={String(op)} loading={action.isPending&&action.variables?.id===t._id&&action.variables?.operation===op} disabled={action.isPending||queueDate!==hospitalDate()} onClick={()=>action.mutate({operation:String(op),id:t._id})}>{label}</Button>)}</div></article>)}</div>

        {queue.data&&visibleQueue.length===0&&<EmptyState title={flowView?"No active calls or consultations":"No queue tickets match these filters"} description={flowView?"Call a waiting patient from Patient queue to begin.":queue.data.length?'Try another doctor or status to view available tickets.':'Check in an appointment for this date to issue a patient ticket.'} action={<Link to={flowView?"/staff/queue":"/staff/appointments"} className="button">{flowView?"Open patient queue":"Open appointments"}</Link>}/>}

      </section>}
      {!links.some(([url])=>url===path)&&!selectedTicket&&path!=='/staff/team'&&<Notice tone="error">This staff page is unavailable. Choose an operation from navigation.</Notice>}
  </StaffShell>;

}
