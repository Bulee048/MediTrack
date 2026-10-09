import { apiClient } from '@/config/api';

export interface QueueTicketData {
  ticketId: string;
  ticketNumber: string;
  sequenceNumber: number;
  currentPosition: number;
  patientsAhead: number;
  nowServing: string | null;
  nowServingStatus: string | null;
  estimatedWaitMins: number;
  status: 'WAITING' | 'ALMOST_TURN' | 'CALLING' | 'IN_CONSULTATION' | 'HELD' | 'SKIPPED' | 'COMPLETED' | 'CANCELLED';
  checkedInAt: string;
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

export class QueueApiService {
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

  static async checkIn(appointmentId: string): Promise<QueueTicketData> {
    const response = await apiClient.post<QueueApiResponse>('/queue/check-in', { appointmentId });
    if (!response.data.data?.ticket) {
      throw new Error('Failed to create queue ticket');
    }
    return response.data.data.ticket;
  }
}
