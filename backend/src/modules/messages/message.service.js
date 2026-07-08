import { randomUUID } from 'crypto';
import { conversations, messages, users } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateConversation(customerId) {
  // Mỗi customer chỉ có 1 conversation với admin
  const existing = [...conversations.values()].find(c => c.customerId === customerId);
  if (existing) return existing;

  const user = users.get(customerId);
  const conv = {
    id: randomUUID(),
    customerId,
    customerName: user?.name || 'Khách hàng',
    customerEmail: user?.email || '',
    lastMessage: '',
    lastMessageAt: new Date().toISOString(),
    unreadByAdmin: 0,
    unreadByCustomer: 0,
    createdAt: new Date().toISOString(),
  };
  conversations.set(conv.id, conv);
  return conv;
}

function getConversationMessages(conversationId) {
  return [...messages.values()]
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// ─── Service Functions ─────────────────────────────────────────────────────────

/** Admin: Lấy tất cả cuộc trò chuyện, sắp xếp mới nhất trước */
export function listAllConversations() {
  return [...conversations.values()].sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );
}

/** Customer: Lấy conversation của chính mình */
export function getMyConversation(customerId) {
  const conv = [...conversations.values()].find(c => c.customerId === customerId);
  if (!conv) return null;
  return conv;
}

/** Lấy tin nhắn của 1 cuộc trò chuyện */
export function getMessages(conversationId, requesterId, requesterRole) {
  const conv = conversations.get(conversationId);
  if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);

  // Phân quyền: customer chỉ xem conversation của mình
  if (requesterRole !== 'admin' && conv.customerId !== requesterId) {
    throw new AppError('Bạn không có quyền xem cuộc trò chuyện này', 403);
  }

  return getConversationMessages(conversationId);
}

/** Gửi tin nhắn */
export function sendMessage({ senderId, senderRole, senderName, content, conversationId }) {
  let conv;

  if (senderRole === 'admin') {
    // Admin reply: phải có conversationId
    if (!conversationId) throw new AppError('Admin phải chỉ định cuộc trò chuyện', 400);
    conv = conversations.get(conversationId);
    if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
  } else {
    // Customer gửi: tạo hoặc lấy conversation của họ
    conv = getOrCreateConversation(senderId);
  }

  const msg = {
    id: randomUUID(),
    conversationId: conv.id,
    senderId,
    senderRole,
    senderName,
    content,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  messages.set(msg.id, msg);

  // Cập nhật conversation
  const updated = {
    ...conv,
    lastMessage: content,
    lastMessageAt: msg.createdAt,
    unreadByAdmin: senderRole === 'customer' ? conv.unreadByAdmin + 1 : conv.unreadByAdmin,
    unreadByCustomer: senderRole === 'admin' ? conv.unreadByCustomer + 1 : conv.unreadByCustomer,
  };
  conversations.set(conv.id, updated);

  return { message: msg, conversation: updated };
}

/** Đánh dấu đã đọc (admin đọc thì reset unreadByAdmin, customer đọc thì reset unreadByCustomer) */
export function markRead(conversationId, readerRole) {
  const conv = conversations.get(conversationId);
  if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);

  const updated = {
    ...conv,
    unreadByAdmin: readerRole === 'admin' ? 0 : conv.unreadByAdmin,
    unreadByCustomer: readerRole === 'customer' ? 0 : conv.unreadByCustomer,
  };
  conversations.set(conversationId, updated);

  // Đánh dấu các tin nhắn chưa đọc là đã đọc
  [...messages.values()]
    .filter(m => m.conversationId === conversationId && !m.isRead && m.senderRole !== readerRole)
    .forEach(m => messages.set(m.id, { ...m, isRead: true }));

  return updated;
}

/** Admin: Xóa 1 tin nhắn */
export function deleteMessage(messageId, requesterRole) {
  if (requesterRole !== 'admin') throw new AppError('Chỉ admin mới có thể xóa tin nhắn', 403);
  const msg = messages.get(messageId);
  if (!msg) throw new AppError('Không tìm thấy tin nhắn', 404);
  messages.delete(messageId);

  // Cập nhật lastMessage của conversation nếu cần
  const remaining = getConversationMessages(msg.conversationId);
  const conv = conversations.get(msg.conversationId);
  if (conv) {
    const last = remaining[remaining.length - 1];
    conversations.set(conv.id, {
      ...conv,
      lastMessage: last?.content || '',
      lastMessageAt: last?.createdAt || conv.lastMessageAt,
    });
  }
}

/** Lấy tổng số unread cho admin (để hiển thị badge) */
export function getTotalUnreadForAdmin() {
  return [...conversations.values()].reduce((sum, c) => sum + c.unreadByAdmin, 0);
}
