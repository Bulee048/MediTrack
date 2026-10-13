import { hospitalDate } from '../utils/hospitalDate.js';
import mongoose from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { QueueTicket, IQueueTicket, QueueTicketStatus } from '../models/QueueTicket.js';
import { Appointment } from '../models/Appointment.js';
import { Department } from '../models/Department.js';
import { User, UserRole } from '../models/User.js';
import { QueueCalculationService } from './queueCalculation.service.js';
import { Notification } from '../models/Notification.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';

const transitionSources: Partial<Record<QueueTicketStatus, QueueTicketStatus[]>> = {
  WAITING: ['HELD'],
  CALLING: ['WAITING', 'ALMOST_TURN'],
  IN_CONSULTATION: ['CALLING'],
  COMPLETED: ['IN_CONSULTATION'],
  HELD: ['WAITING', 'ALMOST_TURN'],
  SKIPPED: ['WAITING', 'ALMOST_TURN', 'CALLING'],
};

// Explicit development-only timing opt-in; never logs credentials or payloads.
const logQueueTransaction = (operation: string, started: number) => {
  if (process.env.NODE_ENV !== 'production' && process.env.QUEUE_AUDIT_TIMINGS === 'true')
    console.info(`QUEUE_TRANSACTION ${operation} completedAt=${new Date().toISOString()} durationMs=${(performance.now() - started).toFixed(1)}`);
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
    nowServing: string | null;
    nowServingStatus: QueueTicketStatus | null;
    estimatedWaitMins: number;
    status: QueueTicketStatus;
    checkedInAt: Date | undefined;
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
      nowServing: liveState.nowServingTicket,
      nowServingStatus: liveState.nowServingStatus,
      estimatedWaitMins: liveState.estimatedWaitMins,
      status: liveState.status,
      checkedInAt: ticket.checkedInAt,
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

    let createdId = '';
    const transactionStarted = performance.now();
    await mongoose.connection.transaction(async session => {
      // Coordinate check-in with booking/account operations and concurrent check-ins.
      const patient = await User.findOneAndUpdate({ _id: patientId, role: 'PATIENT', isActive: true },
        { $inc: { __v: 1 } }, { session, new: true, timestamps: false });
      if (!patient) throw new AppError('Patient account not found or inactive', 401);
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment) throw new AppError('Appointment not found', 404);
      if (appointment.patient.toString() !== patientId) throw new AppError('You can only check in to your own appointments', 403);
      if (!['BOOKED', 'RESCHEDULED'].includes(appointment.status)) throw new AppError('Only active appointments can check in', 409);
      const today = hospitalDate();
      if (appointment.appointmentDate.toISOString().slice(0, 10) !== today)
        throw new AppError('Check-in is available only on the appointment date', 409);
      if (appointment.queueTicket || await QueueTicket.exists({ patient: patientId,
        createdAt: QueueCalculationService.getQueueDayRange(),
        status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] } }).session(session))
        throw new AppError('You already have a checked-in appointment or active queue ticket', 409);
      const doctor = await Doctor.findById(appointment.doctor).session(session);
      if (!doctor) throw new AppError('Doctor not found', 404);
      const department = await Department.findById(doctor.department).session(session);
      if (!department) throw new AppError('Department not found for doctor', 404);
      const { sequence, ticketNumber } = await QueueCalculationService.getNextSequence(department.code, today, session);
      const ticket = new QueueTicket({ ticketNumber, sequenceNumber: sequence, appointment: appointment._id,
        patient: patientId, doctor: doctor._id, department: department._id, status: 'WAITING', checkedInAt: new Date() });
      const live = await QueueCalculationService.calculateLiveQueueState(ticket);
      ticket.currentPosition = live.currentPosition; ticket.estimatedWaitMins = live.estimatedWaitMins; ticket.status = live.status;
      await ticket.save({ session });
      appointment.queueTicket = ticket._id;
      await appointment.save({ session });
      await NotificationService.createNotification({ userId: patientId, queueTicketId: ticket._id.toString(), appointmentId,
        category: 'QUEUE_CREATED', title: 'Queue Check-In Successful', message: `Your queue ticket ${ticketNumber} has been issued for ${department.name}.` }, session);
      createdId = ticket._id.toString();
    });
    logQueueTransaction('check-in', transactionStarted);
    return (await QueueTicket.findById(createdId).populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber').populate('department', 'name code roomNumber'))!;
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

    const queueDate = params.date
      ? new Date(params.date)
      : new Date();
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

    const tickets = await QueueTicket.find(filter)
      .populate('patient', 'name email phone nic')
      .populate('doctor', 'name title roomNumber')
      .populate('department', 'name code roomNumber')
      .populate({path:'appointment',select:'appointmentDate timeSlot reason familyMember',populate:{path:'familyMember',select:'name relationship'}})
      .sort({ sequenceNumber: 1 });
    // Recalculate positions from the complete waiting scope, even when the
    // requested list filters out some statuses. Keep stored status unchanged:
    // ALMOST_TURN persistence and notification creation belong to queue/me.
    const { status: _status, ...scope } = filter;
    const snapshot = tickets.some(ticket => !['COMPLETED', 'CANCELLED'].includes(ticket.status))
      ? await QueueCalculationService.loadLiveTickets(scope) : [];
    await Promise.all(tickets.map(async ticket => {
      const live = await QueueCalculationService.calculateLiveQueueState(ticket, snapshot);
      ticket.currentPosition = live.currentPosition;
      ticket.estimatedWaitMins = live.estimatedWaitMins;
    }));
    return tickets;
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

    // Serialize calls for the selected doctor across application instances.
    // A ticket update alone prevents duplicate selection, but can call two
    // different patients concurrently unless the entire service scope is locked.
    await Notification.init();
    let calledId = '';
    const transactionStarted = performance.now();
    await mongoose.connection.transaction(async session => {
      const candidate = await QueueTicket.findOne(filter).sort({ sequenceNumber: 1 }).session(session);
      if (!candidate) throw new AppError('No eligible waiting patients in queue to call', 404);
      const doctor = await Doctor.findOneAndUpdate({ _id: candidate.doctor },
        { $inc: { __v: 1 } }, { session, new: true, timestamps: false });
      if (!doctor) throw new AppError('Doctor not found', 404);
      const busy = await QueueTicket.exists({ doctor: candidate.doctor,
        createdAt: QueueCalculationService.getQueueDayRange(), status: { $in: ['CALLING', 'IN_CONSULTATION'] } }).session(session);
      if (busy) throw new AppError('This doctor already has a called patient or consultation in progress', 409);
      const ticket = await QueueTicket.findOneAndUpdate({ _id: candidate._id, status: { $in: transitionSources.CALLING } },
        { $set: { status: 'CALLING', calledAt: new Date(), currentPosition: 0, estimatedWaitMins: 0 } },
        { session, new: true });
      if (!ticket) throw new AppError('Queue changed; refresh before calling next', 409);
      await NotificationService.createNotification({ userId: ticket.patient.toString(), title: "It's Your Turn!",
        message: `Queue ticket ${ticket.ticketNumber} is now being called. Please proceed immediately to room ${doctor.roomNumber || 'the OPD room'}.`,
        category: 'YOUR_TURN', queueTicketId: ticket._id.toString(), appointmentId: ticket.appointment.toString() }, session);
      calledId = ticket._id.toString();
    });
    logQueueTransaction('call-next', transactionStarted);
    return (await QueueTicket.findById(calledId).populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber').populate('department', 'name code roomNumber'))!;
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

    return ticket;
  }

  /**
   * Staff PATCH /api/queue/:id/hold
   */
  static async hold(ticketId: string): Promise<IQueueTicket> {
    return this.transitionTicket(ticketId, 'HELD');
  }

  static async resume(ticketId: string): Promise<IQueueTicket> {
    return this.transitionTicket(ticketId, 'WAITING');
  }

  /**
   * DELETE /api/queue/:id
   * Patients cancel their own WAITING/HELD ticket; staff/admin cancel any
   * ticket that has not been COMPLETED. Unlinking the appointment lets the
   * patient check in again.
   */
  static async cancelTicket(ticketId: string, requesterId: string, requesterRole: UserRole): Promise<IQueueTicket> {
    validateObjectId(ticketId, 'queue ticket ID');
    validateObjectId(requesterId, 'requester ID');
    if (!['PATIENT', 'STAFF', 'ADMIN'].includes(requesterRole))
      throw new AppError('Queue cancellation is not permitted for this account', 403);

    const transactionStarted = performance.now();
    await mongoose.connection.transaction(async session => {
      const ticket = await QueueTicket.findById(ticketId).session(session);
      if (!ticket) throw new AppError('Queue ticket not found', 404);

      if (requesterRole === 'PATIENT') {
        if (ticket.patient.toString() !== requesterId)
          throw new AppError('You can only cancel your own queue ticket', 403);
        if (!['WAITING', 'HELD'].includes(ticket.status))
          throw new AppError(`Only a waiting or held queue ticket can be cancelled; this ticket is ${ticket.status.toLowerCase().replace(/_/g, ' ')}`, 409);
      } else if (ticket.status === 'COMPLETED') {
        throw new AppError('Completed queue tickets cannot be cancelled', 409);
      }

      // Repeated staff requests are harmless and must not unlink a later check-in.
      if (ticket.status === 'CANCELLED') return;

      ticket.status = 'CANCELLED';
      ticket.currentPosition = 0;
      ticket.estimatedWaitMins = 0;
      await ticket.save({ session });

      // Unlink the appointment so the patient can check in again.
      await Appointment.updateOne({ _id: ticket.appointment, queueTicket: ticket._id },
        { $set: { queueTicket: null } }, { session });

      await NotificationService.createNotification({ userId: ticket.patient.toString(),
        queueTicketId: ticket._id.toString(), appointmentId: ticket.appointment.toString(), category: 'QUEUE_CANCELLED',
        title: 'Queue ticket cancelled',
        message: `Your queue ticket ${ticket.ticketNumber} has been cancelled. Check in again from your appointment if you still need to be seen.` }, session);
    });
    logQueueTransaction('cancel', transactionStarted);
    return (await QueueTicket.findById(ticketId).populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber').populate('department', 'name code roomNumber'))!;
  }

  /**
   * Staff PATCH /api/queue/:id/skip
   */
  static async skip(ticketId: string): Promise<IQueueTicket> {
    return this.transitionTicket(ticketId, 'SKIPPED');
  }

  private static async transitionTicket(
    ticketId: string,
    target: QueueTicketStatus,
    timestamps: { consultationStartedAt?: Date; completedAt?: Date } = {}
  ): Promise<IQueueTicket> {
    validateObjectId(ticketId, 'queue ticket ID');

    const sources = transitionSources[target]!;
    const transactionStarted = performance.now();
    await mongoose.connection.transaction(async session => {
      const ticket = await QueueTicket.findOneAndUpdate(
        { _id: ticketId, status: { $in: sources }, ...(target === 'WAITING' ? { createdAt: QueueCalculationService.getQueueDayRange() } : {}) },
        { $set: { ...timestamps, status: target, currentPosition: 0, estimatedWaitMins: 0 } }, { new: true, session });
      if (!ticket) {
        const existing = await QueueTicket.findById(ticketId).session(session);
        if (!existing) throw new AppError('Queue ticket not found', 404);
        if (target === 'WAITING' && hospitalDate(existing.createdAt) !== hospitalDate())
          throw new AppError("Only today's held tickets can return to the waiting queue; arrange a new appointment for another day", 409);
        throw new AppError(`Cannot transition queue ticket from ${existing.status} to ${target}; expected ${sources.join(' or ')}`, 409);
      }
      if (target === 'COMPLETED') {
        const appointment = await Appointment.findByIdAndUpdate(ticket.appointment, { status: 'COMPLETED' }, { session });
        if (!appointment) throw new AppError('Linked appointment not found', 409);
      }
      if (target === 'WAITING') {
        const appointment = await Appointment.findById(ticket.appointment).session(session);
        if (!appointment || !['BOOKED', 'RESCHEDULED'].includes(appointment.status) || hospitalDate(appointment.appointmentDate) !== hospitalDate())
          throw new AppError('Only a held ticket with an active appointment can return to the queue', 409);
      }
      await NotificationService.createNotification({ userId: ticket.patient.toString(),
        queueTicketId: ticket._id.toString(), appointmentId: ticket.appointment.toString(), category: 'QUEUE_UPDATE',
        title: 'Queue status updated', message: `Your ticket ${ticket.ticketNumber} is now ${target.toLowerCase().replace(/_/g, ' ')}.` }, session);
    });
    logQueueTransaction(`transition:${target}`, transactionStarted);
    return (await QueueTicket.findById(ticketId).populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber').populate('department', 'name code roomNumber'))!;
  }
}
