import * as svc from './message.service.js';

/** GET /messages/conversations — Admin xem tất cả */
export async function listConversations(_req, res) {
  const list = await svc.listAllConversations();
  res.json({ success: true, data: list });
}

/** GET /messages/my — Customer xem conversation của mình */
export async function getMyConversation(req, res) {
  const conv = await svc.getMyConversation(req.user.id);
  res.json({ success: true, data: conv || null });
}

/** GET /messages/:conversationId — Lấy tin nhắn của 1 conversation */
export async function getMessages(req, res) {
  const msgs = await svc.getMessages(req.params.conversationId, req.user.id, req.user.role);
  res.json({ success: true, data: msgs });
}

/** POST /messages — Gửi tin nhắn */
export async function sendMessage(req, res) {
  const { content, conversationId } = req.body;
  const result = await svc.sendMessage({
    senderId: req.user.id,
    senderRole: req.user.role,
    content,
    conversationId,
  });
  res.status(201).json({ success: true, data: result });
}

/** PUT /messages/:conversationId/read — Đánh dấu đã đọc */
export async function markRead(req, res) {
  const conv = await svc.markRead(req.params.conversationId, req.user.role);
  res.json({ success: true, data: conv });
}

/** DELETE /messages/:id — Admin xóa tin nhắn */
export async function deleteMessage(req, res) {
  await svc.deleteMessage(req.params.id, req.user.role);
  res.json({ success: true, message: 'Đã xóa tin nhắn' });
}

/** GET /messages/unread-count — Admin lấy tổng số unread */
export async function getUnreadCount(_req, res) {
  const count = await svc.getTotalUnreadForAdmin();
  res.json({ success: true, data: { count } });
}
