import { Router } from 'express';
import * as ctrl from './message.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { sendMessageSchema } from './message.schema.js';

export const messageRouter = Router();

// Tất cả route đều cần đăng nhập
messageRouter.use(authenticate);

// Admin only
messageRouter.get('/conversations', authorize('admin'), ctrl.listConversations);
messageRouter.get('/unread-count',  authorize('admin'), ctrl.getUnreadCount);

// Customer: xem conversation của mình
messageRouter.get('/my', ctrl.getMyConversation);

// Shared: lấy tin nhắn theo conversation
messageRouter.get('/:conversationId/messages', ctrl.getMessages);

// Shared: gửi tin nhắn (customer tạo mới, admin reply)
messageRouter.post('/', validate(sendMessageSchema), ctrl.sendMessage);

// Shared: đánh dấu đã đọc
messageRouter.put('/:conversationId/read', ctrl.markRead);

// Admin: xóa tin nhắn
messageRouter.delete('/:id', authorize('admin'), ctrl.deleteMessage);
