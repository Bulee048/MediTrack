import mongoose, { ClientSession, Types } from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { FamilyMember } from '../models/FamilyMember.js';
import { User } from '../models/User.js';
import { AvailabilityService } from './availability.service.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import {
  BookAppointmentInput,
  CreateAppointmentInput,
  RescheduleAppointmentInput,
  getMyAppointmentsQuerySchema,
  getStaffAppointmentsQuerySchema,
} from '../validators/appointment.validator.js';

export interface AppointmentResponse {
  id: string;
  ref: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  slotId: string;
  slotLabel: string;
  timeSlot: string;
  reason?: string;
  status: string;
  patientId: string;
  familyMemberId?: string;
  createdAt: string;
}

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const refFor = (id: string, date: string) => `OPD-${date.replace(/-/g, '')}-${id.slice(-6).toUpperCase()}`;

export class AppointmentService {
  /**
   * Atomic, transaction-safe appointment creation for patient booking flow
   */
  static async createAppointment(patientId: string, data: CreateAppointmentInput): Promise<AppointmentResponse> {
    validateObjectId(data.doctorId, 'doctor ID');
    if (data.familyMemberId) validateObjectId(data.familyMemberId, 'family member ID');

    return mongoose.connection.transaction(async (session) => {
      const doctor = await Doctor.findOne({ _id: data.doctorId, isActive: true })
        .populate<{ department: { name: string } | null }>('department', 'name')
        .session(session);

      if (!doctor) throw new AppError('Doctor not found or inactive', 404);
      if (doctor.availabilityStatus === 'UNAVAILABLE') throw new AppError('Doctor is unavailable for bookings', 409);

      const index = doctor.availabilitySlots.findIndex(
        (slot) => `${dayOf(slot.date)}-${slot.startTime}-${slot.endTime}` === data.slotId && dayOf(slot.date) === data.date
      );

      if (index < 0) throw new AppError('The requested time slot is not available for this date', 409);

      const slot = doctor.availabilitySlots[index];
      const label = `${slot.startTime} - ${slot.endTime}`;

      if (data.slotLabel && data.slotLabel.replace(/\s/g, '') !== label.replace(/\s/g, '')) {
        throw new AppError('Slot label does not match the requested slot', 409);
      }

      if (data.date < new Date().toISOString().slice(0, 10)) throw new AppError('Cannot book a past date', 409);

      if (data.familyMemberId) {
        const member = await FamilyMember.findOne({ _id: data.familyMemberId, owner: patientId }).session(session);
        if (!member) throw new AppError('Family member not found for this account', 404);
      }

      const requestedDate = new Date(`${data.date}T00:00:00.000Z`);
      const existing = await Appointment.findOne({
        patient: patientId,
        doctor: data.doctorId,
        appointmentDate: requestedDate,
        familyMember: data.familyMemberId ?? null,
        status: { $in: ['BOOKED', 'RESCHEDULED'] },
      }).session(session);

      if (existing) throw new AppError('This patient already has a booking with this doctor on this date', 409);

      const countPath = `availabilitySlots.${index}.bookedCount`;
      const updated = await Doctor.updateOne(
        {
          _id: doctor._id,
          isActive: true,
          availabilityStatus: { $ne: 'UNAVAILABLE' },
          [`availabilitySlots.${index}.date`]: slot.date,
          [`availabilitySlots.${index}.startTime`]: slot.startTime,
          [`availabilitySlots.${index}.endTime`]: slot.endTime,
          $expr: {
            $lt: [
              { $arrayElemAt: ['$availabilitySlots.bookedCount', index] },
              { $arrayElemAt: ['$availabilitySlots.capacity', index] },
            ],
          },
        },
        { $inc: { [countPath]: 1 } },
        { session }
      );

      if (updated.modifiedCount !== 1) throw new AppError('This time slot is fully booked. Choose another slot.', 409);

      const id = new Types.ObjectId();
      const ref = refFor(id.toString(), data.date);

      const [appointment] = await Appointment.create(
        [
          {
            _id: id,
            patient: patientId,
            doctor: data.doctorId,
            appointmentDate: requestedDate,
            timeSlot: label,
            slotId: data.slotId,
            slotLabel: label,
            reason: data.reason,
            status: 'BOOKED',
            familyMember: data.familyMemberId,
            ref,
            referenceId: ref,
          },
        ],
        { session }
      );

      return {
        id: appointment._id.toString(),
        ref,
        doctorId: data.doctorId,
        doctorName: doctor.name,
        department: doctor.department?.name ?? 'Department not listed',
        date: data.date,
        slotId: data.slotId,
        slotLabel: label,
        timeSlot: label,
        reason: appointment.reason,
        status: appointment.status,
        patientId,
        familyMemberId: appointment.familyMember?.toString(),
        createdAt: appointment.createdAt.toISOString(),
      };
    });
  }

  /**
   * Book new appointment for authenticated patient
   */
  static async bookAppointment(
    patientId: string,
    data: BookAppointmentInput
  ): Promise<IAppointment> {
    validateObjectId(patientId, 'patient ID');
    validateObjectId(data.doctorId, 'doctor ID');

    const patientUser = await User.findById(patientId);
    if (!patientUser || !patientUser.isActive) {
      throw new AppError('Patient account not found or inactive', 401);
    }

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

    let session: ClientSession | undefined = undefined;
    let createdAppointment: IAppointment;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      if (!data.time) {
        throw new AppError('Time slot is required', 400);
      }

      await AvailabilityService.reserveSlotCapacity(data.doctorId, data.date, data.time, session);

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
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

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
    params: { status?: AppointmentStatus; upcoming?: boolean; past?: boolean } = {}
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
    user: { id: string; role?: string }
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

    if (user.role === 'PATIENT' && appointment.patient._id.toString() !== user.id) {
      throw new AppError('Access forbidden: You do not own this appointment', 403);
    }

    return appointment;
  }

  /**
   * Reschedule an appointment
   */
  static async rescheduleAppointment(
    appointmentId: string,
    patientId: string,
    data: RescheduleAppointmentInput
  ): Promise<IAppointment> {
    validateObjectId(appointmentId, 'appointment ID');

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.patient.toString() !== patientId) {
      throw new AppError('Access forbidden: You can only reschedule your own appointments', 403);
    }

    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
      throw new AppError(`Cannot reschedule an appointment with status ${appointment.status}`, 400);
    }

    const oldDateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    const oldTimeStr = appointment.timeSlot;

    if (oldDateStr === data.date && oldTimeStr === data.time) {
      throw new AppError('New slot must be different from current slot', 400);
    }

    const doctorId = appointment.doctor.toString();
    const newAppointmentDate = AvailabilityService.normalizeDate(data.date);

    let session: ClientSession | undefined = undefined;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      await AvailabilityService.reserveSlotCapacity(doctorId, data.date, data.time, session);
      await AvailabilityService.releaseSlotCapacity(doctorId, oldDateStr, oldTimeStr, session);

      appointment.appointmentDate = newAppointmentDate;
      appointment.timeSlot = data.time;
      appointment.status = 'RESCHEDULED';

      await appointment.save({ session });
      await session.commitTransaction();
    } catch (err: unknown) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    return (await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('familyMember', 'name relationship phone')
      .populate({
        path: 'doctor',
        select: 'name title roomNumber consultationFee department',
        populate: { path: 'department', select: 'name code roomNumber' },
      })) as IAppointment;
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId: string, patientId: string): Promise<IAppointment> {
    validateObjectId(appointmentId, 'appointment ID');

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.patient.toString() !== patientId) {
      throw new AppError('Access forbidden: You can only cancel your own appointments', 403);
    }

    if (appointment.status === 'CANCELLED') {
      throw new AppError('Appointment is already cancelled', 400);
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('Completed appointments cannot be cancelled', 400);
    }

    const dateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    const timeStr = appointment.timeSlot;
    const doctorId = appointment.doctor.toString();

    let session: ClientSession | undefined = undefined;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      await AvailabilityService.releaseSlotCapacity(doctorId, dateStr, timeStr, session);

      appointment.status = 'CANCELLED';
      await appointment.save({ session });
      await session.commitTransaction();
    } catch (err: unknown) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    return appointment;
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
