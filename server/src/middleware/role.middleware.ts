import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access forbidden: insufficient permissions', 403));
    }

    next();
  };
}
