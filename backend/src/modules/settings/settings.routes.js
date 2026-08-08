import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateSettingsSchema } from './settings.schema.js';

// Công khai — mount tại /api/v1/settings.
// Header, Footer và trang Liên hệ của web khách đều đọc từ đây nên không thể đặt sau lớp xác thực.
export const settingsPublicRouter = Router();
settingsPublicRouter.get('/', settingsController.get);

// Admin — mount tại /api/v1/admin/settings
export const settingsAdminRouter = Router();
settingsAdminRouter.use(authenticate, authorize('admin'));
settingsAdminRouter.get('/', settingsController.get);
settingsAdminRouter.put('/', validate(updateSettingsSchema), settingsController.update);
