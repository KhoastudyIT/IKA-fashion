import { Router } from 'express';
import * as cartController from './cart.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { addItemSchema, updateItemSchema } from './cart.schema.js';

export const cartRouter = Router();

// Tất cả route giỏ hàng đều yêu cầu đăng nhập.
// `key` của 1 dòng giỏ hàng có dạng "productId|size|color" (cần encode khi gọi).
cartRouter.use(authenticate);

cartRouter.get('/',          cartController.getCart);
cartRouter.post('/items',    validate(addItemSchema),    cartController.addItem);
cartRouter.put('/items/:key', validate(updateItemSchema), cartController.updateItem);
cartRouter.delete('/items/:key', cartController.removeItem);
cartRouter.delete('/',       cartController.clearCart);
