import { Check } from 'lucide-react';
export function BookingSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  return <ol className="booking-steps" aria-label="Booking progress">{['Date', 'Time', 'Review', 'Confirmed'].map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} data-complete={index + 1 < step || undefined}>
    <span className="step-dot">{index + 1 < step ? <Check size={15} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
  </li>)}</ol>;
}
