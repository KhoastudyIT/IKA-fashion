import { Router } from 'express';
import * as ctrl from './review.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createReviewSchema, replyReviewSchema } from './review.schema.js';

// Công khai — mount tại /api/v1/reviews
export const reviewPublicRouter = Router();
reviewPublicRouter.get('/product/:productId', ctrl.listByProduct);

// Khách hàng — mount tại /api/v1/customer/reviews
export const reviewCustomerRouter = Router();
reviewCustomerRouter.use(authenticate);
reviewCustomerRouter.get('/eligibility/:productId', ctrl.eligibility);
reviewCustomerRouter.post('/', validate(createReviewSchema), ctrl.create);

// Admin kiểm duyệt — mount tại /api/v1/admin/reviews
export const reviewAdminRouter = Router();
reviewAdminRouter.use(authenticate, authorize('admin'));
reviewAdminRouter.get('/',            ctrl.listAll);
reviewAdminRouter.put('/:id/approve', ctrl.toggleApprove);
reviewAdminRouter.put('/:id/reply',   validate(replyReviewSchema), ctrl.reply);
reviewAdminRouter.delete('/:id',      ctrl.remove);
