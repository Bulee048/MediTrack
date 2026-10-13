import { Bell, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QueueTicketData } from '@/services/queueApi';

export function ApproachingTurnCard({
  ticket,
  onAcknowledge,
}: {
  ticket: QueueTicketData;
  onAcknowledge?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#FED7AA] bg-gradient-to-br from-[#FFF7ED] via-white to-[#FEF3C7] p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col items-center text-center">
        {/* Animated Bell Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#EA580C]/10 text-[#EA580C]">
          <Bell className="h-8 w-8 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EA580C] opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-[#EA580C]" />
          </span>
        </div>

        <h2 className="mt-4 text-xl font-black tracking-tight text-[#9A3412]">
          Almost Your Turn!
        </h2>
        <p className="mt-1 text-xs font-semibold text-[#C2410C]">
          You are close to your consultation.
        </p>

        {/* Token Badge */}
        <div className="mt-5 rounded-2xl bg-white px-6 py-3 shadow-sm border border-[#FED7AA]">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#9A3412]">
            Your Queue Number
          </p>
          <p className="text-3xl font-black text-[#EA580C]">{ticket.ticketNumber}</p>
        </div>

        {/* Info stats */}
        <div className="mt-5 flex w-full max-w-xs items-center justify-around border-y border-[#FED7AA]/60 py-3 text-sm">
          <div>
            <p className="text-xs text-[#9A3412] font-semibold">Patients Ahead</p>
            <p className="text-lg font-black text-[#C2410C]">{ticket.patientsAhead ?? 1}</p>
          </div>
          <div className="h-8 w-px bg-[#FED7AA]" />
          <div>
            <p className="text-xs text-[#9A3412] font-semibold">Estimated Wait</p>
            <p className="text-lg font-black text-[#C2410C]">~{ticket.estimatedWaitMins} min</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EA580C]/10 px-3 py-2 text-xs font-bold text-[#9A3412]">
          <MapPin size={16} className="text-[#EA580C]" />
          <span>Please stay near the OPD waiting area.</span>
        </div>

        {onAcknowledge && (
          <Button
            onClick={onAcknowledge}
            className="mt-6 w-full max-w-xs rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold py-3 shadow-md"
          >
            Got It
          </Button>
        )}
      </div>
    </div>
  );
}

export function CalledTurnCard({
  ticket,
  onAcknowledge,
}: {
  ticket: QueueTicketData;
  onAcknowledge?: () => void;
}) {
  const room = ticket.doctor?.roomNumber || ticket.department?.roomNumber || 'Room 03';

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#18A6A6] bg-gradient-to-br from-[#E6FAF7] via-white to-[#DDF3F2] p-6 shadow-xl animate-in zoom-in-95 duration-300">
      <div className="flex flex-col items-center text-center">
        {/* Animated Success Badge */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#20A779] text-white shadow-lg shadow-[#20A779]/30">
          <CheckCircle2 className="h-10 w-10 animate-pulse" />
        </div>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-[#183247]">
          It's Your Turn!
        </h2>
        <p className="mt-1 text-sm font-semibold text-[#146C94]">
          Please proceed to the consultation room now.
        </p>

        {/* Large Token Banner */}
        <div className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] p-4 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">
            Queue Number
          </p>
          <p className="text-4xl font-black tracking-tight">{ticket.ticketNumber}</p>
        </div>

        {/* Room & Doctor Box */}
        <div className="mt-5 w-full rounded-2xl bg-white p-4 border border-[#DCE8EE] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCE8EE] pb-3">
            <span className="text-xs font-bold uppercase text-[#64798B]">Consultation Room</span>
            <span className="text-lg font-black text-[#146C94]">{room}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#64798B]">Doctor</span>
            <span className="text-sm font-bold text-[#183247]">
              {ticket.doctor?.name || 'Assigned Specialist'}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold text-[#20A779]">
          Please proceed directly to {room}.
        </p>

        <Button
          onClick={onAcknowledge}
          className="mt-5 w-full rounded-2xl bg-[#20A779] hover:bg-[#188B63] text-white font-bold py-3.5 text-base shadow-lg shadow-[#20A779]/20"
        >
          I'm on my way
        </Button>
      </div>
    </div>
  );
}
