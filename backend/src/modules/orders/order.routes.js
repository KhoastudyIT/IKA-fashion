import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema, orderQuerySchema } from './order.schema.js';

// Khách hàng — mount tại /api/v1/customer/orders
export const orderCustomerRouter = Router();
orderCustomerRouter.use(authenticate, authorize('customer'));
orderCustomerRouter.post('/',    validate(createOrderSchema), orderController.create);
orderCustomerRouter.get('/',     orderController.listMine);
// Đặt trước '/:id' cũng được vì đường dẫn khác nhau, nhưng để cạnh nhau cho dễ đọc.
orderCustomerRouter.get('/:id/invoice', orderController.invoice);
orderCustomerRouter.get('/:id',  orderController.getById);

// Admin quản lý tất cả đơn — mount tại /api/v1/admin/orders
// Nhân viên được quản lý đơn hàng như admin (kể cả đổi trạng thái).
export const orderAdminRouter = Router();
orderAdminRouter.use(authenticate, authorize('admin', 'staff'));
orderAdminRouter.get('/',            validateQuery(orderQuerySchema), orderController.listAll);
orderAdminRouter.get('/:id/invoice', orderController.invoice);
orderAdminRouter.get('/:id',         orderController.getById);
orderAdminRouter.put('/:id/status',  validate(updateOrderStatusSchema), orderController.updateStatus);
