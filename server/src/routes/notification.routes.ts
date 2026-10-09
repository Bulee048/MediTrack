import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRoles('PATIENT'), NotificationController.getUserNotifications);
router.patch('/read-all', authorizeRoles('PATIENT'), NotificationController.markAllAsRead);
router.patch('/:id/read', authorizeRoles('PATIENT'), NotificationController.markAsRead);

export default router;
