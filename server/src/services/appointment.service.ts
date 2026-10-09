import mongoose, { Types } from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { Appointment, IAppointment } from '../models/Appointment.js';
import { FamilyMember } from '../models/FamilyMember.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import { CreateAppointmentInput } from '../validators/appointment.validator.js';

export interface AppointmentResponse {
  id: string; ref: string; doctorId: string; doctorName: string; department: string;
  date: string; slotId: string; slotLabel: string; timeSlot: string; reason?: string;
  status: string; patientId: string; familyMemberId?: string; createdAt: string;
}
const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const refFor = (id: string, date: string) => `OPD-${date.replace(/-/g, '')}-${id.slice(-6).toUpperCase()}`;

export class AppointmentService {
  static async createAppointment(patientId: string, data: CreateAppointmentInput): Promise<AppointmentResponse> {
    validateObjectId(data.doctorId, 'doctor ID');
    if (data.familyMemberId) validateObjectId(data.familyMemberId, 'family member ID');
    return mongoose.connection.transaction(async (session) => {
      const doctor = await Doctor.findOne({ _id: data.doctorId, isActive: true })
        .populate<{ department: { name: string } | null }>('department', 'name').session(session);
      if (!doctor) throw new AppError('Doctor not found or inactive', 404);
      if (doctor.availabilityStatus === 'UNAVAILABLE') throw new AppError('Doctor is unavailable for bookings', 409);
      const index = doctor.availabilitySlots.findIndex(slot =>
        `${dayOf(slot.date)}-${slot.startTime}-${slot.endTime}` === data.slotId && dayOf(slot.date) === data.date);
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
      const existing = await Appointment.findOne({ patient: patientId, doctor: data.doctorId,
        appointmentDate: requestedDate, familyMember: data.familyMemberId ?? null,
        status: { $in: ['BOOKED', 'RESCHEDULED'] } }).session(session);
      if (existing) throw new AppError('This patient already has a booking with this doctor on this date', 409);
      const countPath = `availabilitySlots.${index}.bookedCount`;
      const updated = await Doctor.updateOne({ _id: doctor._id, isActive: true,
        availabilityStatus: { $ne: 'UNAVAILABLE' },
        [`availabilitySlots.${index}.date`]: slot.date,
        [`availabilitySlots.${index}.startTime`]: slot.startTime,
        [`availabilitySlots.${index}.endTime`]: slot.endTime,
        $expr: { $lt: [
          { $arrayElemAt: ['$availabilitySlots.bookedCount', index] },
          { $arrayElemAt: ['$availabilitySlots.capacity', index] },
        ] },
      }, { $inc: { [countPath]: 1 } }, { session });
      if (updated.modifiedCount !== 1) throw new AppError('This time slot is fully booked. Choose another slot.', 409);
      const id = new Types.ObjectId();
      const ref = refFor(id.toString(), data.date);
      const [appointment] = await Appointment.create([{
        _id: id, patient: patientId, doctor: data.doctorId, appointmentDate: requestedDate,
        timeSlot: label, slotId: data.slotId, slotLabel: label, reason: data.reason,
        status: 'BOOKED', familyMember: data.familyMemberId, ref, referenceId: ref,
      }], { session });
      return {
        id: appointment._id.toString(), ref, doctorId: data.doctorId, doctorName: doctor.name,
        department: doctor.department?.name ?? 'Department not listed', date: data.date,
        slotId: data.slotId, slotLabel: label, timeSlot: label, reason: appointment.reason,
        status: appointment.status, patientId, familyMemberId: appointment.familyMember?.toString(),
        createdAt: appointment.createdAt.toISOString(),
      };
    });
  }

  private static async format(appointment: IAppointment): Promise<AppointmentResponse> {
    const doctor = await Doctor.findById(appointment.doctor)
      .populate<{ department: { name: string } | null }>('department', 'name');
    const date = dayOf(appointment.appointmentDate);
    const parts = appointment.timeSlot.split(' - ');
    return {
      id: appointment._id.toString(), ref: appointment.ref ?? appointment.referenceId ?? refFor(appointment._id.toString(), date),
      doctorId: appointment.doctor.toString(), doctorName: doctor?.name ?? 'Doctor unavailable',
      department: doctor?.department?.name ?? 'Department not listed', date,
      slotId: appointment.slotId ?? `${date}-${parts[0]}-${parts[1]}`,
      slotLabel: appointment.slotLabel ?? appointment.timeSlot, timeSlot: appointment.timeSlot,
      reason: appointment.reason, status: appointment.status, patientId: appointment.patient.toString(),
      familyMemberId: appointment.familyMember?.toString(), createdAt: appointment.createdAt.toISOString(),
    };
  }

  static async getMyAppointments(patientId: string): Promise<AppointmentResponse[]> {
    const appointments = await Appointment.find({ patient: patientId }).sort({ appointmentDate: -1, createdAt: -1 });
    return Promise.all(appointments.map(appointment => this.format(appointment)));
  }

  static async getAppointmentById(patientId: string, id: string): Promise<AppointmentResponse> {
    validateObjectId(id, 'appointment ID');
    const appointment = await Appointment.findOne({ _id: id, patient: patientId });
    if (!appointment) throw new AppError('Appointment not found for this account', 404);
    return this.format(appointment);
  }
}
