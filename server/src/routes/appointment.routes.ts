import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createAppointmentSchema } from '../validators/appointment.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// All appointment endpoints require authentication
router.use(authenticate, authorizeRoles('PATIENT'));

// GET /api/appointments/my — list authenticated patient's appointments
router.get('/my', appointmentController.getMyAppointments);
router.get('/:id', appointmentController.getAppointmentById);

// POST /api/appointments — create a new appointment
router.post('/', validateBody(createAppointmentSchema), appointmentController.createAppointment);

export default router;
