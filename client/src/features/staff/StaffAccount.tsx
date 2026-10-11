import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, useAuthSession } from '@/config/api';

export interface StaffProfile { _id:string; name:string; email?:string; phone:string; role:'STAFF'|'ADMIN'; staffRole?:'RECEPTIONIST'|'DOCTOR'; staffId?:string; staffPreferences?:{refreshSeconds:15|30|60;showCompletedTickets:boolean}; }
export const field='block w-full rounded-xl border border-line bg-white p-3';
export const button='rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50';
export function useStaffProfile(enabled=true) { const session=useAuthSession();return useQuery({queryKey:['staffProfile',session],queryFn:async()=>(await apiClient.get<{data:{profile:StaffProfile}}>('/staff/profile')).data.data.profile,enabled}); }
export default function StaffAccount(){
 const profile=useStaffProfile();const cache=useQueryClient();
 if(profile.isPending)return <p role="status">Loading account settings…</p>;
 if(profile.isError)return <p role="alert">{profile.error.message}<button onClick={()=>void profile.refetch()}>Retry</button></p>;
 return <AccountForm key={profile.data._id} profile={profile.data} saved={()=>void cache.invalidateQueries({queryKey:['staffProfile']})}/>;
}
function AccountForm({profile,saved}:{profile:StaffProfile;saved:()=>void}){
 const [name,setName]=useState(profile.name);const [email,setEmail]=useState(profile.email??'');const [refreshSeconds,setRefresh]=useState(profile.staffPreferences?.refreshSeconds??15);const [showCompletedTickets,setCompleted]=useState(profile.staffPreferences?.showCompletedTickets??true);const [message,setMessage]=useState('');
 const save=useMutation({mutationFn:async()=>{await apiClient.patch('/staff/profile',{name,email});await apiClient.patch('/staff/preferences',{refreshSeconds,showCompletedTickets});},onSuccess:()=>{setMessage('Account and queue preferences saved.');saved();},onError:(e:Error)=>setMessage(e.message)});
 return <form className="max-w-2xl space-y-5 rounded-2xl border border-line bg-white p-6" onSubmit={e=>{e.preventDefault();setMessage('');save.mutate();}}><h2 className="text-xl font-bold">My staff account</h2><p>{profile.phone} · {profile.role} · {profile.staffRole??'Operations'}</p><label className="block">Display name<input className={field} required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label className="block">Email<input className={field} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block">Queue refresh interval<select className={field} value={refreshSeconds} onChange={e=>setRefresh(Number(e.target.value) as 15|30|60)}>{[15,30,60].map(n=><option key={n} value={n}>{n} seconds</option>)}</select></label><label className="flex gap-3"><input type="checkbox" checked={showCompletedTickets} onChange={e=>setCompleted(e.target.checked)}/>Show completed and cancelled queue tickets</label><p role="status" aria-live="polite">{message}</p><button className={button} disabled={save.isPending}>Save settings</button><p className="text-sm text-ink-muted">Queue preferences are saved to your account. SMS, email delivery, automatic calling and clinical record editing are not available in this application.</p></form>;
}
