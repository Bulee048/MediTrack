import { hospitalDate } from '../utils/hospitalDate.js';
import mongoose from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { FamilyMember } from '../models/FamilyMember.js';
import { User } from '../models/User.js';
import { AvailabilityService } from './availability.service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import {
  BookAppointmentInput,
  RescheduleAppointmentInput,
} from '../validators/appointment.validator.js';

export class AppointmentService {
  /**
   * Book new appointment for authenticated patient
   */
  static async bookAppointment(
    patientId: string,
    data: BookAppointmentInput
  ): Promise<IAppointment> {
    validateObjectId(patientId, 'patient ID');
    validateObjectId(data.doctorId, 'doctor ID');

    const appointmentDate = AvailabilityService.normalizeDate(data.date);
    let createdId = '';
    await mongoose.connection.transaction(async session => {
      // Serialize bookings for an account so concurrent duplicate checks cannot both pass.
      const patient = await User.findOneAndUpdate(
        { _id: patientId, isActive: true, role: 'PATIENT' },
        { $inc: { __v: 1 } }, { session, new: true, timestamps: false }
      );
      if (!patient) throw new AppError('Patient account not found or inactive', 401);
      if (data.familyMemberId) {
        validateObjectId(data.familyMemberId, 'family member ID');
        // A write also coordinates with deletion of an unused family member.
        const member = await FamilyMember.findOneAndUpdate(
          { _id: data.familyMemberId, owner: patientId }, { $inc: { __v: 1 } }, { session, timestamps: false }
        );
        if (!member) throw new AppError('Family member not found or does not belong to patient account', 403);
      }
      // Both booking contracts resolve to one canonical HH:MM slot inside the transaction.
      const doctor = await Doctor.findOne({ _id: data.doctorId, isActive: true }).session(session);
      if (!doctor) throw new AppError('Doctor not found or inactive', 404);
      const slot = doctor.availabilitySlots.find(item =>
        AvailabilityService.isSameDate(item.date, data.date) && (data.slotId
          ? `${data.date}-${item.startTime}-${item.endTime}` === data.slotId
          : item.startTime === data.time));
      if (!slot) throw new AppError('The selected slot is not available', 409);
      if ((data.time && data.time !== slot.startTime) || (data.slotLabel && data.slotLabel.replace(/\s/g, '') !== `${slot.startTime}-${slot.endTime}`))
        throw new AppError('Slot details do not match the selected availability', 409);
      const time = slot.startTime;
      const label = `${time} - ${slot.endTime}`;
      const duplicate = await Appointment.exists({
        patient: patientId, familyMember: data.familyMemberId ?? null,
        doctor: data.doctorId, appointmentDate, timeSlot: { $in: [time, label] },
        status: { $in: ['BOOKED', 'RESCHEDULED'] },
      }).session(session);
      if (duplicate) throw new AppError('This patient already has an active appointment at the selected slot', 409);
      await AvailabilityService.reserveSlotCapacity(data.doctorId, data.date, time, session);
      const appointment = new Appointment({
        patient: patientId, familyMember: data.familyMemberId ?? undefined,
        doctor: data.doctorId, appointmentDate, timeSlot: time,
        slotId: `${data.date}-${time}-${slot.endTime}`, slotLabel: label,
        reason: data.reason, status: 'BOOKED',
      });
      appointment.ref = `OPD-${data.date.replace(/-/g, '')}-${appointment._id.toString().slice(-6).toUpperCase()}`;
      appointment.referenceId = appointment.ref;
      await appointment.save({ session });
      await NotificationService.createNotification({ userId: patientId, appointmentId: appointment._id.toString(),
        category: 'APPOINTMENT_CREATED', title: 'Appointment booked', message: `Your appointment is booked for ${data.date} at ${time}.` }, session);
      createdId = appointment._id.toString();
    });
    // Preserve the existing booking response contract (patient ID, populated doctor/family).
    return (await Appointment.findById(createdId)
      .populate({
        path: 'doctor', select: 'name title roomNumber consultationFee availabilityStatus department',
        populate: { path: 'department', select: 'name code roomNumber' },
      })
      .populate('familyMember', 'name relationship phone')) as IAppointment;
  }

  /**
   * Get authenticated patient's appointments
   */
  static async getMyAppointments(
    patientId: string,
    params: { status?: AppointmentStatus; upcoming?: boolean; past?: boolean }
  ): Promise<IAppointment[]> {
    validateObjectId(patientId, 'patient ID');

    const filter: Record<string, unknown> = { patient: patientId };

    if (params.status) {
      filter.status = params.status;
    }

    const now = new Date();
    const todayStr = hospitalDate(now);
    const today = AvailabilityService.normalizeDate(todayStr);

    if (params.upcoming) {
      filter.appointmentDate = { $gte: today };
      filter.status = { $in: ['BOOKED', 'RESCHEDULED'] };
    } else if (params.past) {
      filter.$or = [{ appointmentDate: { $lt: today } }, { status: 'COMPLETED' }];
      if (!params.status) filter.status = { $ne: 'CANCELLED' };
    }

    return Appointment.find(filter)
      .populate({
        path: 'doctor',
        select: 'name title roomNumber consultationFee department',
        populate: { path: 'department', select: 'name code roomNumber' },
      })
      .populate('familyMember', 'name relationship phone')
      .sort({ appointmentDate: params.upcoming ? 1 : -1, timeSlot: params.upcoming ? 1 : -1 });
  }

  /**
   * Get single appointment by ID with ownership/authorization checks
   */
  static async getAppointmentById(
    appointmentId: string,
    user: { id: string; role: string }
  ): Promise<IAppointment> {
    validateObjectId(appointmentId, 'appointment ID');

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('familyMember', 'name relationship phone gender dateOfBirth')
      .populate({
        path: 'doctor',
        select: 'name title roomNumber consultationFee department',
        populate: { path: 'department', select: 'name code roomNumber description' },
      });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Access control check
    if (user.role === 'PATIENT' && (!appointment.patient || appointment.patient._id.toString() !== user.id)) {
      throw new AppError('Access forbidden: You do not own this appointment', 403);
    }

    return appointment;
  }

  /**
   * Reschedule an appointment
   */
  static async rescheduleAppointment(
    appointmentId: string, patientId: string, data: RescheduleAppointmentInput
  ): Promise<IAppointment> {
    validateObjectId(appointmentId, 'appointment ID');
    await mongoose.connection.transaction(async session => {
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment) throw new AppError('Appointment not found', 404);
      if (appointment.patient.toString() !== patientId) throw new AppError('Access forbidden: You can only reschedule your own appointments', 403);
      if (!['BOOKED', 'RESCHEDULED'].includes(appointment.status)) throw new AppError(`Cannot reschedule an appointment with status ${appointment.status}`, 409);
      if (appointment.queueTicket) throw new AppError('Checked-in appointments must be managed through the OPD queue', 409);
      const oldDate = appointment.appointmentDate.toISOString().slice(0, 10);
      if (oldDate === data.date && appointment.timeSlot.slice(0, 5) === data.time) throw new AppError('New slot must be different from current slot', 409);
      if (appointment.familyMember && !await FamilyMember.exists({ _id: appointment.familyMember, owner: patientId }).session(session)) {
        throw new AppError('Family member is no longer authorized for this account', 403);
      }
      // The account lock prevents a simultaneous booking/reschedule into the same slot.
      await User.updateOne({ _id: patientId }, { $inc: { __v: 1 } }, { session, timestamps: false });
      if (await Appointment.exists({
        _id: { $ne: appointment._id }, patient: patientId,
        familyMember: appointment.familyMember ?? null, doctor: appointment.doctor,
        appointmentDate: AvailabilityService.normalizeDate(data.date), timeSlot: { $regex: `^${data.time}(?:$|\\s*-)` },
        status: { $in: ['BOOKED', 'RESCHEDULED'] },
      }).session(session)) throw new AppError('This patient already has an active appointment at the selected slot', 409);
      const doctorId = appointment.doctor.toString();
      await AvailabilityService.reserveSlotCapacity(doctorId, data.date, data.time, session);
      await AvailabilityService.releaseSlotCapacity(doctorId, oldDate, appointment.timeSlot.slice(0, 5), session);
      appointment.appointmentDate = AvailabilityService.normalizeDate(data.date);
      appointment.timeSlot = data.time;
      const doctor = await Doctor.findById(doctorId).session(session);
      const slot = doctor?.availabilitySlots.find(item => AvailabilityService.isSameDate(item.date, data.date) && item.startTime === data.time);
      appointment.slotId = slot ? `${data.date}-${data.time}-${slot.endTime}` : undefined;
      appointment.slotLabel = slot ? `${data.time} - ${slot.endTime}` : undefined;
      appointment.status = 'RESCHEDULED';
      await appointment.save({ session });
      await NotificationService.createNotification({ userId: patientId, appointmentId,
        category: 'APPOINTMENT_UPDATED', title: 'Appointment rescheduled', message: `Your appointment has moved to ${data.date} at ${data.time}.` }, session);
    });
    return this.getAppointmentById(appointmentId, { id: patientId, role: 'PATIENT' });
  }

  static async cancelAppointment(appointmentId: string, patientId: string): Promise<IAppointment> {
    validateObjectId(appointmentId, 'appointment ID');
    await mongoose.connection.transaction(async session => {
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment) throw new AppError('Appointment not found', 404);
      if (appointment.patient.toString() !== patientId) throw new AppError('Access forbidden: You can only cancel your own appointments', 403);
      if (!['BOOKED', 'RESCHEDULED'].includes(appointment.status)) throw new AppError(`Cannot cancel an appointment with status ${appointment.status}`, 409);
      if (appointment.queueTicket) throw new AppError('Checked-in appointments must be managed through the OPD queue', 409);
      await AvailabilityService.releaseSlotCapacity(appointment.doctor.toString(), appointment.appointmentDate.toISOString().slice(0, 10), appointment.timeSlot.slice(0, 5), session);
      appointment.status = 'CANCELLED';
      await appointment.save({ session });
      await NotificationService.createNotification({ userId: patientId, appointmentId,
        category: 'APPOINTMENT_CANCELLED', title: 'Appointment cancelled', message: 'Your appointment was cancelled and its reserved slot released.' }, session);
    });
    return this.getAppointmentById(appointmentId, { id: patientId, role: 'PATIENT' });
  }

  /**
   * Staff/Admin list all appointments with filters
   */
  static async getAllAppointmentsForStaff(params: {
    date?: string;
    doctorId?: string;
    departmentId?: string;
    status?: AppointmentStatus;
  }): Promise<IAppointment[]> {
    const filter: Record<string, unknown> = {};

    if (params.date) {
      filter.appointmentDate = AvailabilityService.normalizeDate(params.date);
    }

    if (params.doctorId) {
      validateObjectId(params.doctorId, 'doctor ID');
      filter.doctor = params.doctorId;
    }

    if (params.status) {
      filter.status = params.status;
    }

    if (params.departmentId) {
      validateObjectId(params.departmentId, 'department ID');
      const doctorsInDept = await Doctor.find({ department: params.departmentId }).select('_id');
      const doctorIds = doctorsInDept.map((d) => d._id);
      filter.doctor = { $in: doctorIds };
    }

    return Appointment.find(filter)
      .populate('patient', 'name email phone nic')
      .populate('familyMember', 'name relationship phone gender dateOfBirth')
      .populate({
        path: 'doctor',
        select: 'name title roomNumber consultationFee department',
        populate: { path: 'department', select: 'name code roomNumber' },
      })
      .sort({ appointmentDate: 1, timeSlot: 1 });
  }

  /**
   * Staff/Admin update appointment status
   */
  static async updateAppointmentStatusByStaff(
    appointmentId: string,
    newStatus: AppointmentStatus
  ): Promise<IAppointment> {
    validateObjectId(appointmentId, 'appointment ID');

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Reuse authoritative workflows: raw status writes must not bypass slot capacity or queue guards.
    if (newStatus === 'CANCELLED') return this.cancelAppointment(appointmentId, appointment.patient.toString());
    if (newStatus === 'COMPLETED' && appointment.queueTicket) {
      const { QueueService } = await import('./queue.service.js');
      await QueueService.completeConsultation(appointment.queueTicket.toString());
      return (await Appointment.findById(appointmentId).populate('patient', 'name email phone').populate('doctor', 'name title roomNumber'))!;
    }
    throw new AppError('Use booking/rescheduling or the valid consultation workflow to change appointment state', 409);
  }
}
