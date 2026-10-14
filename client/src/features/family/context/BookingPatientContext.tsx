import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useProfile } from '@/features/profile/context/ProfileContext';
import { familyApi } from '../api/familyApi';
interface BookingPatient { id: string; name: string }
const Context = createContext<{ patient: BookingPatient | null; loading: boolean; error: string;
  selectPatient: (patient: BookingPatient | null) => void } | undefined>(undefined);
export function BookingPatientProvider({ children }: { children: ReactNode }) {
  const { user } = useProfile();
  // Only a draft ID is persisted. Names/authorization always come from the current account's API.
  const key = `meditrack.bookingPatient.${user?.id ?? ''}`;
  const selectionVersion = useRef(0);
  const [patient, setPatient] = useState<BookingPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const version = selectionVersion.current;
    const current = () => active && version === selectionVersion.current;
    let id: string | null = null;
    try { id = sessionStorage.getItem(key); } catch { setError('Booking selection could not be restored. Please choose the patient again.'); }
    if (!id) { setLoading(false); return; }
    familyApi.getFamilyMembers().then(members => {
      if (!current()) return;
      const member = members.find(m => m.id === id);
      if (!member) throw new Error('Selected family member is no longer available. Please choose the patient again.');
      setPatient({ id: member.id, name: member.name });
    }).catch(e => { if (current()) setError((e as Error).message); }).finally(() => { if (current()) setLoading(false); });
    return () => { active = false; };
  }, [key]);
  const selectPatient = (value: BookingPatient | null) => {
    selectionVersion.current++;
    try {
      if (value) sessionStorage.setItem(key, value.id); else sessionStorage.removeItem(key);
    } catch {
      // Keep the explicit in-memory choice; a storage error must not turn a
      // successful backend booking into a reported failure. Restore errors
      // on refresh still require an explicit patient selection.
    }
    setPatient(value); setError(''); setLoading(false);
  };
  return <Context.Provider value={{ patient, loading, error, selectPatient }}>{children}</Context.Provider>;
}
export function useBookingPatient() {
  const value = useContext(Context);
  if (!value) throw new Error('BookingPatientProvider is required');
  return value;
}
