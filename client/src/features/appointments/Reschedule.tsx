import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneShell } from '@/components/PhoneShell';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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

const REASONS = [
  'Change of plans / Personal emergency',
  'Doctor unavailable',
  'Feeling better / symptoms resolved',
  'Found another doctor',
  'Scheduling conflict',
  'Other',
];

export default function Reschedule() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    appointmentsApi
      .detail(id)
      .then(setAppt)
      .catch(() => navigate('/app/appointments', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!appt || !date) {
      setSlots([]);
      return;
    }
    appointmentsApi
      .getAvailableSlots(appt.doctorId, date)
      .then((s) => {
        setSlots(s);
        setSlotId('');
      })
      .catch(() => setSlots([]));
  }, [appt, date]);

  const monthDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + monthOffset,
    1
  );
  const grid = monthGrid(monthDate);
  const selectedSlot = slots.find((s) => s.id === slotId);

  const confirm = async () => {
    if (!appt || !date || !slotId) return;
    setBusy(true);
    try {
      await appointmentsApi.reschedule(appt.id, {
        date,
        slotId,
        timeLabel: selectedSlot?.label,
        reason,
      });
      toast.success('Appointment rescheduled successfully', {
        description: `New slot: ${fmtMediumDate(date)} at ${selectedSlot?.label}.`,
      });
      navigate(`/app/appointments/${appt.id}`, { replace: true });
    } catch (e) {
      toast.error((e as Error).message || 'Could not reschedule appointment');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !appt) {
    return (
      <PhoneShell title="Reschedule OPD" back>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-ink-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-[13px] font-medium">Loading details…</p>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell title="Reschedule OPD" back>
      {/* 1. CURRENT APPOINTMENT (Clearly Shown) */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <p className="label">Current Appointment</p>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <p className="text-[15.5px] font-extrabold text-ink">{appt.doctorName}</p>
            <p className="text-[12.5px] text-ink-muted mt-0.5">
              {appt.department} · {appt.room}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[12.5px] font-bold text-ink-soft">
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
          <span className="rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-[12px] font-extrabold text-brand-700">
            {appt.queueEntry?.token ?? 'Q-Slot'}
          </span>
        </div>
      </div>

      {/* 2. SELECT NEW DATE */}
      <div className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[14.5px] font-extrabold text-ink">Select New Date</p>
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-bold text-brand-600">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
              disabled={monthOffset === 0}
              className="grid h-7 w-7 place-items-center rounded-md border border-line text-[12px] font-bold disabled:opacity-30 hover:bg-slate-50 min-h-0"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setMonthOffset((m) => Math.min(2, m + 1))}
              disabled={monthOffset >= 2}
              className="grid h-7 w-7 place-items-center rounded-md border border-line text-[12px] font-bold disabled:opacity-30 hover:bg-slate-50 min-h-0"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {DOW_SHORT.map((d) => (
            <span key={d} className="pb-1 text-[11px] font-bold text-ink-muted">
              {d}
            </span>
          ))}
          {grid.map((cell) => {
            const isPast = cell.iso < todayISO();
            const enabled = cell.inMonth && !isPast;
            const isSelected = date === cell.iso;

            return (
              <button
                key={cell.iso}
                type="button"
                disabled={!enabled}
                onClick={() => setDate(cell.iso)}
                className={cn(
                  'mx-auto grid h-8 w-8 place-items-center rounded-full text-[12.5px] font-semibold transition min-h-0',
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
          <p className="text-[12.5px] text-ink-muted">
            Please select a new date on the calendar above.
          </p>
        )}
        {date && slots.length === 0 && (
          <p className="text-[12.5px] text-ink-muted">Loading available slots for {fmtMediumDate(date)}…</p>
        )}
        {date &&
          slots.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={!s.enabled}
              onClick={() => setSlotId(s.id)}
              className={cn(
                'rounded-xl border px-3 py-2 text-[12px] font-bold transition min-h-0',
                slotId === s.id
                  ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                  : s.enabled
                  ? 'border-line bg-white text-ink hover:border-brand-300'
                  : 'border-line bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              )}
            >
              {s.label}
            </button>
          ))}
      </div>

      {/* 4. NEW RESCHEDULING SUMMARY (Clearly Showing Current vs New) */}
      {date && slotId && selectedSlot && (
        <div className="mt-5 rounded-2xl border border-brand-300 bg-brand-50/70 p-4 animate-in fade-in">
          <p className="text-[11.5px] font-extrabold uppercase tracking-wide text-brand-700">
            Rescheduling Overview
          </p>
          <div className="mt-2 flex items-center justify-between text-[12.5px]">
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

      {/* 5. REASON DROPDOWN */}
      <div className="mt-5">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink">
          Reason for Rescheduling
        </label>
        <Select value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      <p className="mt-4 text-center text-[11.5px] text-ink-muted">
        *Rescheduling is free up to 2 hours before the scheduled appointment.
      </p>

      {/* 6. CONFIRM RESCHEDULE BUTTON */}
      <div className="mt-5">
        <Button
          size="lg"
          className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
          disabled={!date || !slotId || busy}
          onClick={confirm}
        >
          {busy ? 'Rescheduling…' : 'Confirm Reschedule'}
        </Button>
      </div>
    </PhoneShell>
  );
}
