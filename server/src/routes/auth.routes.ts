import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);

// Authenticated profile routes
router.get('/me', authenticate, authController.getMe);
router.get('/profile', authenticate, authController.getMe);
router.patch('/profile', authenticate, authorizeRoles('PATIENT'), validateBody(updateProfileSchema), authController.updateProfile);

export default router;
