import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

export function errorMiddleware(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues.map((issue) => issue.message).join('; ');
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    const keyPattern = (err as { keyPattern?: Record<string, number> }).keyPattern;
    const field = keyPattern ? Object.keys(keyPattern)[0] : 'record';
    message = `A record with this ${field} already exists`;
  } else if (err.message) {
    message = err.message;
  }

  const responsePayload: { success: false; message: string; stack?: string } = {
    success: false,
    message,
  };

  if (env.NODE_ENV === 'development' && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}
