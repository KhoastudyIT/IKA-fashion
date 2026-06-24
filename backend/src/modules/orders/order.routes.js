import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from './order.schema.js';

export const orderRouter = Router();

orderRouter.use(authenticate);

// Admin (đặt trước /:id để không bị nuốt route)
orderRouter.get('/all',          authorize('admin'), orderController.listAll);
orderRouter.put('/:id/status',   authorize('admin'), validate(updateOrderStatusSchema), orderController.updateStatus);

// Customer
orderRouter.post('/',  validate(createOrderSchema), orderController.create);
orderRouter.get('/',   orderController.listMine);
orderRouter.get('/:id', orderController.getById);
