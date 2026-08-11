import { Router } from 'express';
import * as ctrl from './flash_sale.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createFlashSaleSchema,
  updateFlashSaleSchema,
  addProductSchema,
  updateProductSchema,
} from './flash_sale.schema.js';

// ── Public — mount tại /api/v1/flash-sales ─────────────────────────────────
export const flashSalePublicRouter = Router();

// Trả về các flash sale đang hoạt động kèm danh sách sản phẩm
flashSalePublicRouter.get('/active', ctrl.getActive);

// ── Admin — mount tại /api/v1/admin/flash-sales ────────────────────────────
export const flashSaleAdminRouter = Router();
flashSaleAdminRouter.use(authenticate, authorize('admin'));

// Flash sale CRUD
flashSaleAdminRouter.get('/',                         ctrl.list);
flashSaleAdminRouter.get('/:id',                      ctrl.getOne);
flashSaleAdminRouter.post('/',                         validate(createFlashSaleSchema), ctrl.create);
flashSaleAdminRouter.put('/:id',                       validate(updateFlashSaleSchema), ctrl.update);
flashSaleAdminRouter.patch('/:id/toggle',              ctrl.toggle);
flashSaleAdminRouter.delete('/:id',                    ctrl.remove);

// Products within a flash sale
flashSaleAdminRouter.post('/:id/products',             validate(addProductSchema),    ctrl.addProduct);
flashSaleAdminRouter.put('/:id/products/:productId',   validate(updateProductSchema), ctrl.updateProduct);
flashSaleAdminRouter.delete('/:id/products/:productId',                               ctrl.removeProduct);
