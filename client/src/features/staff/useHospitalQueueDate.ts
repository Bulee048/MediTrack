import { useEffect, useState } from 'react';
import { hospitalDate } from '@/lib/hospitalDate';

export function rolloverQueueDate(selected: string, previousToday: string, today: string) {
  return selected === previousToday ? today : selected;
}

/** Follow the hospital day only while the operator is viewing today's queue. */
export function useHospitalQueueDate() {
  const [state, setState] = useState(() => { const today = hospitalDate(); return { today, date: today }; });
  useEffect(() => {
    const update = () => {
      const today = hospitalDate();
      setState(previous => previous.today === today ? previous : {
        today, date: rolloverQueueDate(previous.date, previous.today, today),
      });
    };
    const timer = window.setInterval(update, 15000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  return { ...state, setDate: (date: string) => setState(previous => ({ ...previous, date })) };
}
