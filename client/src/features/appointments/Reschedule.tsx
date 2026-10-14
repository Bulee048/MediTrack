import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { FeaturePageContent } from '@/components/FeaturePageContent';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { appointmentsApi } from './api/appointmentsApi';
import type { Appointment, Slot } from './types';
import {
  DOW_SHORT,
  MONTHS,
  fmtMediumDate,
  monthGrid,
  todayISO,
} from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function Reschedule() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState('');
  const [slotError, setSlotError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [slotRetry, setSlotRetry] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setAppt(null); setError('');
    setLoading(true);
    appointmentsApi
      .detail(id)
      .then((appointment) => { if (active) setAppt(appointment); })
      .catch((e) => { if (active) setError((e as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);

  useEffect(() => {
    if (!appt || !date) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlots([]); setSlotId(''); setSlotError(''); setSlotsLoading(true);
    appointmentsApi
      .getAvailableSlots(appt.doctorId, date)
      .then((s) => {
        if (!active) return;
        setSlots(s);
        setSlotId('');
      })
      .catch((e) => { if (active) { setSlots([]); setSlotError((e as Error).message); } }).finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [appt, date, slotRetry]);

  useEffect(() => {
    if (!appt) return;
    let active = true;
    setDatesLoading(true);
    appointmentsApi.getAvailableDates(appt.doctorId).then(dates => { if (active) setAvailableDates(dates); })
      .catch(e => { if (active) setSlotError((e as Error).message); }).finally(() => { if (active) setDatesLoading(false); });
    return () => { active = false; };
  }, [appt, slotRetry]);

  const monthDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + monthOffset,
    1
  );
  const grid = monthGrid(monthDate);
  const selectedSlot = slots.find((s) => s.id === slotId);

  const confirm = async () => {
    if (!appt || !date || !selectedSlot?.enabled || pending.current) return;
    pending.current = true; setMutationError('');
    setBusy(true);
    try {
      await appointmentsApi.reschedule(appt.id, {
        date,
        slotId,
        timeLabel: selectedSlot?.label,
      });
      await queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
      toast.success('Appointment rescheduled successfully', {
        description: `New slot: ${fmtMediumDate(date)} at ${selectedSlot?.label}.`,
      });
      navigate(`/app/appointments/${appt.id}`, { replace: true });
    } catch (e) {
      setMutationError((e as Error).message);
      setSlotRetry(n => n + 1);
      toast.error((e as Error).message || 'Could not reschedule appointment');
    } finally {
      pending.current = false; setBusy(false);
    }
  };

  if (error) return <FeaturePageContent title="Reschedule OPD" back><p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm">{error}</p><button type="button" className="mt-3 underline" onClick={() => setRetry(n => n + 1)}>Try again</button></FeaturePageContent>;

  if (loading || !appt) {
    return (
      <FeaturePageContent title="Reschedule OPD" back>
        <div role="status" className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-ink-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-[0.8125rem] font-medium">Loading details…</p>
        </div>
      </FeaturePageContent>
    );
  }

  return (
    <FeaturePageContent title="Reschedule OPD" back>
      {mutationError && <p role="alert" className="mb-4 text-danger-600">{mutationError}</p>}
      {slotError && <p role="alert" className="mb-4 text-sm text-danger-600">{slotError}</p>}
      {slotError && <button type="button" className="underline" onClick={() => setSlotRetry(n => n + 1)}>Retry availability</button>}
      {!datesLoading && !slotError && availableDates.length === 0 && <p role="status" className="mb-3 text-sm">No bookable dates currently published. Try refreshing availability.</p>}
      {datesLoading && <p role="status" className="mb-3 text-sm">Loading published dates…</p>}
      {/* 1. CURRENT APPOINTMENT (Clearly Shown) */}
      <div className="surface p-4 shadow-card">
        <p className="label">Current Appointment</p>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <p className="text-[0.96875rem] font-extrabold text-ink">{appt.doctorName}</p>
            <p className="text-[0.78125rem] text-ink-muted mt-0.5">
              {appt.department} · {appt.room}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[0.78125rem] font-bold text-ink-soft">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-brand-600" />
                {fmtMediumDate(appt.date)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-brand-600" />
                {appt.time}
              </span>
            </div>
          </div>
          <span className="rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-[0.75rem] font-extrabold text-brand-700">
            {appt.queueEntry?.token ?? appt.ref}
          </span>
        </div>
      </div>

      {/* 2. SELECT NEW DATE */}
      <div className="mt-4 surface p-4 shadow-card">
        <label className="calendar-compact-only text-sm font-semibold">Select New Date<select className="field" value={date} disabled={busy||datesLoading} onChange={e=>setDate(e.target.value)}><option value="">Choose a date</option>{availableDates.filter(day=>day>=todayISO()).map(day=><option key={day} value={day}>{fmtMediumDate(day)}</option>)}</select></label>
        <div className="calendar-wide-only flex items-center justify-between">
          <p className="text-[0.90625rem] font-extrabold text-ink">Select New Date</p>
          <div className="flex items-center gap-2">
            <span className="text-[0.78125rem] font-bold text-brand-600">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
              disabled={monthOffset === 0}
              className="grid h-11 w-11 place-items-center rounded-md border border-line text-[0.75rem] font-bold disabled:opacity-30 hover:bg-slate-50 min-h-0"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setMonthOffset((m) => m + 1)}
              disabled={busy}
              className="grid h-11 w-11 place-items-center rounded-md border border-line text-[0.75rem] font-bold disabled:opacity-30 hover:bg-slate-50 min-h-0"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        <div className="calendar-wide-only mt-4 grid grid-cols-7 gap-1 text-center">
          {DOW_SHORT.map((d) => (
            <span key={d} className="pb-1 text-xs font-bold text-ink-muted">
              {d}
            </span>
          ))}
          {grid.map((cell) => {
            const isPast = cell.iso < todayISO();
            const enabled = cell.inMonth && !isPast && availableDates.includes(cell.iso) && !busy;
            const isSelected = date === cell.iso;

            return (
              <button
                key={cell.iso}
                type="button"
                aria-label={fmtMediumDate(cell.iso)}
                aria-pressed={isSelected}
                disabled={!enabled}
                onClick={() => setDate(cell.iso)}
                className={cn(
                  'mx-auto grid min-h-11 w-full min-w-0 place-items-center rounded-full text-[0.78125rem] font-semibold transition min-h-0',
                  isSelected
                    ? 'bg-brand-600 text-white font-extrabold shadow-soft'
                    : enabled
                    ? 'text-ink hover:bg-brand-50'
                    : 'text-slate-300 pointer-events-none'
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AVAILABLE TIME SLOTS */}
      <p className="mt-5 label">Available Time Slots</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {!date && (
          <p className="text-[0.78125rem] text-ink-muted">
            Please select a new date on the calendar above.
          </p>
        )}
        {date && slots.length === 0 && (
          <p className="text-[0.78125rem] text-ink-muted">{slotsLoading ? `Loading available slots for ${fmtMediumDate(date)}…` : slotError ? 'Slots could not be loaded.' : 'No slots available for this date.'}</p>
        )}
        {date &&
          slots.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={slotId === s.id}
              disabled={!s.enabled || busy}
              onClick={() => setSlotId(s.id)}
              className={cn(
                'rounded-xl border px-3 py-2 text-[0.75rem] font-bold transition min-h-0',
                slotId === s.id
                  ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                  : s.enabled
                  ? 'border-line bg-white text-ink hover:border-brand-300'
                  : 'border-line bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              )}
            >
              {s.label}{!s.enabled ? ' (Unavailable)' : ''}
            </button>
          ))}
      </div>

      {/* 4. NEW RESCHEDULING SUMMARY (Clearly Showing Current vs New) */}
      {date && slotId && selectedSlot && (
        <div className="mt-5 rounded-2xl border border-brand-300 bg-brand-50/70 p-4 animate-in fade-in">
          <p className="text-[0.71875rem] font-extrabold uppercase tracking-wide text-brand-700">
            Rescheduling Overview
          </p>
          <div className="mt-2 flex items-center justify-between text-[0.78125rem]">
            <div>
              <p className="text-ink-muted">Current Slot</p>
              <p className="font-bold text-ink">
                {fmtMediumDate(appt.date)}, {appt.time}
              </p>
            </div>
            <ArrowRight size={16} className="text-brand-600 shrink-0" />
            <div className="text-right">
              <p className="text-brand-700 font-bold">New Slot</p>
              <p className="font-extrabold text-brand-900">
                {fmtMediumDate(date)}, {selectedSlot.label}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRM RESCHEDULE BUTTON */}
      <div className="mt-5">
        <Button
          size="lg"
          className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
          disabled={!appt.doctorId || !date || !selectedSlot?.enabled || busy || appt.checkedIn || !['confirmed', 'rescheduled'].includes(appt.status)}
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? 'Rescheduling…' : 'Confirm Reschedule'}
        </Button>
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title="Confirm Reschedule" description={`Move your appointment to ${date} at ${selectedSlot?.label ?? ''}? Your original slot will be released after confirmation.`}
        confirmText="Yes, Reschedule" onConfirm={confirm} />
    </FeaturePageContent>
  );
}
