import axios from 'axios';
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async checkIn(appointmentId: string): Promise<QueueTicketData> {
    // Check-in returns the saved model; GET /me supplies the authoritative live DTO.
    await apiClient.post('/queue/check-in', { appointmentId });
    const ticket = await this.getMyActiveTicket();
    if (!ticket) throw new Error('Queue ticket could not be loaded. Please refresh the queue.');
    return ticket;
  }

  static async cancelTicket(ticketId: string): Promise<QueueTicketData> {
    const response = await apiClient.delete<QueueApiResponse>(`/queue/${ticketId}`);
    const ticket = response.data.data?.ticket;
    if (!ticket) throw new Error('Queue ticket could not be cancelled. Please refresh and try again.');
    return ticket;
  }
}
