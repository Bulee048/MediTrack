import { Router } from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Public routes
router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);

// Staff/Admin routes
router.post(
  '/',
  authenticate,
  authorizeRoles('STAFF', 'ADMIN'),
  validateBody(createDepartmentSchema),
  departmentController.create
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('STAFF', 'ADMIN'),
  validateBody(updateDepartmentSchema),
  departmentController.update
);

// Admin-only deactivation route
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  departmentController.deactivate
);

export default router;
