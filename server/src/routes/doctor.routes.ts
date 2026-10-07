import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
  updateAvailabilitySchema,
} from '../validators/doctor.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Public routes
router.get('/', doctorController.getAll);
router.get('/:id', doctorController.getById);
router.get('/:id/availability', doctorController.getAvailability);

// Protected Staff/Admin routes
router.post(
  '/',
  authenticate,
  authorizeRoles('STAFF', 'ADMIN'),
  validateBody(createDoctorSchema),
  doctorController.create
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('STAFF', 'ADMIN'),
  validateBody(updateDoctorSchema),
  doctorController.update
);

router.patch(
  '/:id/availability',
  authenticate,
  authorizeRoles('STAFF', 'ADMIN'),
  validateBody(updateAvailabilitySchema),
  doctorController.updateAvailability
);

export default router;
