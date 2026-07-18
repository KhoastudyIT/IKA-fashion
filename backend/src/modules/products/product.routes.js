import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.schema.js';

// Công khai — mount tại /api/v1/products
// (thứ tự quan trọng: route cụ thể trước route có tham số)
export const productPublicRouter = Router();
productPublicRouter.get('/',               validateQuery(productQuerySchema), productController.list);
productPublicRouter.get('/handle/:handle', productController.getByHandle);
productPublicRouter.get('/:id',            productController.getById);

// Admin quản lý sản phẩm — mount tại /api/v1/admin/products
export const productAdminRouter = Router();
productAdminRouter.use(authenticate, authorize('admin'));
productAdminRouter.post('/',      validate(createProductSchema), productController.create);
productAdminRouter.put('/:id',    validate(updateProductSchema), productController.update);
productAdminRouter.delete('/:id',                                productController.remove);
