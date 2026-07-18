import { Router } from 'express';
import * as ctrl from './coupon.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { applyCouponSchema, createCouponSchema, updateCouponSchema } from './coupon.schema.js';

// Khách hàng — mount tại /api/v1/customer/coupons
export const couponCustomerRouter = Router();
couponCustomerRouter.post('/apply', authenticate, validate(applyCouponSchema), ctrl.apply);

// Admin quản lý mã giảm giá — mount tại /api/v1/admin/coupons
export const couponAdminRouter = Router();
couponAdminRouter.use(authenticate, authorize('admin'));
couponAdminRouter.get('/',           ctrl.list);
couponAdminRouter.post('/',          validate(createCouponSchema), ctrl.create);
couponAdminRouter.put('/:id',        validate(updateCouponSchema), ctrl.update);
couponAdminRouter.put('/:id/toggle', ctrl.toggle);
couponAdminRouter.delete('/:id',     ctrl.remove);
