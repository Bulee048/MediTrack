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

// Staff/Admin queue routes
router.get('/', authorizeRoles('STAFF', 'ADMIN'), QueueController.getAllForStaff);
router.post('/call-next', authorizeRoles('STAFF', 'ADMIN'), QueueController.callNext);
router.patch('/:id/start-consultation', authorizeRoles('STAFF', 'ADMIN'), QueueController.startConsultation);
router.patch('/:id/complete', authorizeRoles('STAFF', 'ADMIN'), QueueController.completeConsultation);
router.patch('/:id/hold', authorizeRoles('STAFF', 'ADMIN'), QueueController.hold);
router.patch('/:id/skip', authorizeRoles('STAFF', 'ADMIN'), QueueController.skip);

export default router;

