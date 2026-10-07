import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('isActive role');

    if (!user) {
      throw new AppError('User account no longer exists', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is inactive', 401);
    }

    req.user = {
      id: decoded.id,
      role: user.role,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
}
