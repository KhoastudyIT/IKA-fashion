import { Router } from 'express';
import * as contactController from './contact.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createContactSchema, updateContactSchema, contactQuerySchema } from './contact.schema.js';

// Công khai — mount tại /api/v1/contacts.
// KHÔNG đặt sau authenticate: người gửi form Liên hệ hầu hết là khách vãng lai.
export const contactPublicRouter = Router();
contactPublicRouter.post('/', validate(createContactSchema), contactController.create);

// Admin — mount tại /api/v1/admin/contacts
// '/stats' phải đứng trước '/:id', không thì bị nuốt thành id.
export const contactAdminRouter = Router();
contactAdminRouter.use(authenticate, authorize('admin'));
contactAdminRouter.get('/stats',                                      contactController.stats);
contactAdminRouter.get('/',      validateQuery(contactQuerySchema),   contactController.list);
contactAdminRouter.get('/:id',                                        contactController.getOne);
contactAdminRouter.put('/:id',   validate(updateContactSchema),       contactController.update);
contactAdminRouter.delete('/:id',                                     contactController.remove);
