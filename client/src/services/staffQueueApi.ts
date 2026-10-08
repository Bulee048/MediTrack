import { apiClient } from '@/config/api';
export type StaffQueueStatus =
  | 'WAITING'
  | 'ALMOST_TURN'
  | 'CALLING'
  | 'IN_CONSULTATION'
  | 'HELD'
  | 'SKIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

interface StaffQueuePatient {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

// Serialized QueueTicket document returned by staff mutation endpoints.
// These endpoints populate patient, doctor and department, but not appointment.
export interface StaffQueueTicket {
  _id: string;
  __v: number;
  ticketNumber: string;
  sequenceNumber: number;
  patient: StaffQueuePatient | null;
  doctor: { _id: string; name: string; title?: string; roomNumber?: string } | null;
  department: { _id: string; name: string; code: string; roomNumber?: string } | null;
  appointment: string;
  currentPosition: number;
  estimatedWaitMins: number;
  status: StaffQueueStatus;
  checkedInAt?: string;
  calledAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// GET /queue additionally selects patient NIC and populates appointment.
export interface StaffQueueListTicket extends Omit<StaffQueueTicket, 'patient' | 'appointment'> {
  patient: (StaffQueuePatient & { nic?: string }) | null;
  appointment: {
    _id: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
  } | null;
}

interface StaffQueueResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class StaffQueueApiService {
  static async getAllForStaff(params?: {
    departmentId?: string;
    doctorId?: string;
    status?: StaffQueueStatus;
    date?: string;
  }): Promise<StaffQueueListTicket[]> {
    const response = await apiClient.get<StaffQueueResponse<{ tickets: StaffQueueListTicket[] }>>(
      '/queue',
      { params }
    );
    return response.data.data.tickets;
  }

  static async callNext(body?: { doctorId?: string; departmentId?: string }): Promise<StaffQueueTicket> {
    const response = await apiClient.post<StaffQueueResponse<{ ticket: StaffQueueTicket }>>(
      '/queue/call-next',
      body
    );
    return response.data.data.ticket;
  }

  static async startConsultation(ticketId: string): Promise<StaffQueueTicket> {
    const response = await apiClient.patch<StaffQueueResponse<{ ticket: StaffQueueTicket }>>(
      `/queue/${ticketId}/start-consultation`
    );
    return response.data.data.ticket;
  }

  static async completeConsultation(ticketId: string): Promise<StaffQueueTicket> {
    const response = await apiClient.patch<StaffQueueResponse<{ ticket: StaffQueueTicket }>>(
      `/queue/${ticketId}/complete`
    );
    return response.data.data.ticket;
  }

  static async hold(ticketId: string): Promise<StaffQueueTicket> {
    const response = await apiClient.patch<StaffQueueResponse<{ ticket: StaffQueueTicket }>>(
      `/queue/${ticketId}/hold`
    );
    return response.data.data.ticket;
  }

  static async skip(ticketId: string): Promise<StaffQueueTicket> {
    const response = await apiClient.patch<StaffQueueResponse<{ ticket: StaffQueueTicket }>>(
      `/queue/${ticketId}/skip`
    );
    return response.data.data.ticket;
  }
}
