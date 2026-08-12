import { Router } from 'express';
import * as ctrl from './flash_sale.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, readOnly } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createFlashSaleSchema, updateFlashSaleSchema } from './flash_sale.schema.js';

// ── Công khai — mount tại /api/v1/flash-sales ──────────────────────────────
export const flashSalePublicRouter = Router();
flashSalePublicRouter.get('/active', ctrl.getActive);

// ── Admin — mount tại /api/v1/admin/flash-sales ────────────────────────────
// Flash sale là khuyến mãi nên nhân viên chỉ được xem, giống mục Khuyến Mãi.
export const flashSaleAdminRouter = Router();
flashSaleAdminRouter.use(authenticate, authorize('admin', 'staff'), readOnly('staff'));
flashSaleAdminRouter.get('/',             ctrl.list);
flashSaleAdminRouter.get('/:id',          ctrl.getOne);
flashSaleAdminRouter.post('/',            validate(createFlashSaleSchema), ctrl.create);
flashSaleAdminRouter.put('/:id',          validate(updateFlashSaleSchema), ctrl.update);
// Không có route xóa: chương trình chỉ được tạm ngưng hoặc kết thúc, để giữ
// lịch sử giá của các đơn đã mua theo nó (xem chú thích trong service).
flashSaleAdminRouter.patch('/:id/toggle', ctrl.toggle);
flashSaleAdminRouter.patch('/:id/end',    ctrl.end);
