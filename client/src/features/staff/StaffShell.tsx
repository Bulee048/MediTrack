import { useState, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ListOrdered, SlidersHorizontal, Users, UserPlus, Stethoscope, BarChart3, Settings, ShieldCheck, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/ui/brand';
export const staffPages=[['/staff','Dashboard'],['/staff/appointments','Appointments'],['/staff/queue','Patient queue'],['/staff/flow','Flow control'],['/staff/patients','Patients'],['/staff/walk-in','Walk-in registration'],['/staff/doctors','Doctors & schedules'],['/staff/stats','Analytics'],['/staff/settings','Settings']];
export default function StaffShell({name,role,title,date,onLogout,children}:{name?:string;role:string;title:string;date:string;onLogout:()=>void;children:ReactNode}){
 const [menuOpen,setMenuOpen]=useState(false);
 const [collapsed,setCollapsed]=useState(false);
 const drawer=useRef<HTMLDialogElement>(null);
 useLayoutEffect(()=>{const element=drawer.current;if(!menuOpen||!element)return;const previous=document.activeElement as HTMLElement; element.showModal();return()=>{element.close();if(previous?.isConnected)previous.focus();};},[menuOpen]);
 const links=[...staffPages,...(role==='ADMIN'?[['/staff/team','Team access']]:[])];
 const icons=[LayoutDashboard,CalendarDays,ListOrdered,SlidersHorizontal,Users,UserPlus,Stethoscope,BarChart3,Settings,ShieldCheck];
 const navigation=(mobile=false)=><>
   {mobile&&<button autoFocus className="icon-button mb-4 self-end" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}><X size={20}/></button>}
   <Link to="/staff" className="mb-8 inline-flex px-2" aria-label="MediTrack staff home"><Brand compact={!mobile&&collapsed}/></Link>
   <p className="sidebar-label mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">{role==='ADMIN'?'Administration':'Care team'} workspace</p>
   <nav id={mobile?'staff-navigation':'staff-navigation-desktop'} aria-label="Staff navigation">{links.map(([url,label],i)=>{const Icon=icons[i];return <NavLink aria-label={label} title={collapsed?label:undefined} end={url==='/staff'} onClick={()=>setMenuOpen(false)} key={url} to={url} className="staff-nav-item"><Icon size={19} aria-hidden="true"/><span className="sidebar-label">{label}</span></NavLink>;})}</nav>
   <div className="mt-auto border-t border-line pt-4"><Link to="/" className="staff-nav-item" aria-label="Portal selection"><ArrowUpRight size={19} aria-hidden="true"/><span className="sidebar-label">Portal selection</span></Link><button className="staff-nav-item w-full" aria-label="Sign out" onClick={onLogout}><LogOut size={19} aria-hidden="true"/><span className="sidebar-label">Sign out</span></button></div>
 </>;
 return <div data-feature-accessibility data-collapsed={collapsed} className="staff-shell ambient-background text-ink">
  <a href="#staff-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:rounded-xl focus:bg-white focus:p-4">Skip to staff content</a>
  <aside className="staff-sidebar staff-sidebar-desktop">{navigation()}</aside>
  <dialog ref={drawer} className="staff-drawer" aria-label="Staff navigation drawer" onCancel={e=>{e.preventDefault();setMenuOpen(false);}} onClick={e=>{if(e.target===drawer.current)setMenuOpen(false);}}><aside className="staff-sidebar">{navigation(true)}</aside></dialog>
  <header className="staff-header glass-surface"><div className="flex min-w-0 items-center gap-3"><button className="icon-button staff-mobile-toggle" aria-expanded={menuOpen} aria-controls="staff-navigation" aria-label="Open staff navigation" onClick={()=>setMenuOpen(true)}><Menu size={20} aria-hidden="true"/></button><button className="icon-button staff-desktop-toggle" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}</button><div className="min-w-0"><p className="mb-1 text-xs font-semibold text-brand-700">OPD workspace · {date}</p><h1 className="page-title">{title}</h1></div></div><div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-white/80 px-3 py-2"><span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 sm:flex">{name?.trim().charAt(0)||'M'}</span><div className="min-w-0"><p className="break-words text-sm font-semibold">{name}</p><p className="text-xs text-ink-muted">{role==='ADMIN'?'Administrator':'Staff account'}</p></div></div></header>
  <main id="staff-content" className="staff-workspace space-y-6 page-enter">{children}</main>
 </div>;
}
