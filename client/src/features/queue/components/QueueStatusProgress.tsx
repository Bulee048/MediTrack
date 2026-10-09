import { Check, Clock } from 'lucide-react';
import type { QueueTicketData } from '@/services/queueApi';

type QueueStatus = QueueTicketData['status'];

const steps = [
  { label: 'Checked in' },
  { label: 'Waiting', status: 'WAITING' },
  { label: 'Almost turn', status: 'ALMOST_TURN' },
  { label: 'Called', status: 'CALLING' },
  { label: 'In consultation', status: 'IN_CONSULTATION' },
  { label: 'Completed', status: 'COMPLETED' },
] as const;

const exceptionDescriptions = {
  HELD: 'On hold — waiting progress is paused. Ask reception for guidance.',
  SKIPPED: 'Skipped — this ticket is outside the waiting queue. Ask reception for the next steps.',
  CANCELLED: 'Cancelled — the queue journey has ended for this ticket.',
};

/** A status journey, not a percentage or a history of other patients. */
export function QueueStatusProgress({ status }: { status: QueueStatus }) {
  const exceptional = status === 'HELD' || status === 'SKIPPED' || status === 'CANCELLED';
  const current = steps.findIndex(step => 'status' in step && step.status === status);

  return (
    <section aria-labelledby="queue-progress-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="queue-progress-heading" className="text-base font-extrabold tracking-tight text-slate-900">Your queue journey</h2>
      {exceptional ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm leading-relaxed text-slate-700">{exceptionDescriptions[status]}</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Your current stage is highlighted. Almost turn is an optional waiting stage.</p>
          <ol className="mt-5 space-y-0" aria-label="Queue status progression">
            {steps.map((step, index) => {
              const active = index === current;
              // Earlier steps show ordering only; no unreported event times or history are inferred.
              const earlier = index < current;
              return (
                <li key={step.label} aria-current={active ? 'step' : undefined} className="flex min-w-0 gap-3">
                  <div aria-hidden="true" className="flex w-7 shrink-0 flex-col items-center">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? 'bg-teal-700 text-white ring-4 ring-teal-100' : earlier ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                      {index === 0 ? <Check className="h-3.5 w-3.5" /> : active ? <Clock className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    {index < steps.length - 1 && <span className="my-1 min-h-3 w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className={`mb-3 flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${active ? 'border-teal-300 bg-teal-50' : 'border-transparent'}`}>
                    <span className={`text-sm ${active ? 'font-bold text-teal-900' : 'font-medium text-slate-600'}`}>{step.label}</span>
                    {active && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-teal-800">Current stage</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
