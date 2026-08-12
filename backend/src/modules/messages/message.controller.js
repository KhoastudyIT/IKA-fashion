import * as svc from './message.service.js';
import { isBackoffice } from '../../utils/roles.js';

/**
 * Quy vai trò của người gọi về đúng hai phía mà tầng tin nhắn hiểu.
 *
 * Nhân viên (staff) trả lời khách bằng chính luồng của admin, và cột
 * messages.sender_role có CHECK ('customer','admin','ai') — nên staff phải
 * được ghi nhận là 'admin', không đẩy thẳng req.user.role xuống service.
 */
function actorRole(req) {
  return isBackoffice(req.user.role) ? 'admin' : 'customer';
}

/** GET /messages/conversations — Admin xem tất cả */
export async function listConversations(_req, res) {
  const list = await svc.listAllConversations();
  res.json({ success: true, data: list });
}

/** GET /messages/my?ensure=1 — Customer xem conversation của mình (ensure: tạo nếu chưa có) */
export async function getMyConversation(req, res) {
  const conv = await svc.getMyConversation(req.user.id, { ensure: req.query.ensure === '1' });
  res.json({ success: true, data: conv || null });
}

/** GET /messages/:conversationId — Lấy tin nhắn của 1 conversation */
export async function getMessages(req, res) {
  const msgs = await svc.getMessages(req.params.conversationId, req.user.id, actorRole(req));
  res.json({ success: true, data: msgs });
}

/** POST /messages — Gửi tin nhắn (khách gửi thì bot trả lời ngay trong response) */
export async function sendMessage(req, res) {
  const { content, conversationId, productId } = req.body;
  const result = await svc.sendMessage({
    senderId: req.user.id,
    senderRole: actorRole(req),
    content,
    conversationId,
    productId,
  });
  res.status(201).json({ success: true, data: result });
}

/** PATCH /messages/:conversationId/bot — Admin bật/tắt bot cho hội thoại */
export async function toggleBot(req, res) {
  const conv = await svc.setAiEnabled(req.params.conversationId, req.body.aiEnabled);
  res.json({ success: true, data: conv });
}

/** PUT /messages/:conversationId/read — Đánh dấu đã đọc */
export async function markRead(req, res) {
  const conv = await svc.markRead(req.params.conversationId, actorRole(req));
  res.json({ success: true, data: conv });
}

/** DELETE /messages/:id — Admin xóa tin nhắn */
export async function deleteMessage(req, res) {
  await svc.deleteMessage(req.params.id, actorRole(req));
  res.json({ success: true, message: 'Đã xóa tin nhắn' });
}

/** GET /messages/unread-count — Admin lấy tổng số unread */
export async function getUnreadCount(_req, res) {
  const count = await svc.getTotalUnreadForAdmin();
  res.json({ success: true, data: { count } });
}
