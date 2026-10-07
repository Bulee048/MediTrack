import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Patient queue routes
router.get('/me', authorizeRoles('PATIENT'), QueueController.getMyActiveTicket);
router.post('/check-in', authorizeRoles('PATIENT'), QueueController.checkIn);

export default router;
