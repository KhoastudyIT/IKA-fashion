import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from './order.schema.js';

// Khách hàng — mount tại /api/v1/customer/orders
export const orderCustomerRouter = Router();
orderCustomerRouter.use(authenticate, authorize('customer'));
orderCustomerRouter.post('/',    validate(createOrderSchema), orderController.create);
orderCustomerRouter.get('/',     orderController.listMine);
orderCustomerRouter.get('/:id',  orderController.getById);

// Admin quản lý tất cả đơn — mount tại /api/v1/admin/orders
// Nhân viên được quản lý đơn hàng như admin (kể cả đổi trạng thái).
export const orderAdminRouter = Router();
orderAdminRouter.use(authenticate, authorize('admin', 'staff'));
orderAdminRouter.get('/',            orderController.listAll);
orderAdminRouter.get('/:id',         orderController.getById);
orderAdminRouter.put('/:id/status',  validate(updateOrderStatusSchema), orderController.updateStatus);
