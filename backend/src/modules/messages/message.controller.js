import * as svc from './message.service.js';
import { users } from '../../db/store.js';

/** GET /messages/conversations — Admin xem tất cả */
export function listConversations(req, res) {
  const list = svc.listAllConversations();
  res.json({ success: true, data: list });
}

/** GET /messages/my — Customer xem conversation của mình */
export function getMyConversation(req, res) {
  const conv = svc.getMyConversation(req.user.id);
  res.json({ success: true, data: conv || null });
}

/** GET /messages/:conversationId — Lấy tin nhắn của 1 conversation */
export function getMessages(req, res) {
  const msgs = svc.getMessages(req.params.conversationId, req.user.id, req.user.role);
  res.json({ success: true, data: msgs });
}

/** POST /messages — Gửi tin nhắn */
export function sendMessage(req, res) {
  const user = users.get(req.user.id);
  const { content, conversationId } = req.body;

  const result = svc.sendMessage({
    senderId: req.user.id,
    senderRole: req.user.role,
    senderName: user?.name || req.user.email,
    content,
    conversationId,
  });
  res.status(201).json({ success: true, data: result });
}

/** PUT /messages/:conversationId/read — Đánh dấu đã đọc */
export function markRead(req, res) {
  const conv = svc.markRead(req.params.conversationId, req.user.role);
  res.json({ success: true, data: conv });
}

/** DELETE /messages/:id — Admin xóa tin nhắn */
export function deleteMessage(req, res) {
  svc.deleteMessage(req.params.id, req.user.role);
  res.json({ success: true, message: 'Đã xóa tin nhắn' });
}

/** GET /messages/unread-count — Admin lấy tổng số unread */
export function getUnreadCount(req, res) {
  const count = svc.getTotalUnreadForAdmin();
  res.json({ success: true, data: { count } });
}
