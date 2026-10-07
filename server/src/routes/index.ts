import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import authRoutes from './auth.routes.js';
import departmentRoutes from './department.routes.js';
import doctorRoutes from './doctor.routes.js';
import appointmentRoutes from './appointment.routes.js';
import queueRoutes from './queue.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'MediTrack API is running',
    data: {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// Mounted module routes
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/queue', queueRoutes);

export default router;
