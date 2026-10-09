import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Patient routes
router.post('/', authorizeRoles('PATIENT'), AppointmentController.bookAppointment);
router.get('/my', authorizeRoles('PATIENT'), AppointmentController.getMyAppointments);
router.patch('/:id/reschedule', authorizeRoles('PATIENT'), AppointmentController.rescheduleAppointment);
router.patch('/:id/cancel', authorizeRoles('PATIENT'), AppointmentController.cancelAppointment);

// Shared route (Patient can access own, Staff/Admin can access any)
router.get('/:id', authorizeRoles('PATIENT', 'STAFF', 'ADMIN'), AppointmentController.getAppointmentById);

// Staff/Admin routes
router.get('/', authorizeRoles('STAFF', 'ADMIN'), AppointmentController.getAllAppointmentsForStaff);
router.patch('/:id/status', authorizeRoles('STAFF', 'ADMIN'), AppointmentController.updateAppointmentStatusByStaff);

export default router;
