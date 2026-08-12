import { Router } from 'express';
import * as ctrl from './return.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createReturnSchema, updateReturnStatusSchema, returnQuerySchema } from './return.schema.js';

// Khách hàng — mount tại /api/v1/customer/returns
export const returnCustomerRouter = Router();
returnCustomerRouter.use(authenticate, authorize('customer'));
returnCustomerRouter.post('/', validate(createReturnSchema), ctrl.create);
returnCustomerRouter.get('/',                                ctrl.listMine);

// Admin — mount tại /api/v1/admin/returns
// Nhân viên xử lý trả/đổi như admin, vì đây là một phần của quản lý đơn hàng.
export const returnAdminRouter = Router();
returnAdminRouter.use(authenticate, authorize('admin', 'staff'));
returnAdminRouter.get('/',           validateQuery(returnQuerySchema),     ctrl.list);
returnAdminRouter.get('/:id',                                              ctrl.getOne);
returnAdminRouter.put('/:id/status', validate(updateReturnStatusSchema),   ctrl.updateStatus);
