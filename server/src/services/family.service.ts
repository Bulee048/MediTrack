import { FamilyMember } from '../models/FamilyMember.js';
import { Appointment } from '../models/Appointment.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import type { CreateFamilyMemberInput, UpdateFamilyMemberInput } from '../validators/family.validator.js';
export class FamilyService {
  static list(owner: string) { return FamilyMember.find({ owner }).select('-nic').sort({ createdAt: 1 }); }
  static create(owner: string, data: CreateFamilyMemberInput) {
    return FamilyMember.create({ ...data, owner, dateOfBirth: new Date(data.dateOfBirth) });
  }
  static async update(owner: string, id: string, data: UpdateFamilyMemberInput) {
    validateObjectId(id, 'family member ID');
    const member = await FamilyMember.findOneAndUpdate({ _id: id, owner }, { $set: data }, { new: true, runValidators: true }).select('-nic');
    if (!member) throw new AppError('Family member not found', 404);
    return member;
  }
  static async remove(owner: string, id: string) {
    validateObjectId(id, 'family member ID');
    if (!await FamilyMember.exists({ _id: id, owner })) throw new AppError('Family member not found', 404);
    // Preserve the identity on historical appointments instead of leaving dangling references.
    if (await Appointment.exists({ familyMember: id })) throw new AppError('A family member with appointment history cannot be deleted', 409);
    const result = await FamilyMember.deleteOne({ _id: id, owner });
    if (!result.deletedCount) throw new AppError('Family member not found', 404);
  }
}
