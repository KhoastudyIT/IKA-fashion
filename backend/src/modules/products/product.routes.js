import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.schema.js';

export const productRouter = Router();

// Public (thứ tự quan trọng: route cụ thể trước route có tham số)
productRouter.get('/',                validateQuery(productQuerySchema), productController.list);
productRouter.get('/handle/:handle',  productController.getByHandle);
productRouter.get('/:id',             productController.getById);

// Protected (chỉ admin)
productRouter.post('/',      authenticate, authorize('admin'), validate(createProductSchema), productController.create);
productRouter.put('/:id',    authenticate, authorize('admin'), validate(updateProductSchema), productController.update);
productRouter.delete('/:id', authenticate, authorize('admin'),                                productController.remove);
