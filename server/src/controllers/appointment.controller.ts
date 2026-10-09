import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service.js';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  getMyAppointmentsQuerySchema,
  getStaffAppointmentsQuerySchema,
} from '../validators/appointment.validator.js';

export class AppointmentController {
  static async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = bookAppointmentSchema.parse(req.body);
      const patientId = req.user!.id;

      const appointment = await AppointmentService.bookAppointment(patientId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = getMyAppointmentsQuerySchema.parse(req.query);
      const patientId = req.user!.id;

      const appointments = await AppointmentService.getMyAppointments(patientId, queryParams);

      res.status(200).json({
        success: true,
        message: 'Patient appointments retrieved successfully',
        data: { appointments },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const user = req.user!;

      const appointment = await AppointmentService.getAppointmentById(appointmentId, user);

      res.status(200).json({
        success: true,
        message: 'Appointment details retrieved successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async rescheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const patientId = req.user!.id;
      const validatedData = rescheduleAppointmentSchema.parse(req.body);

      const appointment = await AppointmentService.rescheduleAppointment(
        appointmentId,
        patientId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const patientId = req.user!.id;

      const appointment = await AppointmentService.cancelAppointment(appointmentId, patientId);

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllAppointmentsForStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = getStaffAppointmentsQuerySchema.parse(req.query);

      const appointments = await AppointmentService.getAllAppointmentsForStaff(queryParams);

      res.status(200).json({
        success: true,
        message: 'Staff appointments list retrieved successfully',
        data: { appointments },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAppointmentStatusByStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const validatedData = updateAppointmentStatusSchema.parse(req.body);

      const appointment = await AppointmentService.updateAppointmentStatusByStaff(
        appointmentId,
        validatedData.status
      );

      res.status(200).json({
        success: true,
        message: 'Appointment status updated successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const getMyAppointments = AppointmentController.getMyAppointments;
export const getAppointmentById = AppointmentController.getAppointmentById;
