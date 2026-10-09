import { QueueTicket, IQueueTicket, QueueTicketStatus } from '../models/QueueTicket.js';
import { Appointment } from '../models/Appointment.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { QueueCalculationService, LiveQueueCalculationResult } from './queueCalculation.service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import mongoose from 'mongoose';

const transitionSources: Partial<Record<QueueTicketStatus, QueueTicketStatus[]>> = {
  CALLING: ['WAITING', 'ALMOST_TURN'],
  IN_CONSULTATION: ['CALLING'],
  COMPLETED: ['IN_CONSULTATION'],
  HELD: ['WAITING', 'ALMOST_TURN'],
  SKIPPED: ['WAITING', 'ALMOST_TURN', 'CALLING'],
};

export class QueueService {
  /**
   * Get active queue ticket for authenticated patient
   */
  static async getMyActiveTicket(patientId: string): Promise<{
    ticketId: string;
    ticketNumber: string;
    sequenceNumber: number;
    currentPosition: number;
    patientsAhead: number;
    aheadTickets: LiveQueueCalculationResult['aheadTickets'];
    nowServing: string | null;
    nowServingStatus: QueueTicketStatus | null;
    estimatedWaitMins: number;
    status: QueueTicketStatus;
    checkedInAt: Date | undefined;
    arrivedAt: Date | undefined;
    calledAt: Date | undefined;
    consultationStartedAt: Date | undefined;
    completedAt: Date | undefined;
    department: IQueueTicket['department'];
    doctor: IQueueTicket['doctor'];
    appointment: IQueueTicket['appointment'];
    lastUpdated: string;
  } | null> {
    validateObjectId(patientId, 'patient ID');

    const today = QueueCalculationService.getQueueDayRange();

    let ticket = await QueueTicket.findOne({
      patient: patientId,
      status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] },
      createdAt: today,
    })
      .sort({ createdAt: -1, _id: -1 })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber consultationFee')
      .populate('department', 'name code roomNumber description')
      .populate('appointment', 'appointmentDate timeSlot reason status');

    // Keep the latest finished/skipped ticket visible after it leaves the active queue.
    if (!ticket) {
      ticket = await QueueTicket.findOne({
        patient: patientId,
        status: { $in: ['SKIPPED', 'COMPLETED', 'CANCELLED'] },
        createdAt: today,
      })
        .sort({ createdAt: -1, _id: -1 })
        .populate('patient', 'name email phone')
        .populate('doctor', 'name title roomNumber consultationFee')
        .populate('department', 'name code roomNumber description')
        .populate('appointment', 'appointmentDate timeSlot reason status');
    }

    if (!ticket) {
      return null;
    }

    // Calculate dynamic live state
    const liveState = await QueueCalculationService.calculateLiveQueueState(ticket);

    // Update ticket status & send notification if transitioned to ALMOST_TURN
    if (ticket.status !== liveState.status && ['WAITING', 'ALMOST_TURN'].includes(ticket.status)) {
      const updated = await QueueTicket.findOneAndUpdate(
        { _id: ticket._id, status: ticket.status },
        { $set: {
          status: liveState.status,
          currentPosition: liveState.currentPosition,
          estimatedWaitMins: liveState.estimatedWaitMins,
        } },
        { new: true }
      );

      // A staff mutation won the race; recalculate from the current persisted state.
      if (!updated) return this.getMyActiveTicket(patientId);
    }

    // Also covers tickets initially checked in as ALMOST_TURN and retries after failures.
    // The notification service atomically returns the same ticket-scoped alert on polling.
    if (liveState.status === 'ALMOST_TURN') {
      await NotificationService.createNotification({
        userId: patientId,
        title: 'Almost Your Turn!',
        message: `You are position ${liveState.currentPosition} in line for your appointment. Please start moving towards the OPD room.`,
        category: 'ALMOST_TURN',
        queueTicketId: ticket._id.toString(),
        appointmentId: ticket.appointment._id.toString(),
      });
    }

    return {
      ticketId: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      currentPosition: liveState.currentPosition,
      patientsAhead: liveState.patientsAhead,
      aheadTickets: liveState.aheadTickets,
      nowServing: liveState.nowServingTicket,
      nowServingStatus: liveState.nowServingStatus,
      estimatedWaitMins: liveState.estimatedWaitMins,
      status: liveState.status,
      checkedInAt: ticket.checkedInAt,
      arrivedAt: ticket.arrivedAt,
      calledAt: ticket.calledAt,
      consultationStartedAt: ticket.consultationStartedAt,
      completedAt: ticket.completedAt,
      department: ticket.department,
      doctor: ticket.doctor,
      appointment: ticket.appointment,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Patient check-in to an appointment
   */
  static async checkIn(patientId: string, appointmentId: string): Promise<IQueueTicket> {
    validateObjectId(patientId, 'patient ID');
    validateObjectId(appointmentId, 'appointment ID');

    const patientUser = await User.findById(patientId);
    if (!patientUser || !patientUser.isActive) {
      throw new AppError('Patient account not found or inactive', 401);
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.patient.toString() !== patientId) {
      throw new AppError('Access forbidden: You can only check in to your own appointments', 403);
    }

    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
      throw new AppError(`Cannot check in for an appointment with status ${appointment.status}`, 400);
    }

    const existingTicket = await QueueTicket.findOne({
      appointment: appointmentId,
      status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] },
    });

    if (existingTicket) {
      throw new AppError('You have already checked in for this appointment', 409);
    }

    const doctorObj = appointment.doctor as any;
    const departmentId = doctorObj.department;
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new AppError('Department not found for doctor', 404);
    }

    const checkedInAt = new Date();
    const { sequence, ticketNumber } = await QueueCalculationService.getNextSequence(
      department.code,
      checkedInAt
    );

    const ticket = new QueueTicket({
      ticketNumber,
      sequenceNumber: sequence,
      appointment: appointment._id,
      patient: patientId,
      doctor: doctorObj._id,
      department: department._id,
      currentPosition: 1,
      estimatedWaitMins: 0,
      status: 'WAITING',
      checkedInAt,
      createdAt: checkedInAt,
    });

    const liveState = await QueueCalculationService.calculateLiveQueueState(ticket);
    ticket.currentPosition = liveState.currentPosition;
    ticket.estimatedWaitMins = liveState.estimatedWaitMins;
    ticket.status = liveState.status;

    await ticket.save();

    appointment.queueTicket = ticket._id as any;
    await appointment.save();

    await NotificationService.createNotification({
      userId: patientId,
      title: 'Queue Check-In Successful',
      message: `Your queue ticket ${ticket.ticketNumber} has been issued for ${department.name}.`,
      category: 'QUEUE_CREATED',
      queueTicketId: ticket._id.toString(),
      appointmentId: appointment._id.toString(),
    });

    return (await QueueTicket.findById(ticket._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber')
      .populate('department', 'name code roomNumber')) as IQueueTicket;
  }

  /**
   * Staff GET /api/queue — active queue list with optional filters
   */
  static async getAllForStaff(params: {
    departmentId?: string;
    doctorId?: string;
    status?: QueueTicketStatus;
    date?: string;
  }): Promise<IQueueTicket[]> {
    const filter: Record<string, unknown> = {};

    const queueDate = params.date ?? new Date();
    filter.createdAt = QueueCalculationService.getQueueDayRange(queueDate);

    if (params.departmentId) {
      validateObjectId(params.departmentId, 'department ID');
      filter.department = params.departmentId;
    }

    if (params.doctorId) {
      validateObjectId(params.doctorId, 'doctor ID');
      filter.doctor = params.doctorId;
    }

    if (params.status) {
      filter.status = params.status;
    }

    return await QueueTicket.find(filter)
      .populate('patient', 'name email phone nic')
      .populate('doctor', 'name title roomNumber')
      .populate('department', 'name code roomNumber')
      .populate('appointment', 'appointmentDate timeSlot reason')
      .sort({ sequenceNumber: 1 });
  }

  /**
   * Staff POST /api/queue/call-next
   */
  static async callNext(params: { doctorId?: string; departmentId?: string }): Promise<IQueueTicket> {
    const filter: Record<string, unknown> = {
      status: { $in: transitionSources.CALLING },
      createdAt: QueueCalculationService.getQueueDayRange(),
    };

    if (params.doctorId) {
      validateObjectId(params.doctorId, 'doctor ID');
      filter.doctor = params.doctorId;
    }

    if (params.departmentId) {
      validateObjectId(params.departmentId, 'department ID');
      filter.department = params.departmentId;
    }

    // Atomically find next ticket in sequence and set status CALLING
    const ticket = await QueueTicket.findOneAndUpdate(
      filter,
      {
        $set: {
          status: 'CALLING',
          calledAt: new Date(),
          currentPosition: 0,
          estimatedWaitMins: 0,
        },
      },
      { sort: { sequenceNumber: 1 }, new: true }
    )
      .populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber')
      .populate('department', 'name code roomNumber');

    if (!ticket) {
      throw new AppError('No eligible waiting patients in queue to call', 404);
    }

    // Create YOUR_TURN notification for called patient
    await NotificationService.createNotification({
      userId: ticket.patient._id.toString(),
      title: "It's Your Turn!",
      message: `Queue ticket ${ticket.ticketNumber} is now being called. Please proceed immediately to room ${(ticket.doctor as any).roomNumber || (ticket.department as any).roomNumber}.`,
      category: 'YOUR_TURN',
      queueTicketId: ticket._id.toString(),
      appointmentId: ticket.appointment?.toString(),
    });

    return ticket;
  }

  /**
   * Staff PATCH /api/queue/:id/start-consultation
   */
  static async startConsultation(ticketId: string): Promise<IQueueTicket> {
    return this.transitionTicket(ticketId, 'IN_CONSULTATION', {
      consultationStartedAt: new Date(),
    });
  }

  /**
   * Staff PATCH /api/queue/:id/complete
   */
  static async completeConsultation(ticketId: string): Promise<IQueueTicket> {
    const ticket = await this.transitionTicket(ticketId, 'COMPLETED', {
      completedAt: new Date(),
    });

    // Optionally update linked appointment status to COMPLETED
    if (ticket.appointment) {
      await Appointment.findByIdAndUpdate(ticket.appointment, { status: 'COMPLETED' });
    }

    return ticket;
  }

  /**
   * Staff PATCH /api/queue/:id/hold
   */
  static async hold(ticketId: string): Promise<IQueueTicket> {
    const ticket = await this.transitionTicket(ticketId, 'HELD');
    await this.notifyStatusUpdate(ticket, 'Queue Ticket On Hold', `Your queue ticket ${ticket.ticketNumber} has been placed on hold. Please contact reception for guidance.`);
    return ticket;
  }

  /**
   * Staff PATCH /api/queue/:id/skip
   */
  static async skip(ticketId: string): Promise<IQueueTicket> {
    const ticket = await this.transitionTicket(ticketId, 'SKIPPED');
    await this.notifyStatusUpdate(ticket, 'Queue Ticket Skipped', `Your queue ticket ${ticket.ticketNumber} has been skipped. Please speak to reception about the next steps.`);
    return ticket;
  }

  private static async notifyStatusUpdate(ticket: IQueueTicket, title: string, message: string): Promise<void> {
    // Only the winner of the guarded atomic transition reaches this call.
    // Repeated/invalid requests return 409 before creating any notification.
    await NotificationService.createNotification({
      userId: ticket.patient._id.toString(),
      queueTicketId: ticket._id.toString(),
      appointmentId: ticket.appointment.toString(),
      category: 'QUEUE_UPDATE',
      title,
      message,
    });
  }

  static async markArrived(ticketId: string, patientId: string): Promise<{ ticketId: string; arrivedAt: Date }> {
    validateObjectId(ticketId, 'queue ticket ID');
    validateObjectId(patientId, 'patient ID');
    const filter = { _id: ticketId, patient: patientId, status: 'CALLING', createdAt: QueueCalculationService.getQueueDayRange() };
    const ticket = await QueueTicket.findOneAndUpdate(
      { ...filter, arrivedAt: { $exists: false } },
      { $set: { arrivedAt: new Date() } },
      { new: true }
    ) ?? await QueueTicket.findOne(filter);
    if (ticket?.arrivedAt) return { ticketId: ticket._id.toString(), arrivedAt: ticket.arrivedAt };
    const existing = await QueueTicket.findById(ticketId);
    if (!existing) throw new AppError('Queue ticket not found', 404);
    if (existing.patient.toString() !== patientId) throw new AppError('You can only confirm arrival for your own ticket', 403);
    throw new AppError('Arrival can only be confirmed for a ticket being called today', 409);
  }

  static async resume(ticketId: string, staffId: string): Promise<IQueueTicket> {
    validateObjectId(ticketId, 'queue ticket ID');
    validateObjectId(staffId, 'staff ID');
    const session = await mongoose.startSession();
    try {
      const resumed = await session.withTransaction(async () => {
        const ticket = await QueueTicket.findOneAndUpdate(
          { _id: ticketId, status: 'HELD', createdAt: QueueCalculationService.getQueueDayRange() },
          { $set: { status: 'WAITING' }, $push: { resumeHistory: { at: new Date(), by: staffId } } },
          { new: true, session }
        );
        if (!ticket) {
          const existing = await QueueTicket.findById(ticketId).session(session);
          if (!existing) throw new AppError('Queue ticket not found', 404);
          throw new AppError('Only a held ticket from today can be resumed', 409);
        }
        // Retain the issued sequence and number; waiting positions follow current state.
        await QueueCalculationService.recalculateWaitingPositions(ticket, session);
        await NotificationService.createNotification({
          userId: ticket.patient.toString(), queueTicketId: ticket._id.toString(),
          appointmentId: ticket.appointment.toString(), category: 'QUEUE_UPDATE',
          title: 'Queue Ticket Resumed',
          message: `Your ticket ${ticket.ticketNumber} has returned to the waiting queue. Please wait until it is called.`,
        }, session);
        return QueueTicket.findById(ticket._id).session(session)
          .populate('patient', 'name email phone').populate('doctor', 'name title roomNumber')
          .populate('department', 'name code roomNumber');
      });
      if (!resumed) throw new AppError('Unable to resume queue ticket', 409);
      return resumed;
    } finally {
      await session.endSession();
    }
  }

  private static async transitionTicket(
    ticketId: string,
    target: QueueTicketStatus,
    timestamps: { consultationStartedAt?: Date; completedAt?: Date } = {}
  ): Promise<IQueueTicket> {
    validateObjectId(ticketId, 'queue ticket ID');

    const sources = transitionSources[target]!;
    const ticket = await QueueTicket.findOneAndUpdate(
      { _id: ticketId, status: { $in: sources } },
      { $set: { ...timestamps, status: target, currentPosition: 0, estimatedWaitMins: 0 } },
      { new: true }
    )
      .populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber')
      .populate('department', 'name code roomNumber');

    if (!ticket) {
      const existing = await QueueTicket.findById(ticketId);
      if (!existing) throw new AppError('Queue ticket not found', 404);
      throw new AppError(
        `Cannot transition queue ticket from ${existing.status} to ${target}; expected ${sources.join(' or ')}`,
        409
      );
    }

    return ticket;
  }
}

