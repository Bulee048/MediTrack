import { hospitalDate } from '@/lib/hospitalDate';
import StaffTools from './StaffTools';
import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Navigate, Link } from 'react-router-dom';

import { apiClient, getAccessToken, useAuthSession } from '@/config/api';

import { fetchCurrentUser, logoutPatient } from '@/features/auth/auth.service';

import { StaffQueueApiService } from '@/services/staffQueueApi';

interface Appointment { _id: string; patient: { name: string; phone: string } | null; doctor: { _id: string; name: string } | null; appointmentDate: string; timeSlot: string; status: string; queueTicket?: string; }

export default function StaffDashboard() {

  const session = useAuthSession();

  const cache = useQueryClient();

  const [doctorId, setDoctorId] = useState('');

  const [search, setSearch] = useState('');

  const [feedback, setFeedback] = useState('');

  const account = useQuery({ queryKey: ['staffAccount', session], queryFn: fetchCurrentUser, enabled: Boolean(getAccessToken()) });

  const authorized = ['STAFF', 'ADMIN'].includes(account.data?.user.role ?? '');

  const appointments = useQuery({ queryKey: ['staffAppointments', session], queryFn: async () => (await apiClient.get<{data:{appointments:Appointment[]}}>('/appointments')).data.data.appointments, enabled: authorized, refetchInterval: 15000 });

  const queue = useQuery({ queryKey: ['staffQueue', session, doctorId], queryFn: () => StaffQueueApiService.getAllForStaff(doctorId ? { doctorId } : undefined), enabled: authorized, refetchInterval: 15000 });

  const action = useMutation({ mutationFn: async ({ operation, id }: { operation: string; id?: string }) => {

    if (operation === 'check-in') return apiClient.post('/queue/staff/check-in', { appointmentId: id });

    if (operation === 'call-next') return StaffQueueApiService.callNext(doctorId ? { doctorId } : undefined);

    return apiClient.patch(`/queue/${id}/${operation}`);

  }, onMutate: () => setFeedback(''), onSuccess: async () => { await Promise.all([cache.invalidateQueries({queryKey:['staffQueue']}),cache.invalidateQueries({queryKey:['staffAppointments']})]); setFeedback('Saved by the server.'); }, onError: (error: Error) => setFeedback(error.message) });

  if (!getAccessToken()) return <Navigate to="/staff/login" replace />;

  if (account.isLoading) return <main><p role="status">Loading staff account…</p></main>;

  if (!authorized) return <main className="p-6"><p role="alert">{account.error?.message ?? 'Staff or admin access is required.'}</p><button onClick={logoutPatient}>Sign out</button></main>;

  const doctors = new Map((appointments.data ?? []).filter(a => a.doctor).map(a => [a.doctor!._id,a.doctor!.name]));

  return <main data-feature-accessibility className="min-h-svh bg-canvas p-4 text-ink md:p-8">

    <div className="mx-auto max-w-6xl space-y-6">

      <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold">MediTrack Staff OPD</h1><p>{account.data?.user.name}</p></div><nav className="flex gap-4"><Link to="/">Portals</Link><button onClick={logoutPatient}>Sign out</button></nav></header>

      <p className="text-sm">Appointments and queue updates come from the same backend as the patient portal. Check-in is available only on the appointment day in Asia/Colombo.</p>

      <div role="status" aria-live="polite">{feedback}</div>

      <StaffTools />
      <section className="rounded-2xl border border-line bg-white p-4"><h2 className="text-xl font-bold">Appointments</h2><label className="mt-3 block">Find patient or appointment<input className="mt-1 block w-full rounded border border-line p-3" value={search} onChange={e=>setSearch(e.target.value)} /></label>

        {appointments.isLoading && <p role="status">Loading appointments…</p>}

        {appointments.isError && <p role="alert">{appointments.error.message}<button onClick={()=>void appointments.refetch()}>Retry</button></p>}

        <div className="mt-3 space-y-3">{appointments.data?.filter(a=>`${a.patient?.name} ${a.patient?.phone} ${a._id}`.toLowerCase().includes(search.toLowerCase())).map(a=><article key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"><div><h3 className="font-bold">{a.patient?.name ?? 'Patient unavailable'}</h3><p>{a.doctor?.name} · {a.appointmentDate.slice(0,10)} · {a.timeSlot}</p><p>{a.status}{a.queueTicket ? ' · Checked in' : ''}</p></div><button className="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white" disabled={action.isPending || Boolean(a.queueTicket) || a.appointmentDate.slice(0,10) !== hospitalDate() || !['BOOKED','RESCHEDULED'].includes(a.status)} onClick={()=>action.mutate({operation:'check-in',id:a._id})}>Check in</button></article>)}</div>

        {appointments.data?.length===0 && <p>No appointments yet.</p>}

      </section>

      <section className="rounded-2xl border border-line bg-white p-4"><h2 className="text-xl font-bold">Today's Queue</h2><div className="my-3 flex flex-wrap items-end gap-3"><label>Doctor<select className="ml-2 rounded border p-3" value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">All doctors</option>{Array.from(doctors).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><button className="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white" disabled={action.isPending} onClick={()=>action.mutate({operation:'call-next'})}>Call Next</button></div>

        {queue.isError && <p role="alert">{queue.error.message}<button onClick={()=>void queue.refetch()}>Retry</button></p>}

        {queue.isLoading && <p role="status">Loading queue…</p>}

        <div className="space-y-3">{queue.data?.map(t=><article key={t._id} className="rounded-xl border border-line p-3"><h3 className="font-bold">{t.ticketNumber} · {t.patient?.name}</h3><p>{t.doctor?.name} · {t.status}</p><div className="mt-2 flex flex-wrap gap-2">{[['start-consultation','Start consultation',t.status==='CALLING'],['complete','Complete',t.status==='IN_CONSULTATION'],['hold','Hold',['WAITING','ALMOST_TURN'].includes(t.status)],['skip','Skip',['WAITING','ALMOST_TURN','CALLING'].includes(t.status)]].map(([op,label,valid])=>valid && <button className="rounded border border-brand-700 px-3 py-2 text-brand-700" key={String(op)} disabled={action.isPending} onClick={()=>action.mutate({operation:String(op),id:t._id})}>{label}</button>)}</div></article>)}</div>

        {queue.data?.length===0 && <p>No queue tickets today.</p>}

      </section>

    </div>

  </main>;

}
