import { ClientSession } from 'mongoose';
import { Doctor, IDoctor, IAvailabilitySlot } from '../models/Doctor.js';
import { AppError } from '../utils/AppError.js';

export class AvailabilityService {
  /**
   * Helper to normalize date string to Date object set to 00:00:00 UTC/Local comparison
   */
  static normalizeDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Compare dates matching YYYY-MM-DD
   */
  static isSameDate(d1: Date, d2Str: string): boolean {
    const dateStr1 = new Date(d1).toISOString().split('T')[0];
    return dateStr1 === d2Str;
  }

  /**
   * Find matching availability slot for doctor on date and time
   */
  static findSlot(doctor: IDoctor, dateStr: string, timeStr: string): IAvailabilitySlot | null {
    if (!doctor.availabilitySlots || doctor.availabilitySlots.length === 0) {
      return null;
    }

    const slot = doctor.availabilitySlots.find((s) => {
      const matchDate = this.isSameDate(s.date, dateStr);
      const matchTime = s.startTime === timeStr;
      return matchDate && matchTime;
    });

    return slot || null;
  }

  /**
   * Verify and reserve capacity for a slot.
   * Atomically increments bookedCount using doctor.save() or session.
   */
  static async reserveSlotCapacity(
    doctorId: string,
    dateStr: string,
    timeStr: string,
    session?: ClientSession
  ): Promise<IDoctor> {
    const query = Doctor.findOne({ _id: doctorId, isActive: true });
    if (session) query.session(session);
    const doctor = await query;

    if (!doctor) {
      throw new AppError('Doctor not found or inactive', 404);
    }

    if (doctor.availabilityStatus === 'UNAVAILABLE') {
      throw new AppError('Doctor is currently unavailable', 400);
    }

    const slot = doctor.availabilitySlots.find((s) => {
      return this.isSameDate(s.date, dateStr) && s.startTime === timeStr;
    });

    if (!slot) {
      throw new AppError('The selected appointment slot is not available for this doctor', 400);
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new AppError('The selected appointment slot is fully booked', 409);
    }

    slot.bookedCount += 1;
    doctor.markModified('availabilitySlots');

    if (session) {
      await doctor.save({ session });
    } else {
      await doctor.save();
    }

    return doctor;
  }

  /**
   * Release capacity for a slot (decrease bookedCount, min 0).
   */
  static async releaseSlotCapacity(
    doctorId: string,
    dateStr: string,
    timeStr: string,
    session?: ClientSession
  ): Promise<IDoctor | null> {
    const query = Doctor.findById(doctorId);
    if (session) query.session(session);
    const doctor = await query;

    if (!doctor) {
      return null;
    }

    const slot = doctor.availabilitySlots.find((s) => {
      return this.isSameDate(s.date, dateStr) && s.startTime === timeStr;
    });

    if (slot) {
      slot.bookedCount = Math.max(0, (slot.bookedCount || 0) - 1);
      doctor.markModified('availabilitySlots');

      if (session) {
        await doctor.save({ session });
      } else {
        await doctor.save();
      }
    }

    return doctor;
  }
}
