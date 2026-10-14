import { Check, Clock, Bell, UserCheck, CheckCircle2 } from 'lucide-react';
import type { QueueTicketData } from '@/services/queueApi';

type QueueStatus = QueueTicketData['status'];

const timelineSteps = [
  { id: 'CHECKED_IN', label: 'Checked In', time: '09:30 AM', icon: Check },
  { id: 'WAITING', label: 'Waiting', time: 'Now', icon: Clock },
  { id: 'ALMOST_TURN', label: 'Almost Your Turn', time: '~ 8 min', icon: Bell },
  { id: 'CALLING', label: 'Called', time: 'Upcoming', icon: UserCheck },
  { id: 'COMPLETED', label: 'Completed', time: 'Final', icon: CheckCircle2 },
] as const;

export function QueueProgressTimeline({
  status,
  currentPosition,
  departmentName = 'General Medicine',
  avgServiceTime = 15,
}: {
  status: QueueStatus;
  currentPosition: number;
  departmentName?: string;
  avgServiceTime?: number;
}) {
  const getActiveIndex = () => {
    switch (status) {
      case 'WAITING':
        return currentPosition <= 2 ? 2 : 1;
      case 'ALMOST_TURN':
        return 2;
      case 'CALLING':
      case 'IN_CONSULTATION':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 1;
    }
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="space-y-6">
      {/* Timeline Card */}
      <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#64798B]">
          Visit Journey
        </h3>

        <div className="relative pl-6">
          {/* Vertical line track */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-[#E2EEF4]" />

          <div className="space-y-7">
            {timelineSteps.map((step, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={step.id} className="relative flex items-center justify-between">
                  {/* Step Dot / Icon */}
                  <div
                    className={`absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isPast
                        ? 'border-[#146C94] bg-[#146C94] text-white'
                        : isCurrent
                        ? 'border-[#146C94] bg-white text-[#146C94] ring-4 ring-[#146C94]/15'
                        : 'border-[#CBDCE6] bg-[#F6FAFD] text-[#8EA3B0]'
                    }`}
                  >
                    <step.icon size={12} strokeWidth={isPast || isCurrent ? 3 : 2} />
                  </div>

                  {/* Step Info */}
                  <div className="ml-4">
                    <p
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-[#146C94]'
                          : isPast
                          ? 'text-[#183247]'
                          : 'text-[#8EA3B0]'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs font-semibold text-[#18A6A6]">Current Status</p>
                    )}
                  </div>

                  {/* Step Time */}
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'font-bold text-[#146C94]' : 'text-[#8EA3B0]'
                    }`}
                  >
                    {isCurrent ? 'Now' : step.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Info Box */}
      <div className="flex items-center justify-between rounded-2xl border border-[#DCE8EE] bg-[#F6FAFD] p-4 text-[#183247]">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">
            Department Details
          </p>
          <p className="mt-0.5 text-sm font-bold text-[#183247]">{departmentName}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64798B]">
            Avg. Service Time
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-[#146C94]">{avgServiceTime} min</p>
        </div>
      </div>
    </div>
  );
}
