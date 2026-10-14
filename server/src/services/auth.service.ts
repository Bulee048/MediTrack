import { withAccountWrite } from './accountWrite.service.js';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken } from '../utils/jwt.js';
import { RegisterInput, LoginInput, UpdateProfileInput } from '../validators/auth.validator.js';

export interface SafeUserResponse {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  staffRole?: string;
  staffId?: string;
  nic?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
}

export interface AuthLoginResponse {
  user: SafeUserResponse;
  token: string;
}

function formatUserResponse(user: IUser): SafeUserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    staffRole: user.staffRole,
    staffId: user.staffId,
    nic: user.nic,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
  };
}

export class AuthService {
  static async registerPatient(data: RegisterInput): Promise<SafeUserResponse> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return withAccountWrite(async session => {
      if (await User.exists({ phone: data.phone }).session(session)) throw new AppError('An account with this phone number already exists',409);
      if (data.email && await User.exists({ email: data.email.toLowerCase() }).session(session)) throw new AppError('An account with this email address already exists',409);
      const user = new User({name:data.name,phone:data.phone,email:data.email?.toLowerCase()||undefined,passwordHash,role:'PATIENT',isActive:true});
      await user.save({session});
      return formatUserResponse(user);
    });
  }

  static async loginUser(data: LoginInput): Promise<AuthLoginResponse> {
    const queryConditions: Record<string, unknown>[] = [];
    if (data.email) queryConditions.push({ email: data.email.toLowerCase() });
    if (data.phone) queryConditions.push({ phone: data.phone });

    const user = await User.findOne({ $or: queryConditions }).select('+passwordHash');
    if (!user || !user.isActive || !user.passwordHash) {
      throw new AppError('Invalid email/phone or password', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email/phone or password', 401);
    }

    const token = signAccessToken({
      id: user._id.toString(),
      role: user.role,
    });

    return {
      user: formatUserResponse(user),
      token,
    };
  }

  static async getUserById(userId: string): Promise<SafeUserResponse> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    return formatUserResponse(user);
  }

  static async updatePatientProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<SafeUserResponse> {
    return withAccountWrite(async session => {
    const user = await User.findById(userId).session(session);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    if (user.role !== 'PATIENT') throw new AppError('Patient account required', 403);

    if (data.email !== undefined && data.email !== '') {
      const normalizedEmail = data.email.toLowerCase();
      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).session(session);
      if (existingEmail) {
        throw new AppError('An account with this email address already exists', 409);
      }
      user.email = normalizedEmail;
    } else if (data.email === '') {
      user.email = undefined;
    }

    if (data.phone !== undefined && data.phone !== user.phone) {
      const existingPhone = await User.findOne({
        phone: data.phone,
        _id: { $ne: user._id },
      }).session(session);
      if (existingPhone) {
        throw new AppError('An account with this phone number already exists', 409);
      }
      user.phone = data.phone;
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.dateOfBirth !== undefined) {
      user.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    }
    if (data.gender !== undefined) user.gender = data.gender;
    if (data.address !== undefined) user.address = data.address;

    await user.save({session});
    return formatUserResponse(user);
    });
  }
}
