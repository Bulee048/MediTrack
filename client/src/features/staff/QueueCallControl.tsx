export function QueueCallControl({ doctorSelected, isToday, busy, loading, pending, waiting, onCall }:
  { doctorSelected: boolean; isToday: boolean; busy: boolean; loading: boolean; pending: boolean; waiting: number; onCall: () => void }) {
  const reason = !isToday ? 'Past and future queues are read-only. Switch to today to manage the live queue.'
    : !doctorSelected ? 'Select a doctor above, or use Manage doctor queue on a ticket.'
    : loading ? 'Loading this doctor’s queue…'
    : busy ? 'Finish or skip the called patient before calling next. Complete an active consultation first.'
    : waiting === 0 ? 'No waiting patients for this doctor. Check in an appointment to add a patient.'
    : pending ? 'Saving queue change…' : '';
  return <>
    <button type="button" className="button" disabled={Boolean(reason)} aria-describedby="queue-call-guidance" onClick={onCall}>Call Next</button>
    <p id="queue-call-guidance" role="status" className="mt-2 text-sm leading-relaxed text-ink-muted">{reason || 'Calls the next waiting patient for the selected doctor. The patient queue updates automatically.'}</p>
  </>;
}
