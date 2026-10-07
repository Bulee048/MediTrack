import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken } from '../utils/jwt.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export interface SafeUserResponse {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
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
    nic: user.nic,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
  };
}

export class AuthService {
  static async registerPatient(data: RegisterInput): Promise<SafeUserResponse> {
    const existingPhone = await User.findOne({ phone: data.phone });
    if (existingPhone) {
      throw new AppError('An account with this phone number already exists', 409);
    }

    if (data.email) {
      const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
      if (existingEmail) {
        throw new AppError('An account with this email address already exists', 409);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await User.create({
      name: data.name,
      phone: data.phone,
      email: data.email ? data.email.toLowerCase() : undefined,
      passwordHash,
      role: 'PATIENT',
      isActive: true,
    });

    return formatUserResponse(newUser);
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
}
