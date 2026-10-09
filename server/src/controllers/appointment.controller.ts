import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppointmentService } from '../services/appointment.service.js';

/**
 * POST /api/appointments
 * Auth required. Body validated by createAppointmentSchema.
 */
export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.user!.id;
  const appointment = await AppointmentService.createAppointment(patientId, req.body);
  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: { appointment },
  });
});

/**
 * GET /api/appointments/my
 * Auth required. Returns the authenticated patient's appointment history.
 */
export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.user!.id;
  const appointments = await AppointmentService.getMyAppointments(patientId);
  res.status(200).json({
    success: true,
    message: 'Appointments fetched successfully',
    data: { appointments },
  });
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await AppointmentService.getAppointmentById(req.user!.id, req.params.id as string);
  res.json({ success: true, message: 'Appointment fetched', data: { appointment } });
});
