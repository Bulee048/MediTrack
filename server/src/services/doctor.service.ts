import mongoose from 'mongoose';
import { Doctor, IDoctor, IAvailabilitySlot } from '../models/Doctor.js';
import { Department } from '../models/Department.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import {
  CreateDoctorInput,
  UpdateDoctorInput,
  UpdateAvailabilityInput,
} from '../validators/doctor.validator.js';

export class DoctorService {
  static async getAllDoctors(params: {
    department?: string;
    available?: boolean | string;
    search?: string;
  }): Promise<IDoctor[]> {
    const filter: Record<string, unknown> = { isActive: true };

    if (params.department && params.department.trim()) {
      validateObjectId(params.department, 'department ID');
      filter.department = params.department;
    }

    if (params.available === true || params.available === 'true') {
      filter.availabilityStatus = { $in: ['AVAILABLE', 'LIMITED'] };
    }

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), 'i');
      filter.$or = [{ name: regex }, { title: regex }, { roomNumber: regex }];
    }

    return Doctor.find(filter)
      .populate('department', 'name code roomNumber description')
      .sort({ name: 1 });
  }

  static async getDoctorById(id: string): Promise<IDoctor> {
    validateObjectId(id, 'doctor ID');
    const doctor = await Doctor.findOne({ _id: id, isActive: true }).populate(
      'department',
      'name code roomNumber description'
    );

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    return doctor;
  }

  static async getDoctorAvailability(id: string) {
    const doctor = await this.getDoctorById(id);
    return {
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      availabilityStatus: doctor.availabilityStatus,
      slots: doctor.availabilitySlots,
    };
  }

  static async createDoctor(data: CreateDoctorInput): Promise<IDoctor> {
    validateObjectId(data.departmentId, 'department ID');
    const department = await Department.findOne({ _id: data.departmentId, isActive: true });
    if (!department) {
      throw new AppError('Department not found or inactive', 404);
    }

    const newDoctor = await Doctor.create({
      name: data.name,
      department: data.departmentId,
      title: data.title,
      experienceYears: data.experienceYears,
      consultationFee: data.consultationFee,
      roomNumber: data.roomNumber || department.roomNumber,
      availabilityStatus: data.availabilityStatus || 'AVAILABLE',
      availabilitySlots: [],
      isActive: true,
    });

    return (await newDoctor.populate('department', 'name code roomNumber')) as IDoctor;
  }

  static async updateDoctor(id: string, data: UpdateDoctorInput): Promise<IDoctor> {
    validateObjectId(id, 'doctor ID');
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    if (data.departmentId && data.departmentId !== doctor.department.toString()) {
      validateObjectId(data.departmentId, 'department ID');
      const department = await Department.findOne({ _id: data.departmentId, isActive: true });
      if (!department) {
        throw new AppError('Department not found or inactive', 404);
      }
      doctor.department = department._id as any;
    }

    if (data.name !== undefined) doctor.name = data.name;
    if (data.title !== undefined) doctor.title = data.title;
    if (data.experienceYears !== undefined) doctor.experienceYears = data.experienceYears;
    if (data.consultationFee !== undefined) doctor.consultationFee = data.consultationFee;
    if (data.roomNumber !== undefined) doctor.roomNumber = data.roomNumber;
    if (data.availabilityStatus !== undefined) doctor.availabilityStatus = data.availabilityStatus;
    if (data.isActive !== undefined) doctor.isActive = data.isActive;

    await doctor.save();
    return (await doctor.populate('department', 'name code roomNumber')) as IDoctor;
  }

  static async updateDoctorAvailability(
    id: string,
    data: UpdateAvailabilityInput
  ): Promise<IDoctor> {
    validateObjectId(id, 'doctor ID');
    await mongoose.connection.transaction(async session => {
      const doctor = await Doctor.findOneAndUpdate({_id:id},{$inc:{__v:1}},{session,new:true});
      if (!doctor) throw new AppError('Doctor not found',404);
      if (data.expectedVersion !== undefined && doctor.__v !== data.expectedVersion + 1) throw new AppError('Schedule changed since it was loaded. Reload and try again.',409);
      const key = (slot: { date: Date; startTime: string; endTime: string }) => `${slot.date.toISOString().slice(0,10)}_${slot.startTime}_${slot.endTime}`;
      const existing = new Map(doctor.availabilitySlots.map(slot=>[key(slot),slot]));
      const desired = new Set(data.slots.map(key));
      for (const slot of doctor.availabilitySlots) if (slot.bookedCount > 0 && !desired.has(key(slot))) throw new AppError('Cannot remove or move a slot with existing bookings',409);
      const updated: IAvailabilitySlot[] = data.slots.map(slot=>{
        const bookedCount=existing.get(key(slot))?.bookedCount ?? 0;
        if(slot.capacity<bookedCount) throw new AppError('Capacity cannot be lower than existing bookings',409);
        return {...slot,bookedCount};
      });
      doctor.availabilitySlots=updated as any;
      if(data.availabilityStatus)doctor.availabilityStatus=data.availabilityStatus;
      await doctor.save({session});
    });
    return (await Doctor.findById(id).populate('department','name code roomNumber'))!;
  }
}
