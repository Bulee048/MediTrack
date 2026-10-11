import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
export const staffPages=[['/staff','Dashboard'],['/staff/appointments','Appointments'],['/staff/queue','Patient queue'],['/staff/flow','Queue controls'],['/staff/patients','Patients'],['/staff/walk-in','Walk-in registration'],['/staff/doctors','Doctors & schedules'],['/staff/stats','Analytics'],['/staff/settings','Settings']];
export default function StaffShell({name,role,title,date,onLogout,children}:{name?:string;role:string;title:string;date:string;onLogout:()=>void;children:ReactNode}){
 const [menuOpen,setMenuOpen]=useState(false);
 const links=[...staffPages,...(role==='ADMIN'?[['/staff/team','Team access']]:[])];
 return <div data-feature-accessibility className="min-h-svh bg-canvas text-ink md:pl-[236px]">
  <a href="#staff-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4">Skip to staff content</a>
  <aside id="staff-navigation" className={`${menuOpen?'block':'hidden'} fixed inset-y-0 left-0 z-30 w-[236px] overflow-y-auto border-r border-line bg-white p-5 md:block`}><Link to="/staff" className="text-2xl font-extrabold text-brand-700">MediTrack</Link><p className="mb-6 text-sm text-ink-muted">Staff OPD portal</p><nav aria-label="Staff navigation" className="space-y-1">{links.map(([url,label])=><NavLink end={url==='/staff'} onClick={()=>setMenuOpen(false)} key={url} to={url} className={({isActive})=>`block rounded-xl px-4 py-3 font-semibold ${isActive?'bg-brand-50 text-brand-700':'text-ink-muted hover:bg-slate-50'}`}>{label}</NavLink>)}</nav><Link to="/" className="mt-6 block p-3">Portal selection</Link><button className="p-3" onClick={onLogout}>Sign out</button><button className="block p-3 md:hidden" onClick={()=>setMenuOpen(false)}>Close navigation</button></aside>
  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-5 md:px-8"><div className="flex gap-3"><button className="rounded border p-2 md:hidden" aria-expanded={menuOpen} aria-controls="staff-navigation" aria-label="Open staff navigation" onClick={()=>setMenuOpen(true)}>Menu</button><div><h1 className="text-2xl font-extrabold">{title}</h1><p className="text-sm text-ink-muted">OPD operations · {date}</p></div></div><p className="text-sm">{name} · {role}</p></header>
  <main id="staff-content" className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">{children}</main>
 </div>;
}
