import { Router } from 'express';
import * as ctrl from './message.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { sendMessageSchema } from './message.schema.js';

// Khách hàng — mount tại /api/v1/customer/messages
export const messageCustomerRouter = Router();
messageCustomerRouter.use(authenticate);
messageCustomerRouter.get('/my',                       ctrl.getMyConversation);
messageCustomerRouter.post('/',                        validate(sendMessageSchema), ctrl.sendMessage);
messageCustomerRouter.get('/:conversationId/messages', ctrl.getMessages);
messageCustomerRouter.put('/:conversationId/read',     ctrl.markRead);

// Admin — mount tại /api/v1/admin/messages
export const messageAdminRouter = Router();
messageAdminRouter.use(authenticate, authorize('admin'));
messageAdminRouter.get('/conversations',              ctrl.listConversations);
messageAdminRouter.get('/unread-count',               ctrl.getUnreadCount);
messageAdminRouter.post('/',                          validate(sendMessageSchema), ctrl.sendMessage);
messageAdminRouter.get('/:conversationId/messages',   ctrl.getMessages);
messageAdminRouter.put('/:conversationId/read',       ctrl.markRead);
messageAdminRouter.delete('/:id',                     ctrl.deleteMessage);
