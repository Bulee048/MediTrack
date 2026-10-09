import { apiClient } from '@/config/api';

export interface QueueTicketData {
  ticketId: string;
  ticketNumber: string;
  sequenceNumber: number;
  currentPosition: number;
  patientsAhead: number;
  aheadTickets: { ticketNumber: string; status: 'WAITING' | 'ALMOST_TURN' }[];
  nowServing: string | null;
  nowServingStatus: string | null;
  estimatedWaitMins: number;
  status: 'WAITING' | 'ALMOST_TURN' | 'CALLING' | 'IN_CONSULTATION' | 'HELD' | 'SKIPPED' | 'COMPLETED' | 'CANCELLED';
  checkedInAt: string;
  arrivedAt?: string;
  calledAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  department: {
    _id: string;
    name: string;
    code: string;
    roomNumber: string;
    description?: string;
  };
  doctor: {
    _id: string;
    name: string;
    title?: string;
    roomNumber?: string;
  };
  appointment: {
    _id: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
    status: string;
  };
  lastUpdated: string;
}

export interface QueueApiResponse {
  success: boolean;
  message: string;
  data: {
    ticket: QueueTicketData;
  } | null;
}

// POST /queue/check-in returns a populated document, not GET /queue/me's live view.
export interface CheckInQueueTicket {
  _id: string;
  __v: number;
  ticketNumber: string;
  sequenceNumber: number;
  patient: { _id: string; name: string; email?: string; phone: string } | null;
  doctor: { _id: string; name: string; title?: string; roomNumber?: string } | null;
  department: { _id: string; name: string; code: string; roomNumber?: string } | null;
  appointment: string;
  currentPosition: number;
  estimatedWaitMins: number;
  status: QueueTicketData['status'];
  checkedInAt?: string;
  calledAt?: string;
  arrivedAt?: string;
  resumeHistory: { at: string; by: string }[];
  consultationStartedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  data: { ticket: CheckInQueueTicket };
}

export interface PatientQueueAppointment {
  _id: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'BOOKED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  queueTicket?: string;
  doctor: { _id: string; name: string; title?: string; roomNumber?: string } | null;
}

export class QueueApiService {
  static async markArrived(ticketId: string): Promise<{ ticketId: string; arrivedAt: string }> {
    const response = await apiClient.patch<{ data: { ticketId: string; arrivedAt: string } }>(`/queue/${ticketId}/arrival`);
    return response.data.data;
  }
  static async getMyActiveTicket(): Promise<QueueTicketData | null> {
    try {
      const response = await apiClient.get<QueueApiResponse>('/queue/me');
      return response.data.data?.ticket || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getMyAppointments(): Promise<PatientQueueAppointment[]> {
    const response = await apiClient.get<{ data: { appointments: PatientQueueAppointment[] } }>('/appointments/my');
    return response.data.data.appointments;
  }

  static async checkIn(appointmentId: string): Promise<CheckInQueueTicket> {
    const response = await apiClient.post<CheckInResponse>('/queue/check-in', { appointmentId });
    if (!response.data.data?.ticket) {
      throw new Error('Failed to create queue ticket');
    }
    return response.data.data.ticket;
  }
}
