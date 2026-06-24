import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login',    validate(loginSchema),    authController.login);
authRouter.get('/me',        authenticate,             authController.getMe);
authRouter.put('/me',        authenticate, validate(updateProfileSchema), authController.updateProfile);
authRouter.post('/logout',   authenticate,             authController.logout);
