import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import authRoutes from './auth.routes.js';

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

// Authentication routes
router.use('/auth', authRoutes);

export default router;
