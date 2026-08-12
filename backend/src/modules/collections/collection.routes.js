import { Router } from 'express';
import * as collectionController from './collection.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, readOnly } from '../../middleware/authorize.js';

// Công khai — mount tại /api/v1/collections
export const collectionPublicRouter = Router();
collectionPublicRouter.get('/',      collectionController.list);
collectionPublicRouter.get('/:slug', collectionController.getBySlug);

// Admin quản lý danh mục — mount tại /api/v1/admin/collections
// Nhân viên chỉ được xem (đọc qua collectionPublicRouter).
export const collectionAdminRouter = Router();
collectionAdminRouter.use(authenticate, authorize('admin', 'staff'), readOnly('staff'));
collectionAdminRouter.post('/',      collectionController.create);
collectionAdminRouter.put('/:id',    collectionController.update);
collectionAdminRouter.delete('/:id', collectionController.remove);
