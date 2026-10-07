import { QueueCounter } from '../models/QueueCounter.js';
import { QueueTicket, IQueueTicket, QueueTicketStatus } from '../models/QueueTicket.js';

export interface LiveQueueCalculationResult {
  currentPosition: number; // Patients ahead + 1
  patientsAhead: number;   // Patients strictly ahead in WAITING status
  nowServingTicket: string | null;
  nowServingStatus: QueueTicketStatus | null;
  estimatedWaitMins: number; // Position * 6 mins
  status: QueueTicketStatus;
}

export class QueueCalculationService {
  /**
   * Generates atomic next sequence number for a department on a given date string (YYYY-MM-DD)
   */
  static async getNextSequence(deptCode: string, dateStr: string): Promise<{ sequence: number; ticketNumber: string }> {
    const scopeKey = `DEPT:${deptCode.toUpperCase()}:${dateStr}`;
    
    const counter = await QueueCounter.findOneAndUpdate(
      { scopeKey },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    const sequence = counter.sequence;
    const prefix = deptCode.substring(0, 4).toUpperCase();
    const formattedNum = String(sequence).padStart(3, '0');
    const ticketNumber = `${prefix}-${formattedNum}`;

    return { sequence, ticketNumber };
  }

  /**
   * Calculates live position, now serving, and estimated wait for a specific ticket
   */
  static async calculateLiveQueueState(ticket: IQueueTicket): Promise<LiveQueueCalculationResult> {
    // If ticket is already finished or cancelled
    if (['COMPLETED', 'CANCELLED'].includes(ticket.status)) {
      return {
        currentPosition: 0,
        patientsAhead: 0,
        nowServingTicket: null,
        nowServingStatus: null,
        estimatedWaitMins: 0,
        status: ticket.status,
      };
    }

    // Find currently active ticket being served for this doctor/department
    const nowServing = await QueueTicket.findOne({
      doctor: ticket.doctor,
      status: { $in: ['CALLING', 'IN_CONSULTATION'] },
    }).sort({ updatedAt: -1 });

    // Count tickets strictly ahead in queue that are active (WAITING / ALMOST_TURN)
    const activeAheadCount = await QueueTicket.countDocuments({
      doctor: ticket.doctor,
      status: { $in: ['WAITING', 'ALMOST_TURN'] },
      sequenceNumber: { $lt: ticket.sequenceNumber },
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    let currentPosition = activeAheadCount + 1;
    let computedStatus = ticket.status;

    if (ticket.status === 'WAITING' || ticket.status === 'ALMOST_TURN') {
      if (currentPosition <= 2 && currentPosition > 0) {
        computedStatus = 'ALMOST_TURN';
      } else {
        computedStatus = 'WAITING';
      }
    }

    const estimatedWaitMins = activeAheadCount * 6; // 6 mins per patient estimate

    return {
      currentPosition,
      patientsAhead: activeAheadCount,
      nowServingTicket: nowServing ? nowServing.ticketNumber : null,
      nowServingStatus: nowServing ? nowServing.status : null,
      estimatedWaitMins,
      status: computedStatus,
    };
  }
}
