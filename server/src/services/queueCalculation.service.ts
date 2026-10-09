import { QueueCounter } from '../models/QueueCounter.js';
import { QueueTicket, IQueueTicket, QueueTicketStatus } from '../models/QueueTicket.js';
import { ClientSession } from 'mongoose';
import { getQueueDayKey, getQueueDayRange } from '../utils/queueDay.js';

export interface LiveQueueCalculationResult {
  currentPosition: number; // Patients ahead + 1 for waiting tickets; otherwise 0
  patientsAhead: number;   // Patients strictly ahead in active waiting states
  nowServingTicket: string | null;
  nowServingStatus: QueueTicketStatus | null;
  estimatedWaitMins: number; // Patients ahead * 6 mins
  status: QueueTicketStatus;
}

export class QueueCalculationService {
  static getQueueDayRange(date: Date | string = new Date()) {
    return getQueueDayRange(date);
  }

  /**
   * Generates an atomic sequence for the department's Colombo queue day.
   */
  static async getNextSequence(deptCode: string, date: Date = new Date()): Promise<{ sequence: number; ticketNumber: string }> {
    const scopeKey = `DEPT:${deptCode.toUpperCase()}:${getQueueDayKey(date)}`;
    
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

  static async recalculateWaitingPositions(ticket: IQueueTicket, session: ClientSession): Promise<void> {
    const waiting = await QueueTicket.find({
      doctor: ticket.doctor,
      department: ticket.department,
      createdAt: getQueueDayRange(ticket.createdAt),
      status: { $in: ['WAITING', 'ALMOST_TURN'] },
    }).sort({ sequenceNumber: 1, _id: 1 }).session(session);

    for (const [index, entry] of waiting.entries()) {
      await QueueTicket.updateOne(
        { _id: entry._id, status: { $in: ['WAITING', 'ALMOST_TURN'] } },
        { $set: { currentPosition: index + 1, estimatedWaitMins: index * 6 } },
        { session }
      );
    }
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

    const context = {
      doctor: ticket.doctor,
      department: ticket.department,
      createdAt: this.getQueueDayRange(ticket.createdAt ?? ticket.checkedInAt ?? new Date()),
    };

    // Prefer a calling ticket, even when a consultation was updated more recently.
    const nowServing = await QueueTicket.findOne({ ...context, status: 'CALLING' })
      .sort({ updatedAt: -1 })
      ?? await QueueTicket.findOne({ ...context, status: 'IN_CONSULTATION' })
        .sort({ updatedAt: -1 });

    const isWaiting = ticket.status === 'WAITING' || ticket.status === 'ALMOST_TURN';

    // Count tickets strictly ahead in queue that are active (WAITING / ALMOST_TURN)
    const activeAheadCount = isWaiting ? await QueueTicket.countDocuments({
      ...context,
      status: { $in: ['WAITING', 'ALMOST_TURN'] },
      sequenceNumber: { $lt: ticket.sequenceNumber },
    }) : 0;

    const currentPosition = isWaiting ? activeAheadCount + 1 : 0;
    let computedStatus = ticket.status;

    if (ticket.status === 'WAITING' && currentPosition <= 2) {
      computedStatus = 'ALMOST_TURN';
    } else if (ticket.status === 'ALMOST_TURN' && currentPosition > 2) {
      computedStatus = 'WAITING';
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
