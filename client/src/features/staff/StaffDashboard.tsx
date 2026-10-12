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

interface Appointment { familyMember?:{name:string}|null; _id: string; patient: { name: string; phone: string } | null; doctor: { _id: string; name: string } | null; appointmentDate: string; timeSlot: string; status: string; queueTicket?: string; }

export default function StaffDashboard() {

  const session = useAuthSession();
  const path=useLocation().pathname;
  const [date,setDate]=useState(hospitalDate());
  const [appointmentStatus,setAppointmentStatus]=useState('');
  const [queueStatus,setQueueStatus]=useState('');
  const queueView=path==='/staff/queue'||path==='/staff/flow'||path.startsWith('/staff/queue/');
  const status=queueView?queueStatus:appointmentStatus;
  const setStatus=queueView?setQueueStatus:setAppointmentStatus;

  const cache = useQueryClient();

  const [scopeParams,setScopeParams]=useSearchParams();
  const doctorId=scopeParams.get('doctorId')??'';
  const setDoctorId=(id:string)=>{const next=new URLSearchParams(scopeParams);if(id)next.set('doctorId',id);else next.delete('doctorId');setScopeParams(next);};

  const [search, setSearch] = useState('');

  const [feedback, setFeedback] = useState('');

  const account = useQuery({ queryKey: ['staffAccount', session], queryFn: fetchCurrentUser, enabled: Boolean(getAccessToken()) });

  const authorized = ['STAFF', 'ADMIN'].includes(account.data?.user.role ?? '');

  const profile=useStaffProfile(authorized);
  const refresh=(profile.data?.staffPreferences?.refreshSeconds??15)*1000;
  const appointments = useQuery({ queryKey: ['staffAppointments', session, date], queryFn: async () => (await apiClient.get<{data:{appointments:Appointment[]}}>('/appointments',{params:{date}})).data.data.appointments, enabled: authorized, refetchInterval: refresh });

  const queue = useQuery({ queryKey: ['staffQueue', session, doctorId, date], queryFn: () => StaffQueueApiService.getAllForStaff({doctorId:doctorId||undefined,date}), enabled: authorized, refetchInterval: refresh });

  const roster=useQuery({queryKey:['staffRoster',session],queryFn:async()=>(await apiClient.get<{data:{doctors:{_id:string;name:string;availabilityStatus:string;roomNumber?:string}[]}}>('/doctors')).data.data.doctors,enabled:authorized,refetchInterval:refresh});
  const action = useMutation({ mutationFn: async ({ operation, id }: { operation: string; id?: string }) => {

    if (operation === 'check-in') return apiClient.post('/queue/staff/check-in', { appointmentId: id });

    if (operation === 'call-next') {if(!doctorId)throw new Error('Select a doctor before calling next.');return StaffQueueApiService.callNext({doctorId});}

    if(!id)throw new Error('Select a queue ticket.');
    if(operation==='start-consultation')return StaffQueueApiService.startConsultation(id);
    if(operation==='complete')return StaffQueueApiService.completeConsultation(id);
    if(operation==='hold')return StaffQueueApiService.hold(id);
    if(operation==='skip')return StaffQueueApiService.skip(id);
    throw new Error('Unsupported queue operation.');

  }, onMutate: () => setFeedback(''), onSuccess: async () => { await Promise.all([cache.invalidateQueries({queryKey:['staffQueue']}),cache.invalidateQueries({queryKey:['staffAppointments']})]); setFeedback('Saved by the server.'); }, onError: (error: Error) => setFeedback(error.message) });

  if (!getAccessToken()) return <Navigate to="/staff/login" replace />;

  if (account.isLoading) return <main><p role="status">Loading staff account…</p></main>;

  if (!authorized) return <main className="p-6"><p role="alert">{account.error?.message ?? 'Staff or admin access is required.'}</p><button onClick={logoutPatient}>Sign out</button></main>;

  const doctors = new Map((roster.data ?? []).map(d => [d._id,d.name]));

  const links=[...staffPages,...(account.data?.user.role==='ADMIN'?[['/staff/team','Team access']]:[])];
  const title=links.find(([url])=>url===path)?.[1]??(path==='/staff/team'?'Team access':path.startsWith('/staff/queue/')?'Patient queue details':'Staff page');
  const selectedTicket=path.startsWith('/staff/queue/')?path.split('/')[3]:undefined;
  const doctorBusy=Boolean(doctorId && queue.data?.some(ticket=>ticket.doctor?._id===doctorId && ['CALLING','IN_CONSULTATION'].includes(ticket.status)));
  return <StaffShell name={profile.data?.name??account.data?.user.name} role={account.data!.user.role} title={title} date={hospitalDate()} onLogout={logoutPatient}>
      <p className="text-sm">Appointments and queue updates come from the same backend as the patient portal. Check-in is available only on the appointment day in Asia/Colombo.</p>

      <div role="status" aria-live="polite">{feedback}</div>

      {(path==='/staff'||path==='/staff/stats')&&<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Today's activity">{[['Appointments',appointments.data?.length],['Waiting',queue.data?.filter(t=>['WAITING','ALMOST_TURN'].includes(t.status)).length],['In consultation',queue.data?.filter(t=>t.status==='IN_CONSULTATION').length],['Completed',queue.data?.filter(t=>t.status==='COMPLETED').length]].map(([label,count])=><article key={String(label)} className="rounded-2xl border border-line bg-white p-5"><h2 className="text-sm font-semibold text-ink-muted">{label}</h2><p className="mt-2 text-3xl font-extrabold">{count??'—'}</p></article>)}</section>}
      {path==='/staff'&&<section className="rounded-2xl border border-line bg-white p-6"><h2 className="text-xl font-bold">Today's OPD</h2><p className="my-3">Use Appointments to check patients in, then Patient queue to call, hold, skip and complete consultations.</p><div className="flex flex-wrap gap-4"><Link className="font-bold text-brand-700 underline" to="/staff/appointments">View appointments</Link><Link className="font-bold text-brand-700 underline" to="/staff/queue">Open queue</Link><Link className="font-bold text-brand-700 underline" to="/staff/walk-in">Register walk-in</Link></div>{appointments.isError&&<p role="alert">{appointments.error.message}</p>}{queue.isError&&<p role="alert">{queue.error.message}</p>}</section>}
      {path==='/staff'&&<div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-line bg-white p-5"><h2 className="text-xl font-bold">Active consultations & calls</h2>{queue.data?.filter(t=>['CALLING','IN_CONSULTATION'].includes(t.status)).map(t=><p className="border-b border-line py-3" key={t._id}><Link className="font-bold text-brand-700 underline" to={`/staff/queue/${t._id}`}>{t.ticketNumber} · {t.appointment?.familyMember?.name??t.patient?.name}</Link><br/>{t.doctor?.name} · {t.status.replaceAll('_',' ')}</p>)}{queue.data&&!queue.data.some(t=>['CALLING','IN_CONSULTATION'].includes(t.status))&&<p className="mt-3">No active consultations or calls.</p>}</section><section className="rounded-2xl border border-line bg-white p-5"><h2 className="text-xl font-bold">Doctor availability</h2>{roster.isPending&&<p role="status">Loading availability…</p>}{roster.isError&&<p role="alert">{roster.error.message}</p>}{roster.data?.map(d=><p className="flex flex-wrap justify-between gap-2 border-b border-line py-2" key={d._id}><span>{d.name} · Room {d.roomNumber??'—'}</span><strong>{d.availabilityStatus}</strong></p>)}{roster.data?.length===0&&<p>No active doctors.</p>}</section></div>}
      {path==='/staff/stats'&&<section className="rounded-2xl border border-line bg-white p-5"><h2 className="text-xl font-bold">Queue status breakdown</h2>{['WAITING','ALMOST_TURN','CALLING','IN_CONSULTATION','HELD','SKIPPED','COMPLETED','CANCELLED'].map(state=><p key={state} className="flex justify-between border-b border-line py-3"><span>{state.replaceAll('_',' ')}</span><strong>{queue.data?.filter(t=>t.status===state).length??'—'}</strong></p>)}{queue.isError&&<p role="alert">{queue.error.message}</p>}<p className="mt-3 text-sm">Today's recorded activity; no historical growth estimates are inferred.</p></section>}
      {(path==='/staff/walk-in'||path==='/staff/patients')&&<StaffTools mode={path==='/staff/patients'?'patients':'walk-in'}/>}
      {path==='/staff/doctors'&&<><DoctorRoster/><StaffTools mode="doctors"/></>}
      {path==='/staff/settings'&&<StaffAccount/>}
      {path==='/staff/team'&&(account.data?.user.role==='ADMIN'?<TeamAccess/>:<p role="alert">Administrator access is required to manage the team.</p>)}
      {(path==='/staff/appointments'||queueView)&&<div className="flex flex-wrap gap-4">{!queueView&&<label>Appointment doctor<select className="block rounded-xl border border-line p-3" value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">All doctors</option>{Array.from(doctors).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}<label>Queue / appointment date<input className="block rounded-xl border border-line p-3" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Status<select className="block rounded-xl border border-line p-3" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{(queueView?['WAITING','ALMOST_TURN','CALLING','IN_CONSULTATION','HELD','SKIPPED','COMPLETED','CANCELLED']:['BOOKED','RESCHEDULED','COMPLETED','CANCELLED']).map(st=><option key={st}>{st}</option>)}</select></label></div>}
      {path==='/staff/appointments'&&<>
      <section className="rounded-2xl border border-line bg-white p-4"><h2 className="text-xl font-bold">Appointments</h2><label className="mt-3 block">Find patient or appointment<input className="mt-1 block w-full rounded border border-line p-3" value={search} onChange={e=>setSearch(e.target.value)} /></label>

        {appointments.isLoading && <p role="status">Loading appointments…</p>}

        {appointments.isError && <p role="alert">{appointments.error.message}<button onClick={()=>void appointments.refetch()}>Retry</button></p>}

        <div className="mt-3 overflow-x-auto rounded-xl border border-line" tabIndex={0} aria-label="Appointment table"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Appointments for {date}</caption><thead className="bg-slate-50"><tr>{['Patient','Doctor','Date / time','Status','Action'].map(label=><th scope="col" className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{appointments.data?.filter(a=>(!doctorId||a.doctor?._id===doctorId)&&(!status||a.status===status)&&`${a.familyMember?.name??''} ${a.patient?.name} ${a.patient?.phone} ${a._id}`.toLowerCase().includes(search.toLowerCase())).map(a=><tr className="border-t border-line" key={a._id}><th scope="row" className="p-3 font-semibold">{a.familyMember?.name??a.patient?.name??'Patient unavailable'}{a.familyMember&&<span className="block text-xs font-normal">Account: {a.patient?.name}</span>}<span className="block font-normal text-ink-muted">{a.patient?.phone}</span></th><td className="p-3">{a.doctor?.name??'Doctor unavailable'}</td><td className="p-3">{a.appointmentDate.slice(0,10)}<br/>{a.timeSlot}</td><td className="p-3">{a.status}{a.queueTicket?' · Checked in':''}</td><td className="p-3"><button className="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white" disabled={action.isPending||Boolean(a.queueTicket)||a.appointmentDate.slice(0,10)!==hospitalDate()||!['BOOKED','RESCHEDULED'].includes(a.status)} onClick={()=>action.mutate({operation:'check-in',id:a._id})}>Check in</button></td></tr>)}</tbody></table></div>
        {appointments.data&&appointments.data.length>0&&!appointments.data.some(a=>(!doctorId||a.doctor?._id===doctorId)&&(!status||a.status===status)&&`${a.familyMember?.name??''} ${a.patient?.name} ${a.patient?.phone} ${a._id}`.toLowerCase().includes(search.toLowerCase()))&&<p>No appointments match these filters.</p>}

        {appointments.data?.length===0 && <p>No appointments match this date.</p>}

      </section>

      </>}
      {queueView&&<section className="rounded-2xl border border-line bg-white p-4"><h2 className="text-xl font-bold">Queue</h2><div className="my-3 flex flex-wrap items-end gap-3"><label className="min-w-0 w-full sm:w-auto">Doctor<select className="mt-1 block w-full max-w-full rounded border p-3 sm:ml-2 sm:mt-0 sm:inline-block sm:w-auto" value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">All doctors</option>{Array.from(doctors).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><button className="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white" disabled={action.isPending||date!==hospitalDate()||!doctorId||doctorBusy||Boolean(selectedTicket)} onClick={()=>action.mutate({operation:'call-next'})}>Call Next</button>{!doctorId&&<p className="text-sm">Select a doctor to call the next patient.</p>}{doctorBusy&&<p className="text-sm" role="status">Finish or skip the current called patient before calling next. An active consultation must be completed.</p>}</div>

        {queue.isError && <p role="alert">{queue.error.message}<button onClick={()=>void queue.refetch()}>Retry</button></p>}

        {queue.isLoading && <p role="status">Loading queue…</p>}

        <div className="space-y-3">{queue.data?.filter(t=>(!selectedTicket||t._id===selectedTicket)&&(!status||t.status===status)&&(profile.data?.staffPreferences?.showCompletedTickets!==false||!['COMPLETED','CANCELLED'].includes(t.status))).map(t=><article key={t._id} className="rounded-xl border border-line p-3"><h3 className="font-bold"><Link className="underline" to={`/staff/queue/${t._id}`}>{t.ticketNumber} · {t.appointment?.familyMember?.name??t.patient?.name}</Link></h3><p>{t.doctor?.name} · {t.status}</p><p>Waiting position: {t.currentPosition||'—'} · Estimated wait: {t.estimatedWaitMins} minutes</p><div className="mt-2 flex flex-wrap gap-2">{[['start-consultation','Start consultation',t.status==='CALLING'],['complete','Complete',t.status==='IN_CONSULTATION'],['hold','Hold',['WAITING','ALMOST_TURN'].includes(t.status)],['skip','Skip',['WAITING','ALMOST_TURN','CALLING'].includes(t.status)]].map(([op,label,valid])=>valid && <button className="rounded border border-brand-700 px-3 py-2 text-brand-700" key={String(op)} disabled={action.isPending||date!==hospitalDate()} onClick={()=>action.mutate({operation:String(op),id:t._id})}>{label}</button>)}</div></article>)}</div>

        {queue.data&&!queue.data.some(t=>(!selectedTicket||t._id===selectedTicket)&&(!status||t.status===status)&&(profile.data?.staffPreferences?.showCompletedTickets!==false||!['COMPLETED','CANCELLED'].includes(t.status)))&&<p>No queue tickets match these filters.</p>}

      </section>}
      {!links.some(([url])=>url===path)&&!selectedTicket&&path!=='/staff/team'&&<p role="alert">This staff page is unavailable. Choose an operation from navigation.</p>}
  </StaffShell>;

}
