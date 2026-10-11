import { withAccountWrite } from './accountWrite.service.js';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import { z } from 'zod';
import { createStaffSchema, updateStaffSchema, staffProfileSchema, staffPreferencesSchema } from '../validators/staff.validator.js';

export class StaffService {
  static async findPatients(search:string){
    const escaped=search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return User.find({role:'PATIENT',isActive:true,$or:[{name:{$regex:escaped,$options:'i'}},{phone:search},{email:search.toLowerCase()}]}).select('name phone email').limit(20);
  }
  static async profile(id: string) {
    const user = await User.findOne({ _id: id, role: { $in: ['STAFF', 'ADMIN'] }, isActive: true }).select('name email phone role staffRole staffId staffPreferences');
    if (!user) throw new AppError('Active staff account required', 403);
    return user;
  }
  static async updateProfile(id: string, input: z.infer<typeof staffProfileSchema>) {
    return withAccountWrite(async session => {
    const user = await User.findOne({_id:id,role:{$in:['STAFF','ADMIN']},isActive:true}).select('name email phone role staffRole staffId staffPreferences').session(session);
    if(!user)throw new AppError('Active staff account required',403);
    if (input.email && await User.exists({ email: input.email.toLowerCase(), _id: { $ne: id } }).session(session)) throw new AppError('Email already belongs to another account', 409);
    user.name = input.name; user.email = input.email || undefined;
    await user.save({session}); return user;
    });
  }
  static async preferences(id: string, input: z.infer<typeof staffPreferencesSchema>) {
    await this.profile(id);
    const changes = Object.fromEntries(Object.entries(input).map(([key, value]) => [`staffPreferences.${key}`, value]));
    await User.updateOne({ _id: id }, { $set: changes }, { runValidators: true });
    return this.profile(id);
  }
  static async team() { return User.find({ role: { $in: ['STAFF', 'ADMIN'] } }).select('name email phone role staffRole staffId isActive').sort({ name: 1 }); }
  static async create(input: z.infer<typeof createStaffSchema>) {
    const passwordHash=await bcrypt.hash(input.password,12);
    const id=await withAccountWrite(async session => {
      if(await User.exists({$or:[{phone:input.phone},{staffId:input.staffId},...(input.email?[{email:input.email.toLowerCase()}]:[])]}).session(session))throw new AppError('Phone, email or staff ID already belongs to an account',409);
      const user=new User({name:input.name,phone:input.phone,email:input.email||undefined,staffId:input.staffId,staffRole:input.staffRole,role:'STAFF',passwordHash,isActive:true});
      await user.save({session});return user._id;
    });
    return User.findById(id).select('name email phone role staffRole staffId isActive');
  }

  static async updateTeam(id: string, input: z.infer<typeof updateStaffSchema>) {
    validateObjectId(id, 'staff account ID');
    const user = await User.findOneAndUpdate({ _id: id, role: 'STAFF' }, { $set: input }, { new: true, runValidators: true }).select('name email phone role staffRole staffId isActive');
    if (!user) throw new AppError('Only staff accounts can be managed here; administrator access is protected', 409);
    return user;
  }
}
