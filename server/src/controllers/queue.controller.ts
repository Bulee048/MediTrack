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
}
