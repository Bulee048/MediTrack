import { createContext, useContext, useState, type ReactNode } from 'react';
interface BookingPatient { id: string; name: string }
const Context = createContext<{ patient: BookingPatient | null; selectPatient: (patient: BookingPatient | null) => void } | undefined>(undefined);
export function BookingPatientProvider({ children }: { children: ReactNode }) {
  const [patient, selectPatient] = useState<BookingPatient | null>(null);
  return <Context.Provider value={{ patient, selectPatient }}>{children}</Context.Provider>;
}
export function useBookingPatient() {
  const value = useContext(Context);
  if (!value) throw new Error('BookingPatientProvider is required');
  return value;
}
