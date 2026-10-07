import { Types } from 'mongoose';
import { AppError } from './AppError.js';

export function validateObjectId(id: string, paramName: string = 'ID'): string {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${paramName} format`, 400);
  }
  return id;
}
