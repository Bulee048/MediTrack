import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { DoctorService } from '../services/doctor.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const department = typeof req.query.department === 'string' ? req.query.department : undefined;
  const available = typeof req.query.available === 'string' ? req.query.available : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const doctors = await DoctorService.getAllDoctors({ department, available, search });
  res.status(200).json({
    success: true,
    message: 'Doctors fetched successfully',
    data: { doctors },
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const doctor = await DoctorService.getDoctorById(id);
  res.status(200).json({
    success: true,
    message: 'Doctor details fetched successfully',
    data: { doctor },
  });
});

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const availability = await DoctorService.getDoctorAvailability(id);
  res.status(200).json({
    success: true,
    message: 'Doctor availability fetched successfully',
    data: availability,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await DoctorService.createDoctor(req.body);
  res.status(201).json({
    success: true,
    message: 'Doctor profile created successfully',
    data: { doctor },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const doctor = await DoctorService.updateDoctor(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Doctor profile updated successfully',
    data: { doctor },
  });
});

export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const doctor = await DoctorService.updateDoctorAvailability(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Doctor availability updated successfully',
    data: { doctor },
  });
});
