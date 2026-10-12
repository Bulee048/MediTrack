import { hospitalDate } from '../utils/hospitalDate.js';
import type { ClientSession } from 'mongoose';
import { QueueCounter } from '../models/QueueCounter.js';
import { QueueTicket, IQueueTicket, QueueTicketStatus } from '../models/QueueTicket.js';

export interface LiveQueueCalculationResult {
  currentPosition: number; // Patients ahead + 1 for waiting tickets; otherwise 0
  patientsAhead: number;   // Patients strictly ahead in active waiting states
  nowServingTicket: string | null;
  nowServingStatus: QueueTicketStatus | null;
  estimatedWaitMins: number; // Waiting patients ahead plus current service estimate
  status: QueueTicketStatus;
}

type QueueSnapshotTicket = Pick<IQueueTicket, 'doctor' | 'department' | 'createdAt' | 'status' | 'sequenceNumber' | 'ticketNumber' | 'updatedAt' | 'consultationStartedAt'>;
const referenceId = (value: unknown) => value && typeof value === 'object' && '_id' in value ? String(value._id) : String(value);

export class QueueCalculationService {
  static getQueueDayRange(date: Date = new Date()) {
    const start = new Date(`${hospitalDate(date)}T00:00:00+05:30`);
    const end = new Date(start.getTime() + 86400000);
    return { $gte: start, $lt: end };
  }

  /**
   * Generates atomic next sequence number for a department on a given date string (YYYY-MM-DD)
   */
  static async getNextSequence(deptCode: string, dateStr: string, session?: ClientSession): Promise<{ sequence: number; ticketNumber: string }> {
    const scopeKey = `DEPT:${deptCode.toUpperCase()}:${dateStr}`;

    const counter = await QueueCounter.findOneAndUpdate(
      { scopeKey },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, session }
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
  static async loadLiveTickets(scope: Record<string, unknown>): Promise<QueueSnapshotTicket[]> {
    return QueueTicket.find({ ...scope, status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION'] } })
      .select('doctor department createdAt status sequenceNumber ticketNumber updatedAt consultationStartedAt').lean();
  }

  static async calculateLiveQueueState(ticket: IQueueTicket, snapshot?: readonly QueueSnapshotTicket[]): Promise<LiveQueueCalculationResult> {
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

    // One narrow queue read per scope, or a shared staff-board snapshot. Avoid
    // two service lookups and a count query for every returned ticket.
    const candidates = snapshot ?? await this.loadLiveTickets(context);
    const scoped = candidates.filter(item =>
      referenceId(item.doctor) === referenceId(ticket.doctor) &&
      referenceId(item.department) === referenceId(ticket.department) &&
      item.createdAt >= context.createdAt.$gte && item.createdAt < context.createdAt.$lt);
    const recent = (items: readonly QueueSnapshotTicket[]) => [...items].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const nowServing = recent(scoped.filter(item => item.status === 'CALLING'))
      ?? recent(scoped.filter(item => item.status === 'IN_CONSULTATION'));
    const isWaiting = ticket.status === 'WAITING' || ticket.status === 'ALMOST_TURN';
    const activeAheadCount = isWaiting ? scoped.filter(item =>
      ['WAITING', 'ALMOST_TURN'].includes(item.status) && item.sequenceNumber < ticket.sequenceNumber).length : 0;

    const currentPosition = isWaiting ? activeAheadCount + 1 : 0;
    let computedStatus = ticket.status;

    if (ticket.status === 'WAITING' && currentPosition <= 2) {
      computedStatus = 'ALMOST_TURN';
    } else if (ticket.status === 'ALMOST_TURN' && currentPosition > 2) {
      computedStatus = 'WAITING';
    }

    // No configured consultation duration exists in the doctor schema. Keep
    // the six-minute fallback explicit and add remaining current service time.
    const typicalMinutes = 6;
    let remainingService = 0;
    if (isWaiting && nowServing) {
      const started = nowServing.consultationStartedAt?.getTime();
      const elapsed = nowServing.status === 'IN_CONSULTATION' && started !== undefined && Number.isFinite(started)
        ? Math.max(0, (Date.now() - started) / 60000) : 0;
      remainingService = Math.max(0, typicalMinutes - elapsed);
    }
    const estimatedWaitMins = isWaiting ? Math.ceil(activeAheadCount * typicalMinutes + remainingService) : 0;

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
