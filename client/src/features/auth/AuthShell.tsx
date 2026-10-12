import type { ReactNode } from 'react';
import { CalendarDays, Clock3, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '@/components/ui/brand';

interface AuthShellProps {
  title: string;
  accountTitle?: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, description, accountTitle = 'Patient Account', children, footer }: AuthShellProps) {
  const staff = accountTitle === 'Staff Account';
  return (
    <main className="auth-page ambient-background">
      <div className="auth-layout">
        <section className="auth-story" aria-label="About MediTrack">
          <Link to="/" className="inline-flex"><Brand /></Link>
          <p className="mt-14 flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-2 text-xs font-semibold text-brand-800"><span className="h-2 w-2 rounded-full bg-brand-600" />A simpler way to manage your OPD visit</p>
          <h2 className="mt-6 max-w-lg text-[clamp(2.5rem,4.8vw,4rem)] font-extrabold leading-[1.08] text-ink">Less waiting.<br /><span className="text-brand-700">More peace of mind.</span></h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-muted">Your appointments, queue and updates. Connected in one calm, convenient place.</p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
            {[{ icon: CalendarDays, title: 'Plan your visit', text: 'Find a doctor and book an available appointment.' }, { icon: Clock3, title: 'Follow your queue', text: 'See your position and know when your ticket is called.' }].map(({ icon: Icon, title: heading, text }) => <div key={heading} className="glass-surface rounded-2xl p-5"><Icon size={23} className="text-brand-700" aria-hidden="true" /><h3 className="mt-3 text-sm font-bold">{heading}</h3><p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p></div>)}
          </div>
          <p className="auth-assurance mt-8"><ShieldCheck size={18} aria-hidden="true" />Account-based access for patients and the care team.</p>
        </section>
        <section className="auth-card glass-surface page-enter" aria-label={accountTitle}>
          <div className="auth-mobile-brand"><Link to="/"><Brand /></Link></div>
          <div className="mb-7"><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-brand-700">{staff ? 'Care team portal' : 'Patient portal'}</p><h1 className="font-extrabold text-ink">{title}</h1><p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p></div>
          <div className="space-y-5">{children}</div>
          {footer && <div className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">{footer}</div>}
          <Link to={staff ? '/login' : '/staff/login'} className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-brand-700">{staff ? 'Go to patient sign in' : 'Care team sign in'}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </section>
      </div>
    </main>
  );
}
