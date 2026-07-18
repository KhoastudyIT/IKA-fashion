import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// Conversation join users để lấy tên/email khách (chuẩn hóa, không lưu trùng)
const CONV_SELECT = `
  SELECT c.id, c.customer_id AS "customerId",
         u.name AS "customerName", u.email AS "customerEmail",
         c.last_message AS "lastMessage", c.last_message_at AS "lastMessageAt",
         c.unread_by_admin AS "unreadByAdmin", c.unread_by_customer AS "unreadByCustomer",
         c.created_at AS "createdAt"
  FROM conversations c JOIN users u ON u.id = c.customer_id
`;

const MSG_SELECT = `
  SELECT id, conversation_id AS "conversationId", sender_id AS "senderId",
         sender_role AS "senderRole", sender_name AS "senderName",
         content, is_read AS "isRead", created_at AS "createdAt"
  FROM messages
`;

async function convById(id) {
  const res = await db.query(`${CONV_SELECT} WHERE c.id = $1`, [id]);
  return res.rows[0] ?? null;
}

async function convByCustomer(customerId) {
  const res = await db.query(`${CONV_SELECT} WHERE c.customer_id = $1`, [customerId]);
  return res.rows[0] ?? null;
}

async function getOrCreateConversation(customerId) {
  await db.query(
    `INSERT INTO conversations (customer_id) VALUES ($1) ON CONFLICT (customer_id) DO NOTHING`,
    [customerId],
  );
  return convByCustomer(customerId);
}

// ─── Service Functions ─────────────────────────────────────────────────────────

/** Admin: Lấy tất cả cuộc trò chuyện, mới nhất trước */
export async function listAllConversations() {
  const res = await db.query(`${CONV_SELECT} ORDER BY c.last_message_at DESC`);
  return res.rows;
}

/** Customer: Lấy conversation của chính mình (hoặc null) */
export async function getMyConversation(customerId) {
  return convByCustomer(customerId);
}

/** Lấy tin nhắn của 1 cuộc trò chuyện */
export async function getMessages(conversationId, requesterId, requesterRole) {
  const conv = await convById(conversationId);
  if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
  if (requesterRole !== 'admin' && conv.customerId !== requesterId) {
    throw new AppError('Bạn không có quyền xem cuộc trò chuyện này', 403);
  }
  const res = await db.query(
    `${MSG_SELECT} WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId],
  );
  return res.rows;
}

/** Gửi tin nhắn */
export async function sendMessage({ senderId, senderRole, content, conversationId }) {
  let conv;
  if (senderRole === 'admin') {
    if (!conversationId) throw new AppError('Admin phải chỉ định cuộc trò chuyện', 400);
    conv = await convById(conversationId);
    if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
  } else {
    conv = await getOrCreateConversation(senderId);
  }

  const nameRes = await db.query('SELECT name, email FROM users WHERE id = $1', [senderId]);
  const senderName = nameRes.rows[0]?.name || nameRes.rows[0]?.email || 'Người dùng';

  const ins = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, conversation_id AS "conversationId", sender_id AS "senderId",
               sender_role AS "senderRole", sender_name AS "senderName",
               content, is_read AS "isRead", created_at AS "createdAt"`,
    [conv.id, senderId, senderRole, senderName, content],
  );
  const message = ins.rows[0];

  await db.query(
    `UPDATE conversations SET
       last_message = $2,
       last_message_at = $3,
       unread_by_admin = unread_by_admin + $4,
       unread_by_customer = unread_by_customer + $5
     WHERE id = $1`,
    [
      conv.id, content, message.createdAt,
      senderRole === 'customer' ? 1 : 0,
      senderRole === 'admin' ? 1 : 0,
    ],
  );

  return { message, conversation: await convById(conv.id) };
}

/** Đánh dấu đã đọc */
export async function markRead(conversationId, readerRole) {
  const conv = await convById(conversationId);
  if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);

  await db.query(
    `UPDATE conversations SET
       unread_by_admin = CASE WHEN $2 = 'admin' THEN 0 ELSE unread_by_admin END,
       unread_by_customer = CASE WHEN $2 = 'customer' THEN 0 ELSE unread_by_customer END
     WHERE id = $1`,
    [conversationId, readerRole],
  );
  // Tin của phía bên kia -> đánh dấu đã đọc
  await db.query(
    `UPDATE messages SET is_read = true
     WHERE conversation_id = $1 AND is_read = false AND sender_role <> $2`,
    [conversationId, readerRole],
  );

  return convById(conversationId);
}

/** Admin: Xóa 1 tin nhắn */
export async function deleteMessage(messageId, requesterRole) {
  if (requesterRole !== 'admin') throw new AppError('Chỉ admin mới có thể xóa tin nhắn', 403);
  const del = await db.query(
    'DELETE FROM messages WHERE id = $1 RETURNING conversation_id',
    [messageId],
  );
  if (!del.rows.length) throw new AppError('Không tìm thấy tin nhắn', 404);

  // Cập nhật lastMessage theo tin còn lại (rỗng nếu đã xóa hết)
  const convId = del.rows[0].conversation_id;
  await db.query(
    `UPDATE conversations SET
       last_message = COALESCE(
         (SELECT content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1), ''),
       last_message_at = COALESCE(
         (SELECT created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1), last_message_at)
     WHERE id = $1`,
    [convId],
  );
}

/** Admin: tổng số unread (badge) */
export async function getTotalUnreadForAdmin() {
  const res = await db.query('SELECT COALESCE(SUM(unread_by_admin), 0)::int AS total FROM conversations');
  return res.rows[0].total;
}
