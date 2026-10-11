import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { Badge, Button, Input, LoadingScreen, Modal, Select, StatCard, SwitchRow } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';
import type { OtpDelivery, OtpLookup, OtpSettings } from '@/lib/types';

const METHODS = [
  { key: 'console', label: 'Console (development)', icon: ShieldCheck, hint: 'Printed to the server log — nothing leaves this machine.' },
  { key: 'sms', label: 'SMS', icon: PhoneCall, hint: 'Needs SMS_API_KEY in server/.env.' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, hint: 'Needs WHATSAPP_TOKEN + a Meta sender id.' },
  { key: 'email', label: 'Email', icon: Send, hint: 'Needs SMTP_API_KEY; uses the patient’s email address.' },
] as const;

const STATUS_TONE: Record<string, { label: string; cls: string }> = {
  delivered: { label: 'Delivered', cls: 'bg-success-soft text-success' },
  sent: { label: 'Sent', cls: 'bg-info-soft text-info' },
  verified: { label: 'Verified', cls: 'bg-brand-50 text-brand-700' },
  failed: { label: 'Failed', cls: 'bg-danger-soft text-danger-600' },
  queued: { label: 'Queued', cls: 'bg-warn-soft text-warn' },
  expired: { label: 'Expired', cls: 'bg-ink/5 text-ink-muted' },
};

/**
 * OTP delivery console.
 *
 * Answers the two questions the brief asks about:
 *   1. how the code is delivered, and
 *   2. which user actually received it.
 */
export default function OtpDeliveryConsole() {
  const { push } = useToast();
  const [settings, setSettings] = useState<OtpSettings | null>(null);
  const [rows, setRows] = useState<OtpDelivery[]>([]);
  const [summary, setSummary] = useState({ total: 0, delivered: 0, verified: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState<OtpDelivery | null>(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookup, setLookup] = useState<OtpLookup | null>(null);
  const [looking, setLooking] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.staff.otpDeliveries(50);
      setRows(r.data);
      setSummary(r.summary);
      setSettings(r.settings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const patch = async (p: Partial<OtpSettings>) => {
    setSaving(true);
    try {
      const next = await api.staff.saveOtpSettings(p);
      setSettings(next);
      push({ tone: 'success', title: 'OTP settings saved' });
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Could not save', body: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const runLookup = async () => {
    if (lookupPhone.replace(/\D/g, '').length < 6) return;
    setLooking(true);
    try {
      setLookup(await api.staff.otpLookup(lookupPhone));
    } catch (e) {
      push({ tone: 'error', title: 'Lookup failed', body: (e as Error).message });
    } finally {
      setLooking(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <LoadingScreen label="Loading OTP delivery configuration…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="OTP sends" value={summary.total} icon={<Send size={17} />} />
        <StatCard label="Delivered" value={summary.delivered} icon={<CheckCircle2 size={17} />} delta="reached the channel" />
        <StatCard label="Verified" value={summary.verified} icon={<ShieldCheck size={17} />} delta="entered correctly" />
        <StatCard
          label="Failed"
          value={summary.failed}
          icon={<AlertTriangle size={17} />}
          delta={summary.failed ? 'needs attention' : 'all healthy'}
          deltaTone={summary.failed ? 'down' : 'up'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        {/* ------------------------- configuration ----------------------- */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">How the code is delivered</h3>
            <p className="mt-1 text-[12.5px] text-ink-muted">Every send is recorded so you can always see which user it reached.</p>

            <div className="mt-5 space-y-2.5">
              {METHODS.map((m) => {
                const active = settings.method === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => patch({ method: m.key })}
                    disabled={saving}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition disabled:opacity-60',
                      active ? 'border-brand-600 bg-brand-50/40' : 'border-line hover:border-brand-200',
                    )}
                  >
                    <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-canvas text-ink-muted')}>
                      <m.icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold text-ink">{m.label}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted">{m.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-4 border-t border-line pt-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Sender ID / from-address</label>
                <Input
                  value={settings.senderId}
                  onChange={(e) => setSettings({ ...settings, senderId: e.target.value })}
                  onBlur={() => patch({ senderId: settings.senderId })}
                  placeholder="MEDTRK"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Code length"
                  value={String(settings.otpLength)}
                  onChange={(e) => patch({ otpLength: Number(e.target.value) as 4 | 6 })}
                >
                  <option value="4">4 digits</option>
                  <option value="6">6 digits</option>
                </Select>
                <Select
                  label="Valid for"
                  value={String(settings.ttlSeconds)}
                  onChange={(e) => patch({ ttlSeconds: Number(e.target.value) })}
                >
                  {[60, 90, 120, 180, 300].map((s) => (
                    <option key={s} value={s}>
                      {s / 60} min
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Resend after"
                  value={String(settings.resendSeconds)}
                  onChange={(e) => patch({ resendSeconds: Number(e.target.value) })}
                >
                  {[30, 45, 60, 90, 120].map((s) => (
                    <option key={s} value={s}>
                      {s}s
                    </option>
                  ))}
                </Select>
                <Select
                  label="Max attempts"
                  value={String(settings.maxAttempts)}
                  onChange={(e) => patch({ maxAttempts: Number(e.target.value) })}
                >
                  {[3, 4, 5, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border-t border-line pt-2">
                <SwitchRow
                  checked={settings.deliveryEnabled}
                  onChange={(v) => patch({ deliveryEnabled: v })}
                  title="Delivery enabled"
                  description="Turn off to block all outgoing codes"
                />
                <SwitchRow
                  checked={settings.exposeInResponse}
                  onChange={(v) => patch({ exposeInResponse: v })}
                  title="Show code in the API response"
                  description="Development only — never enable in production"
                />
              </div>
            </div>
          </section>

          {/* --------------------------- lookup -------------------------- */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-[15px] font-extrabold text-ink">Which user is this number?</h3>
            <p className="mt-1 text-[12.5px] text-ink-muted">Resolve a phone number to its patient account and last delivery.</p>

            <div className="mt-4 flex gap-2">
              <Input
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runLookup()}
                placeholder="9876543210"
                inputMode="numeric"
                icon={<Search size={15} />}
              />
              <Button loading={looking} onClick={runLookup}>
                Find
              </Button>
            </div>

            {lookup && (
              <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
                {lookup.found && lookup.user ? (
                  <>
                    <p className="text-[14px] font-extrabold text-ink">{lookup.user.name}</p>
                    <p className="text-[12px] text-ink-muted">
                      {lookup.user.email ?? 'no email'} · member since {lookup.user.memberSince}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={lookup.inQueue ? 'success' : 'neutral'}>
                        {lookup.inQueue ? 'Currently in a queue' : 'Not in a queue'}
                      </Badge>
                      <Badge tone="brand">{lookup.phone}</Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-ink-muted">
                    No account for {lookup.phone} — an OTP here would create a <b>new patient</b>.
                  </p>
                )}

                {lookup.lastDelivery && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="label">Last delivery</p>
                    <p className="mt-1 text-[12.5px] text-ink-soft">
                      {lookup.lastDelivery.method.toUpperCase()} · {timeAgo(lookup.lastDelivery.createdAt)} ·{' '}
                      {lookup.lastDelivery.status}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* --------------------------- audit log ------------------------ */}
        <section className="rounded-2xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h3 className="text-[15px] font-extrabold text-ink">OTP delivery log</h3>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">Every code sent, who it went to, and whether it arrived.</p>
            </div>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="px-6 py-16 text-center text-[13px] text-ink-muted">
              No codes sent yet. Trigger a login from the patient app and it will appear here.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {rows.map((d) => {
                const st = STATUS_TONE[d.status] ?? STATUS_TONE.queued;
                return (
                  <div key={d.id} className="flex flex-wrap items-center gap-4 px-6 py-4 transition hover:bg-canvas/50">
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                        d.status === 'failed'
                          ? 'bg-danger-soft text-danger'
                          : d.status === 'verified'
                            ? 'bg-brand-50 text-brand-600'
                            : 'bg-success-soft text-success',
                      )}
                    >
                      {d.status === 'failed' ? (
                        <AlertTriangle size={16} />
                      ) : d.status === 'verified' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-extrabold text-ink">
                        {d.userName ?? 'New patient account'}
                        {d.isNewUser && <span className="ml-2 text-[11px] font-bold text-warn">NEW</span>}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {d.phone} · via {d.method.toUpperCase()} · to <span className="font-semibold">{d.destination}</span>
                      </p>
                      {d.error && <p className="mt-1 text-[11.5px] font-semibold text-danger-600">{d.error}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <code className="rounded-lg bg-canvas px-2.5 py-1.5 text-[12.5px] font-bold tracking-widest text-ink">
                        {d.code}
                      </code>
                      <Badge className={st.cls}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {st.label}
                      </Badge>
                      <span className="w-24 text-right text-[11.5px] text-ink-faint">{timeAgo(d.createdAt)}</span>
                      <button
                        onClick={async () => {
                          try {
                            setReveal(await api.staff.otpDelivery(d.id));
                          } catch (e) {
                            push({ tone: 'error', title: 'Could not open', body: (e as Error).message });
                          }
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-muted hover:bg-canvas"
                        title="Show the unmasked code"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(reveal)}
        onClose={() => setReveal(null)}
        title="Delivery detail"
        footer={
          <Button variant="outline" onClick={() => setReveal(null)}>
            <EyeOff size={16} /> Hide code
          </Button>
        }
      >
        {reveal && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-canvas p-4 text-center">
              <p className="label">Verification code</p>
              <p className="mt-2 text-[30px] font-extrabold tracking-[0.3em] text-ink">{reveal.code}</p>
            </div>
            <KV label="Sent to" value={`${reveal.userName ?? 'New patient'} · ${reveal.phone}`} />
            <KV label="Channel" value={reveal.method.toUpperCase()} />
            <KV label="Destination" value={reveal.destination} />
            <KV label="Sent at" value={new Date(reveal.createdAt).toLocaleString()} />
            <KV label="Expires at" value={new Date(reveal.expiresAt).toLocaleString()} />
            {reveal.verifiedAt && <KV label="Verified at" value={new Date(reveal.verifiedAt).toLocaleString()} />}
            {reveal.error && <KV label="Error" value={reveal.error} danger />}
          </div>
        )}
      </Modal>
    </div>
  );
}

function KV({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className={cn('text-right text-[12.5px] font-bold', danger ? 'text-danger' : 'text-ink')}>{value}</span>
    </div>
  );
}
