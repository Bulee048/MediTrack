import { apiClient } from '@/config/api';
import { type Appointment, type Slot, INITIAL_APPOINTMENTS } from '../types';

const APPOINTMENTS_KEY = 'meditrack_user_appointments';

function getStoredAppointments(): Appointment[] {
  const stored = localStorage.getItem(APPOINTMENTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // parse fallback
    }
  }
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
  return INITIAL_APPOINTMENTS;
}

function saveAppointments(items: Appointment[]) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(items));
}

export const appointmentsApi = {
  list: async (tab: 'upcoming' | 'past' | 'cancelled' = 'upcoming'): Promise<Appointment[]> => {
    // Attempt backend call if available
    try {
      const res = await apiClient.get<{ success: boolean; data: Appointment[] }>(
        `/appointments?tab=${tab}`
      );
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Backend appointments endpoint is under development, use persistent isolated mock
    }

    const all = getStoredAppointments();
    const today = new Date().toISOString().slice(0, 10);

    if (tab === 'upcoming') {
      return all.filter(
        (a) => a.status === 'confirmed' || (a.status === 'rescheduled' && a.date >= today)
      );
    }
    if (tab === 'past') {
      return all.filter((a) => a.status === 'completed' || (a.date < today && a.status !== 'cancelled'));
    }
    if (tab === 'cancelled') {
      return all.filter((a) => a.status === 'cancelled');
    }
    return all;
  },

  detail: async (id: string): Promise<Appointment> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Appointment }>(
        `/appointments/${id}`
      );
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Backend fallback
    }

    const all = getStoredAppointments();
    const found = all.find((a) => a.id === id);
    if (!found) {
      throw new Error('Appointment not found');
    }
    return found;
  },

  reschedule: async (
    id: string,
    body: { date: string; slotId: string; timeLabel?: string; reason?: string }
  ): Promise<Appointment> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: Appointment }>(
        `/appointments/${id}/reschedule`,
        body
      );
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Backend fallback
    }

    const all = getStoredAppointments();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const updated: Appointment = {
      ...all[index],
      date: body.date,
      slotId: body.slotId,
      time: body.timeLabel || all[index].time,
      status: 'confirmed',
      reason: body.reason ? `Rescheduled: ${body.reason}` : all[index].reason,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    saveAppointments(all);
    return updated;
  },

  cancel: async (
    id: string,
    reason: string
  ): Promise<{ appointment: Appointment; refund: number }> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: { appointment: Appointment; refund: number } }>(
        `/appointments/${id}/cancel`,
        { reason }
      );
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Backend fallback
    }

    const all = getStoredAppointments();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const refund = all[index].paymentStatus === 'paid' ? all[index].amount : 0;
    const updated: Appointment = {
      ...all[index],
      status: 'cancelled',
      cancelReason: reason,
      paymentStatus: refund > 0 ? 'refunded' : all[index].paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    saveAppointments(all);
    return { appointment: updated, refund };
  },

  checkIn: async (id: string): Promise<Appointment> => {
    const all = getStoredAppointments();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Appointment not found');

    const updated: Appointment = {
      ...all[index],
      queueEntry: {
        id: `q_${Date.now()}`,
        token: `Q-${Math.floor(10 + Math.random() * 89)}`,
        status: 'waiting',
        nowServing: 'Q-08',
        position: 4,
        estWaitMins: 24,
        patientsAhead: 3,
      },
    };
    all[index] = updated;
    saveAppointments(all);
    return updated;
  },

  getAvailableSlots: async (doctorId: string, _date: string): Promise<Slot[]> => {
    // Try official doctor availability route: GET /doctors/:id/availability
    try {
      const res = await apiClient.get<{ success: boolean; data: any }>(
        `/doctors/${doctorId}/availability`
      );
      if (res.data?.data?.slots && Array.isArray(res.data.data.slots)) {
        const slots: Slot[] = res.data.data.slots.map((s: any, idx: number) => ({
          id: s._id || `slot_${idx}`,
          label: `${s.startTime} - ${s.endTime}`,
          period: 'morning',
          enabled: (s.bookedCount || 0) < (s.capacity || 10),
        }));
        if (slots.length > 0) return slots;
      }
    } catch {
      // Fallback
    }

    // Default realistic clinical time slots
    return [
      { id: 's_0900', label: '09:00 AM', period: 'morning', enabled: true },
      { id: 's_0930', label: '09:30 AM', period: 'morning', enabled: true },
      { id: 's_1000', label: '10:00 AM', period: 'morning', enabled: true },
      { id: 's_1030', label: '10:30 AM', period: 'morning', enabled: false },
      { id: 's_1100', label: '11:00 AM', period: 'morning', enabled: true },
      { id: 's_1130', label: '11:30 AM', period: 'morning', enabled: true },
      { id: 's_1400', label: '02:00 PM', period: 'afternoon', enabled: true },
      { id: 's_1430', label: '02:30 PM', period: 'afternoon', enabled: true },
      { id: 's_1500', label: '03:00 PM', period: 'afternoon', enabled: true },
      { id: 's_1600', label: '04:00 PM', period: 'afternoon', enabled: true },
      { id: 's_1730', label: '05:30 PM', period: 'evening', enabled: true },
      { id: 's_1800', label: '06:00 PM', period: 'evening', enabled: true },
    ];
  },
};
