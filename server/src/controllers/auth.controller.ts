import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthService } from '../services/auth.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.registerPatient(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getUserById(req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Current user profile fetched',
    data: { user },
  });
});
