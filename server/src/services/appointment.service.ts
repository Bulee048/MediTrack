import mongoose, { ClientSession } from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { FamilyMember } from '../models/FamilyMember.js';
import { User } from '../models/User.js';
import { AvailabilityService } from './availability.service.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import {
  BookAppointmentInput,
  RescheduleAppointmentInput,
  getMyAppointmentsQuerySchema,
  getStaffAppointmentsQuerySchema,
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

    // 1. Verify patient user
    const patientUser = await User.findById(patientId);
    if (!patientUser || !patientUser.isActive) {
      throw new AppError('Patient account not found or inactive', 401);
    }

    // 2. Family Member verification if provided
    let familyMemberObjectId = undefined;
    if (data.familyMemberId) {
      validateObjectId(data.familyMemberId, 'family member ID');
      const familyMember = await FamilyMember.findOne({
        _id: data.familyMemberId,
        owner: patientId,
      });

      if (!familyMember) {
        throw new AppError('Family member not found or does not belong to patient account', 403);
      }
      familyMemberObjectId = familyMember._id;
    }

    // 3. Prevent duplicate active booking for same patient + doctor + date + time
    const appointmentDate = AvailabilityService.normalizeDate(data.date);
    const existingBooking = await Appointment.findOne({
      patient: patientId,
      doctor: data.doctorId,
      appointmentDate: appointmentDate,
      timeSlot: data.time,
      status: { $in: ['BOOKED', 'RESCHEDULED'] },
    });

    if (existingBooking) {
      throw new AppError('You already have an active appointment with this doctor at the selected date and time', 409);
    }

    // Execute with transaction if session available
    let session: ClientSession | undefined = undefined;
    let createdAppointment: IAppointment;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // Reserve slot capacity
      await AvailabilityService.reserveSlotCapacity(data.doctorId, data.date, data.time, session);

      // Create appointment
      const newAppointment = new Appointment({
        patient: patientId,
        familyMember: familyMemberObjectId,
        doctor: data.doctorId,
        appointmentDate: appointmentDate,
        timeSlot: data.time,
        reason: data.reason,
        status: 'BOOKED',
      });

      await newAppointment.save({ session });
      await session.commitTransaction();
      createdAppointment = newAppointment;
    } catch (err: unknown) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      // If error is not AppError, fallback or rethrow
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    // Populate and return
    return (await Appointment.findById(createdAppointment._id)
      .populate('doctor', 'name title roomNumber consultationFee availabilityStatus')
      .populate({
        path: 'doctor',
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
    const todayStr = now.toISOString().split('T')[0];
    const today = AvailabilityService.normalizeDate(todayStr);

    if (params.upcoming) {
      filter.appointmentDate = { $gte: today };
    } else if (params.past) {
      filter.appointmentDate = { $lt: today };
    }

    return Appointment.find(filter)
      .populate({
        path: 'doctor',
        select: 'name title roomNumber consultationFee department',
        populate: { path: 'department', select: 'name code roomNumber' },
      })
      .populate('familyMember', 'name relationship phone')
      .sort({ appointmentDate: -1, timeSlot: 1 });
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
    if (user.role === 'PATIENT' && appointment.patient._id.toString() !== user.id) {
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
      if (oldDate === data.date && appointment.timeSlot === data.time) throw new AppError('New slot must be different from current slot', 409);
      const doctorId = appointment.doctor.toString();
      await AvailabilityService.reserveSlotCapacity(doctorId, data.date, data.time, session);
      await AvailabilityService.releaseSlotCapacity(doctorId, oldDate, appointment.timeSlot, session);
      appointment.appointmentDate = AvailabilityService.normalizeDate(data.date);
      appointment.timeSlot = data.time;
      appointment.status = 'RESCHEDULED';
      await appointment.save({ session });
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
      await AvailabilityService.releaseSlotCapacity(appointment.doctor.toString(), appointment.appointmentDate.toISOString().slice(0, 10), appointment.timeSlot, session);
      appointment.status = 'CANCELLED';
      await appointment.save({ session });
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

    // Check invalid transitions
    if (appointment.status === 'CANCELLED' && newStatus !== 'CANCELLED') {
      throw new AppError('Cannot update status of a cancelled appointment', 400);
    }

    if (appointment.status === 'COMPLETED' && newStatus !== 'COMPLETED') {
      throw new AppError('Cannot change status of a completed appointment', 400);
    }

    appointment.status = newStatus;
    await appointment.save();

    return (await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('familyMember', 'name relationship phone')
      .populate({
        path: 'doctor',
        select: 'name title roomNumber consultationFee department',
        populate: { path: 'department', select: 'name code roomNumber' },
      })) as IAppointment;
  }
}
