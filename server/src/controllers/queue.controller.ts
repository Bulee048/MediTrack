import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services/queue.service.js';
import { checkInSchema } from '../validators/queue.validator.js';

export class QueueController {
  static async getMyActiveTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user!.id;
      const ticketData = await QueueService.getMyActiveTicket(patientId);

      if (!ticketData) {
        res.status(404).json({
          success: false,
          message: 'No active queue ticket found for today',
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Active queue ticket fetched successfully',
        data: { ticket: ticketData },
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = checkInSchema.parse(req.body);
      const patientId = req.user!.id;

      const ticket = await QueueService.checkIn(patientId, validated.appointmentId);

      res.status(201).json({
        success: true,
        message: 'Checked in successfully to queue',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllForStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, doctorId, status, date } = req.query;

      const tickets = await QueueService.getAllForStaff({
        departmentId: typeof departmentId === 'string' ? departmentId : undefined,
        doctorId: typeof doctorId === 'string' ? doctorId : undefined,
        status: typeof status === 'string' ? (status as any) : undefined,
        date: typeof date === 'string' ? date : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Staff active queue list fetched successfully',
        data: { tickets },
      });
    } catch (error) {
      next(error);
    }
  }

  static async callNext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId, departmentId } = req.body;

      const ticket = await QueueService.callNext({
        doctorId: typeof doctorId === 'string' ? doctorId : undefined,
        departmentId: typeof departmentId === 'string' ? departmentId : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Next patient called successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async startConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await QueueService.startConsultation(ticketId);

      res.status(200).json({
        success: true,
        message: 'Consultation started successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async completeConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await QueueService.completeConsultation(ticketId);

      res.status(200).json({
        success: true,
        message: 'Consultation completed successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async hold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await QueueService.hold(ticketId);

      res.status(200).json({
        success: true,
        message: 'Queue ticket placed on hold',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async skip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await QueueService.skip(ticketId);

      res.status(200).json({
        success: true,
        message: 'Queue ticket skipped',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }
}

