import { Router } from 'express';
import * as ctrl from './message.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { sendMessageSchema, toggleBotSchema } from './message.schema.js';

// Khách hàng — mount tại /api/v1/customer/messages
export const messageCustomerRouter = Router();
// Admin trả lời khách qua messageAdminRouter, không dùng luồng của khách.
messageCustomerRouter.use(authenticate, authorize('customer'));
messageCustomerRouter.get('/my',                       ctrl.getMyConversation);
messageCustomerRouter.post('/',                        validate(sendMessageSchema), ctrl.sendMessage);
messageCustomerRouter.get('/:conversationId/messages', ctrl.getMessages);
messageCustomerRouter.put('/:conversationId/read',     ctrl.markRead);

// Admin — mount tại /api/v1/admin/messages
// Nhân viên trả lời khách qua đúng router này; controller quy role staff về
// 'admin' trước khi gọi service (xem message.controller.js).
export const messageAdminRouter = Router();
messageAdminRouter.use(authenticate, authorize('admin', 'staff'));
messageAdminRouter.get('/conversations',              ctrl.listConversations);
messageAdminRouter.get('/unread-count',               ctrl.getUnreadCount);
messageAdminRouter.post('/',                          validate(sendMessageSchema), ctrl.sendMessage);
messageAdminRouter.get('/:conversationId/messages',   ctrl.getMessages);
messageAdminRouter.put('/:conversationId/read',       ctrl.markRead);
messageAdminRouter.patch('/:conversationId/bot',      validate(toggleBotSchema), ctrl.toggleBot);
messageAdminRouter.delete('/:id',                     ctrl.deleteMessage);
