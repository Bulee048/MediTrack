import { QueueTicket, IQueueTicket } from '../models/QueueTicket.js';
import { Appointment } from '../models/Appointment.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { QueueCalculationService } from './queueCalculation.service.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';

export class QueueService {
  /**
   * Get active queue ticket for authenticated patient
   */
  static async getMyActiveTicket(patientId: string) {
    validateObjectId(patientId, 'patient ID');

    // Find latest active ticket for patient (created today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const ticket = await QueueTicket.findOne({
      patient: patientId,
      status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] },
      createdAt: { $gte: startOfToday },
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber consultationFee')
      .populate('department', 'name code roomNumber description')
      .populate('appointment', 'appointmentDate timeSlot reason status');

    if (!ticket) {
      return null;
    }

    // Calculate dynamic live state
    const liveState = await QueueCalculationService.calculateLiveQueueState(ticket);

    // Update ticket status in DB if changed to ALMOST_TURN
    if (ticket.status !== liveState.status && ['WAITING', 'ALMOST_TURN'].includes(ticket.status)) {
      ticket.status = liveState.status;
      ticket.currentPosition = liveState.currentPosition;
      ticket.estimatedWaitMins = liveState.estimatedWaitMins;
      await ticket.save();
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

    // 1. Verify patient user
    const patientUser = await User.findById(patientId);
    if (!patientUser || !patientUser.isActive) {
      throw new AppError('Patient account not found or inactive', 401);
    }

    // 2. Verify appointment
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

    // 3. Prevent duplicate active queue ticket for same appointment
    const existingTicket = await QueueTicket.findOne({
      appointment: appointmentId,
      status: { $in: ['WAITING', 'ALMOST_TURN', 'CALLING', 'IN_CONSULTATION', 'HELD'] },
    });

    if (existingTicket) {
      throw new AppError('You have already checked in for this appointment', 409);
    }

    // 4. Fetch department
    const doctorObj = appointment.doctor as any;
    const departmentId = doctorObj.department;
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new AppError('Department not found for doctor', 404);
    }

    // 5. Generate sequence and ticket number
    const todayStr = new Date().toISOString().split('T')[0];
    const { sequence, ticketNumber } = await QueueCalculationService.getNextSequence(
      department.code,
      todayStr
    );

    // 6. Create QueueTicket
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
      checkedInAt: new Date(),
    });

    // Calculate initial live position & wait mins
    const liveState = await QueueCalculationService.calculateLiveQueueState(ticket);
    ticket.currentPosition = liveState.currentPosition;
    ticket.estimatedWaitMins = liveState.estimatedWaitMins;
    ticket.status = liveState.status;

    await ticket.save();

    // Link queue ticket to appointment
    appointment.queueTicket = ticket._id as any;
    await appointment.save();

    return (await QueueTicket.findById(ticket._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name title roomNumber')
      .populate('department', 'name code roomNumber')) as IQueueTicket;
  }
}
