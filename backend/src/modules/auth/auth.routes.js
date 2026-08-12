import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, readOnly } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, updateUserRoleSchema, createUserSchema, listUsersQuerySchema } from './auth.schema.js';

// Public / tài khoản cá nhân — mount tại /api/v1/auth
export const authRouter = Router();
authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.get('/me', authenticate, authController.getMe);
authRouter.put('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
authRouter.put('/password', authenticate, validate(changePasswordSchema), authController.changePassword);
authRouter.post('/logout', authenticate, authController.logout);

// Admin quản lý người dùng — mount tại /api/v1/admin/users
export const userAdminRouter = Router();
userAdminRouter.use(authenticate, authorize('admin', 'staff'), readOnly('staff'));
userAdminRouter.get('/', validateQuery(listUsersQuerySchema), authController.listUsers);
userAdminRouter.post('/', validate(createUserSchema), authController.createUser);
userAdminRouter.delete('/:id', authController.deleteUser);
userAdminRouter.put('/:id/toggle-lock', authController.toggleLockUser);
userAdminRouter.put('/:id/role', validate(updateUserRoleSchema), authController.updateUserRole);
