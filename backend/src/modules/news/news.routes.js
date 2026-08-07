import { Router } from 'express';
import * as newsController from './news.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import {
  createNewsSchema,
  updateNewsSchema,
  updateNewsStatusSchema,
  newsQuerySchema,
  adminNewsQuerySchema,
} from './news.schema.js';

// Công khai — mount tại /api/v1/news
// '/categories' phải khai trước '/:idOrSlug', không thì bị nuốt thành slug bài viết.
export const newsPublicRouter = Router();
newsPublicRouter.get('/categories',  newsController.listCategories);
newsPublicRouter.get('/',            validateQuery(newsQuerySchema), newsController.list);
newsPublicRouter.get('/:idOrSlug',   newsController.getOne);

// Admin quản lý tin tức — mount tại /api/v1/admin/news
export const newsAdminRouter = Router();
newsAdminRouter.use(authenticate, authorize('admin'));
newsAdminRouter.get('/',             validateQuery(adminNewsQuerySchema), newsController.adminList);
newsAdminRouter.get('/:id',          newsController.adminGetById);
newsAdminRouter.post('/',            validate(createNewsSchema), newsController.create);
newsAdminRouter.put('/:id',          validate(updateNewsSchema), newsController.update);
newsAdminRouter.patch('/:id/status', validate(updateNewsStatusSchema), newsController.updateStatus);
newsAdminRouter.delete('/:id',       newsController.remove);
