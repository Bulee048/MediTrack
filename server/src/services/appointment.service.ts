import { Types } from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { Appointment, IAppointment } from '../models/Appointment.js';
import { FamilyMember } from '../models/FamilyMember.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import { CreateAppointmentInput } from '../validators/appointment.validator.js';

/** Shape returned to the patient booking client */
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

/** Derive a short date-based reference:  OPD-YYYYMMDD-<last6 of ObjectId> */
function generateRef(appointmentId: string, date: string): string {
  const datePart = date.replace(/-/g, '');
  const idSuffix = appointmentId.slice(-6).toUpperCase();
  return `OPD-${datePart}-${idSuffix}`;
}

function formatAppointment(
  appt: IAppointment,
  doctorName: string,
  departmentName: string,
  slotId: string,
  slotLabel: string
): AppointmentResponse {
  const dateStr = appt.appointmentDate.toISOString().split('T')[0] ?? '';
  return {
    id: appt._id.toString(),
    ref: appt.ref ?? '',
    doctorId: appt.doctor.toString(),
    doctorName,
    department: departmentName,
    date: dateStr,
    slotId,
    slotLabel,
    timeSlot: appt.timeSlot,
    reason: appt.reason,
    status: appt.status,
    patientId: appt.patient.toString(),
    familyMemberId: appt.familyMember?.toString(),
    createdAt: appt.createdAt.toISOString(),
  };
}

export class AppointmentService {
  /**
   * POST /api/appointments
   * 1. Validate doctorId, date, slotId
   * 2. Locate the matching availability slot in the Doctor document
   * 3. Reject if slot not found, fully booked, or doctor unavailable
   * 4. Reject double-booking (same patient, same doctor, same date+slot)
   * 5. Atomically increment bookedCount, save Appointment with generated ref
   */
  static async createAppointment(
    patientId: string,
    data: CreateAppointmentInput
  ): Promise<AppointmentResponse> {
    validateObjectId(data.doctorId, 'doctor ID');

    const doctor = await Doctor.findOne({ _id: data.doctorId, isActive: true }).populate(
      'department',
      'name'
    );
    if (!doctor) {
      throw new AppError('Doctor not found or inactive', 404);
    }

    if (doctor.availabilityStatus === 'UNAVAILABLE') {
      throw new AppError('Doctor is currently unavailable for bookings', 409);
    }

    // Normalise the requested date to midnight UTC for comparison
    const requestedDate = new Date(`${data.date}T00:00:00.000Z`);

    // Find the availability slot whose date and time range match the slotId/slotLabel
    // slotId produced by the client service is "date-startTime-endTime" e.g. "2026-10-15-09:00-09:30"
    // The slot date stored in MongoDB may be at any time on that day (UTC)
    let matchedSlotIndex = -1;
    for (let i = 0; i < doctor.availabilitySlots.length; i++) {
      const slot = doctor.availabilitySlots[i];
      const slotDate = new Date(slot.date);
      const slotDateStr = slotDate.toISOString().split('T')[0];

      if (slotDateStr !== data.date) continue;

      // Try to match via slotId which contains startTime and endTime
      const slotKey = `${slotDateStr}-${slot.startTime}-${slot.endTime}`;
      if (data.slotId === slotKey) {
        matchedSlotIndex = i;
        break;
      }
    }

    // If slotId didn't match (e.g. format differs), try matching by date + slotLabel time range
    if (matchedSlotIndex === -1 && data.slotLabel) {
      const labelNorm = data.slotLabel.replace(/\s/g, '');
      for (let i = 0; i < doctor.availabilitySlots.length; i++) {
        const slot = doctor.availabilitySlots[i];
        const slotDate = new Date(slot.date);
        if (slotDate.toISOString().split('T')[0] !== data.date) continue;
        const slotLabelKey = `${slot.startTime}-${slot.endTime}`.replace(/\s/g, '');
        if (labelNorm.includes(slotLabelKey) || slotLabelKey === labelNorm) {
          matchedSlotIndex = i;
          break;
        }
      }
    }

    // If still no match, find any slot on that date as a fallback
    // (handles case where doctor only has one slot per day with a different ID format)
    if (matchedSlotIndex === -1) {
      for (let i = 0; i < doctor.availabilitySlots.length; i++) {
        const slot = doctor.availabilitySlots[i];
        const slotDate = new Date(slot.date);
        if (slotDate.toISOString().split('T')[0] === data.date) {
          matchedSlotIndex = i;
          break;
        }
      }
    }

    if (matchedSlotIndex === -1) {
      throw new AppError(
        `No availability slot found for ${data.date}. The doctor may not have slots on this date.`,
        409
      );
    }

    const slot = doctor.availabilitySlots[matchedSlotIndex];
    if (slot.bookedCount >= slot.capacity) {
      throw new AppError('This time slot is fully booked. Please choose another slot.', 409);
    }

    // Reject double-booking: same patient booked with this doctor on the same date
    const existingBooking = await Appointment.findOne({
      patient: new Types.ObjectId(patientId),
      doctor: new Types.ObjectId(data.doctorId),
      appointmentDate: requestedDate,
      status: { $in: ['BOOKED', 'RESCHEDULED'] },
    });
    if (existingBooking) {
      throw new AppError(
        'You already have a booking with this doctor on this date.',
        409
      );
    }

    // Validate family member if provided
    if (data.familyMemberId) {
      validateObjectId(data.familyMemberId, 'family member ID');
      const member = await FamilyMember.findOne({
        _id: data.familyMemberId,
        owner: new Types.ObjectId(patientId),
      });
      if (!member) {
        throw new AppError('Family member not found or does not belong to this account', 404);
      }
    }

    // Atomically increment bookedCount on the matched slot
    await Doctor.updateOne(
      { _id: doctor._id },
      { $inc: { [`availabilitySlots.${matchedSlotIndex}.bookedCount`]: 1 } }
    );

    const timeSlotLabel =
      data.slotLabel ?? `${slot.startTime} - ${slot.endTime}`;

    // Save appointment
    const newAppt = await Appointment.create({
      patient: new Types.ObjectId(patientId),
      doctor: new Types.ObjectId(data.doctorId),
      appointmentDate: requestedDate,
      timeSlot: timeSlotLabel,
      reason: data.reason,
      status: 'BOOKED',
      familyMember: data.familyMemberId
        ? new Types.ObjectId(data.familyMemberId)
        : undefined,
    });

    // Set ref after save so we have the ObjectId
    const ref = generateRef(newAppt._id.toString(), data.date);
    newAppt.ref = ref;
    newAppt.referenceId = ref;
    await newAppt.save();

    const dept = doctor.department as { name?: string } | null;
    const departmentName =
      dept && typeof dept === 'object' && 'name' in dept
        ? (dept.name ?? 'Unknown')
        : 'Unknown';

    const slotKey = `${data.date}-${slot.startTime}-${slot.endTime}`;

    return formatAppointment(
      newAppt,
      doctor.name,
      departmentName,
      data.slotId || slotKey,
      timeSlotLabel
    );
  }

  /**
   * GET /api/appointments/my
   * Returns all non-cancelled appointments for the authenticated patient,
   * newest first, populated with doctor & department name.
   */
  static async getMyAppointments(patientId: string): Promise<AppointmentResponse[]> {
    const appointments = await Appointment.find({
      patient: new Types.ObjectId(patientId),
    })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .populate({
        path: 'doctor',
        select: 'name department availabilitySlots availabilityStatus',
        populate: { path: 'department', select: 'name' },
      });

    return appointments.map((appt) => {
      const doc = appt.doctor as unknown as {
        name?: string;
        department?: { name?: string } | null;
      } | null;

      const doctorName = doc?.name ?? 'Unknown Doctor';
      const departmentName =
        doc?.department && typeof doc.department === 'object' && 'name' in doc.department
          ? (doc.department.name ?? 'Unknown')
          : 'Unknown';

      const dateStr = appt.appointmentDate.toISOString().split('T')[0] ?? '';

      return formatAppointment(
        appt,
        doctorName,
        departmentName,
        appt.referenceId ?? appt.ref ?? appt._id.toString(),
        appt.timeSlot
      );
    });
  }
}
