import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QueueTicketData } from '@/services/queueApi';

export function DigitalQueueTicketModal({
  ticket,
  onClose,
  onViewLive,
}: {
  ticket: QueueTicketData;
  onClose: () => void;
  onViewLive: () => void;
}) {
  const patientName = ticket.appointment?.reason || 'Verified Patient';
  const visitDate = ticket.appointment?.appointmentDate
    ? new Date(ticket.appointment.appointmentDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const checkInTime = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '09:30 AM';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#105779]/40 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Ticket Header */}
        <div className="flex items-center justify-between border-b border-dashed border-[#CBDCE6] pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#18A6A6] to-[#146C94] text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4v16m-8-8h16" />
              </svg>
            </span>
            <span className="text-sm font-black text-[#183247]">CareFlow</span>
          </div>
          <span className="rounded-full bg-[#EBF5FB] px-2.5 py-0.5 text-[0.6875rem] font-bold text-[#146C94]">
            OPD Queue Ticket
          </span>
        </div>

        {/* Large Queue Token */}
        <div className="py-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#64798B]">Your Queue Number</p>
          <div className="mt-1 inline-block rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] px-8 py-3 text-white shadow-md shadow-[#146C94]/20">
            <span className="text-4xl font-black tracking-tight">{ticket.ticketNumber}</span>
          </div>
        </div>

        {/* Patient & Doctor Grid */}
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#F6FAFD] p-4 text-left">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase text-[#64798B]">Patient Name</p>
            <p className="text-xs font-bold text-[#183247] truncate">{patientName}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-bold uppercase text-[#64798B]">Department</p>
            <p className="text-xs font-bold text-[#183247] truncate">{ticket.department?.name || 'General OPD'}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-bold uppercase text-[#64798B]">Doctor</p>
            <p className="text-xs font-bold text-[#183247] truncate">{ticket.doctor?.name || 'Assigned Specialist'}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-bold uppercase text-[#64798B]">Room</p>
            <p className="text-xs font-bold text-[#146C94]">Room {ticket.doctor?.roomNumber || '03'}</p>
          </div>
        </div>

        {/* Visit Details */}
        <div className="mt-4 flex items-center justify-between border-t border-[#DCE8EE] pt-4 text-xs font-semibold text-[#64798B]">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#146C94]" />
            {visitDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#146C94]" />
            Check-in {checkInTime}
          </span>
        </div>

        {/* Status Badge */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-[#E9A23B]">
          <span className="h-2 w-2 rounded-full bg-[#E9A23B] animate-pulse" />
          <span>Status: {ticket.status.replace(/_/g, ' ')}</span>
        </div>

        {/* Non-sensitive QR Code simulation */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <div className="rounded-2xl border-2 border-[#DCE8EE] bg-white p-3 shadow-inner">
            <svg className="h-28 w-28 text-[#183247]" viewBox="0 0 100 100" fill="currentColor">
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" rx="4" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="13" width="10" height="10" />

              <rect x="69" y="5" width="26" height="26" rx="4" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="77" y="13" width="10" height="10" />

              <rect x="5" y="69" width="26" height="26" rx="4" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="77" width="10" height="10" />

              {/* Data blocks */}
              <rect x="36" y="8" width="6" height="6" />
              <rect x="46" y="8" width="8" height="6" />
              <rect x="36" y="20" width="8" height="8" />
              <rect x="48" y="22" width="6" height="6" />
              <rect x="10" y="38" width="8" height="6" />
              <rect x="24" y="40" width="6" height="8" />
              <rect x="36" y="36" width="12" height="12" />
              <rect x="54" y="38" width="8" height="6" />
              <rect x="68" y="38" width="10" height="8" />
              <rect x="84" y="38" width="8" height="8" />
              <rect x="38" y="54" width="8" height="8" />
              <rect x="52" y="50" width="12" height="6" />
              <rect x="70" y="52" width="8" height="12" />
              <rect x="84" y="54" width="6" height="8" />
              <rect x="38" y="68" width="14" height="6" />
              <rect x="58" y="68" width="8" height="8" />
              <rect x="72" y="72" width="14" height="6" />
              <rect x="38" y="80" width="8" height="8" />
              <rect x="52" y="82" width="10" height="6" />
              <rect x="68" y="84" width="8" height="8" />
              <rect x="82" y="84" width="10" height="6" />
            </svg>
          </div>
          <p className="mt-2 text-[0.6875rem] font-medium text-[#64798B]">
            Keep this ticket ready for your consultation.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-2">
          <Button
            onClick={() => {
              onClose();
              onViewLive();
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
          >
            View Live Queue →
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-xs font-semibold text-[#64798B] hover:text-[#183247]"
          >
            Close Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
