import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login',    validate(loginSchema),    authController.login);
authRouter.get('/me',        authenticate,             authController.getMe);
authRouter.put('/me',        authenticate, validate(updateProfileSchema), authController.updateProfile);
authRouter.post('/logout',   authenticate,             authController.logout);

// Admin
authRouter.get('/users',     authenticate, authorize('admin'), authController.listUsers);
authRouter.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);
authRouter.put('/users/:id/toggle-lock', authenticate, authorize('admin'), authController.toggleLockUser);
authRouter.put('/users/:id/role', authenticate, authorize('admin'), authController.updateUserRole);

