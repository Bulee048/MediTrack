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
export function QueueStatusProgress({ status, times }: { status: QueueStatus; times?: Pick<QueueTicketData, 'checkedInAt' | 'calledAt' | 'consultationStartedAt' | 'completedAt'> }) {
  const exceptional = status === 'HELD' || status === 'SKIPPED' || status === 'CANCELLED';
  const current = steps.findIndex(step => 'status' in step && step.status === status);

  return (
    <section aria-labelledby="queue-progress-heading" className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-card min-[360px]:p-5">
      <h2 id="queue-progress-heading" className="text-[15px] font-extrabold tracking-tight text-ink">Your queue journey</h2>
      {exceptional ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm leading-relaxed text-slate-700">{exceptionDescriptions[status]}</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Your current stage is highlighted. Almost turn is an optional waiting stage.</p>
          <ol className="mt-5 space-y-0" aria-label="Queue status progression">
            {steps.map((step, index) => {
              const active = index === current;
              // Earlier steps show ordering only; no unreported event times or history are inferred.
              const earlier = index < current;
              const eventTime = index === 0 ? times?.checkedInAt : step.label === 'Called' ? times?.calledAt : step.label === 'In consultation' ? times?.consultationStartedAt : step.label === 'Completed' ? times?.completedAt : undefined;
              return (
                <li key={step.label} aria-current={active ? 'step' : undefined} className="flex min-w-0 gap-3">
                  <div aria-hidden="true" className="flex w-7 shrink-0 flex-col items-center">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? 'bg-brand-700 text-white ring-4 ring-brand-100' : earlier ? 'bg-brand-50 text-brand-800' : 'bg-canvas text-ink-soft'}`}>
                      {index === 0 ? <Check className="h-3.5 w-3.5" /> : active ? <Clock className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    {index < steps.length - 1 && <span className="my-1 min-h-3 w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className={`mb-2 flex min-w-0 flex-1 flex-wrap items-center justify-between gap-1.5 rounded-xl border px-3 py-2.5 ${active ? 'border-brand-300 bg-brand-50' : 'border-line bg-white shadow-soft'}`}>
                    <span className={`text-[12.5px] ${active ? 'font-bold text-brand-900' : 'font-medium text-ink-soft'}`}>{step.label}</span>
                    {eventTime && <time dateTime={eventTime} className="text-[10px] text-ink-soft">{new Date(eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>}
                    {active && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-brand-800">Current stage</span>}
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
