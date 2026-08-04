import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateReply, WELCOME_MESSAGE } from './message.bot.js';

// Trả nguyên object thay vì mỗi product_id: nhân viên nhìn một con số id thì
// không biết khách đang hỏi mẫu nào.
const PRODUCT_JSON = (alias) => `
  CASE WHEN ${alias}.id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', ${alias}.id, 'name', ${alias}.name, 'handle', ${alias}.handle,
    'price', ${alias}.price, 'img', ${alias}.img
  ) END
`;

// Conversation join users để lấy tên/email khách (chuẩn hóa, không lưu trùng)
const CONV_SELECT = `
  SELECT c.id, c.customer_id AS "customerId",
         u.name AS "customerName", u.email AS "customerEmail",
         c.last_message AS "lastMessage", c.last_message_at AS "lastMessageAt",
         c.unread_by_admin AS "unreadByAdmin", c.unread_by_customer AS "unreadByCustomer",
         c.ai_enabled AS "aiEnabled", c.last_product_id AS "lastProductId",
         ${PRODUCT_JSON('lp')} AS "lastProduct",
         c.created_at AS "createdAt"
  FROM conversations c
  JOIN users u ON u.id = c.customer_id
  LEFT JOIN products lp ON lp.id = c.last_product_id
`;

const MSG_COLUMNS = (alias) => `
  ${alias}.id, ${alias}.conversation_id AS "conversationId", ${alias}.sender_id AS "senderId",
  ${alias}.sender_role AS "senderRole", ${alias}.sender_name AS "senderName",
  ${alias}.content, ${alias}.product_id AS "productId", ${alias}.suggestions, ${alias}.intent,
  ${alias}.is_read AS "isRead", ${alias}.created_at AS "createdAt"
`;

const MSG_SELECT = `
  SELECT ${MSG_COLUMNS('m')}, ${PRODUCT_JSON('p')} AS product
  FROM messages m
  LEFT JOIN products p ON p.id = m.product_id
`;

async function convById(id) {
  const res = await db.query(`${CONV_SELECT} WHERE c.id = $1`, [id]);
  return res.rows[0] ?? null;
}

async function convByCustomer(customerId) {
  const res = await db.query(`${CONV_SELECT} WHERE c.customer_id = $1`, [customerId]);
  return res.rows[0] ?? null;
}

/**
 * Ghi một tin nhắn và đồng bộ metadata hội thoại trong cùng một lượt.
 *
 * Tin của bot không cộng vào `unread_by_customer`: khách nhận nó ngay trong
 * response của chính câu mình vừa gửi, đánh dấu chưa đọc thì badge đỏ nhảy lên
 * trong khi khách đang nhìn thẳng vào câu trả lời.
 */
async function insertMessage(conversationId, {
  senderId = null, senderRole, senderName = '', content,
  productId = null, suggestions = [], intent = '',
}) {
  const isBot = senderRole === 'ai';

  // CTE vì RETURNING không JOIN được: thiếu thẻ sản phẩm thì tin hiện ngay
  // trên màn hình lại khác hình dạng với chính nó sau khi poll về.
  const ins = await db.query(
    `WITH ins AS (
       INSERT INTO messages
         (conversation_id, sender_id, sender_role, sender_name, content,
          product_id, suggestions, intent, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
       RETURNING *
     )
     SELECT ${MSG_COLUMNS('ins')}, ${PRODUCT_JSON('p')} AS product
     FROM ins LEFT JOIN products p ON p.id = ins.product_id`,
    [conversationId, senderId, senderRole, senderName, content,
     productId, JSON.stringify(suggestions), intent, isBot],
  );
  const message = ins.rows[0];

  await db.query(
    `UPDATE conversations SET
       last_message = $2,
       last_message_at = $3,
       unread_by_admin = unread_by_admin + $4,
       unread_by_customer = unread_by_customer + $5,
       last_product_id = COALESCE($6, last_product_id)
     WHERE id = $1`,
    [
      conversationId, content, message.createdAt,
      senderRole === 'customer' ? 1 : 0,
      senderRole === 'admin' ? 1 : 0,
      productId,
    ],
  );

  return message;
}

/** Mỗi khách một hội thoại, mở đầu bằng lời chào của bot. */
async function getOrCreateConversation(customerId) {
  const existing = await convByCustomer(customerId);
  if (existing) return existing;

  await db.query(
    `INSERT INTO conversations (customer_id) VALUES ($1) ON CONFLICT (customer_id) DO NOTHING`,
    [customerId],
  );
  const conv = await convByCustomer(customerId);

  // Hai tab cùng mở một lúc thì tab sau đọc lại bản ghi tab trước vừa tạo,
  // không được chào lần nữa.
  const count = await db.query(
    'SELECT COUNT(*)::int AS n FROM messages WHERE conversation_id = $1',
    [conv.id],
  );
  if (count.rows[0].n === 0) {
    await insertMessage(conv.id, {
      senderRole: 'ai',
      senderName: 'Trợ lý IKA',
      content: WELCOME_MESSAGE,
      intent: 'greeting',
    });
    return convById(conv.id);
  }

  return conv;
}

// Không có mốc này, chỉ một câu của admin là bot tắt vĩnh viễn — khách hỏi
// tiếp lúc nửa đêm sẽ không ai đáp.
const STAFF_IDLE_MS = 15 * 60 * 1000;

/**
 * Chỉ áp dụng khi hội thoại ĐÃ có tin của admin. Khách vừa gõ "gặp nhân viên"
 * mà chưa ai vào thì giữ nguyên bot tắt — đó là yêu cầu rõ ràng của khách.
 */
async function maybeReviveBot(conv) {
  if (conv.aiEnabled) return conv;

  const lastAdmin = await db.query(
    `SELECT created_at FROM messages
     WHERE conversation_id = $1 AND sender_role = 'admin'
     ORDER BY created_at DESC LIMIT 1`,
    [conv.id],
  );
  if (lastAdmin.rows.length === 0) return conv;

  const idleMs = Date.now() - new Date(lastAdmin.rows[0].created_at).getTime();
  if (idleMs < STAFF_IDLE_MS) return conv;

  await db.query('UPDATE conversations SET ai_enabled = true WHERE id = $1', [conv.id]);
  return { ...conv, aiEnabled: true };
}

// ─── Service Functions ─────────────────────────────────────────────────────────

/** Admin: Lấy tất cả cuộc trò chuyện, mới nhất trước */
export async function listAllConversations() {
  const res = await db.query(`${CONV_SELECT} ORDER BY c.last_message_at DESC`);
  return res.rows;
}

/**
 * Customer: lấy conversation của chính mình.
 *
 * Mặc định chỉ ĐỌC vì widget poll hàm này liên tục để cập nhật badge — tạo hội
 * thoại ở đây sẽ đẻ ra một luồng rỗng cho mọi khách vừa đăng nhập, làm ngập
 * hộp thư admin. Chỉ khi khách thực sự mở khung chat (`ensure`) mới tạo.
 */
export async function getMyConversation(customerId, { ensure = false } = {}) {
  return ensure ? getOrCreateConversation(customerId) : convByCustomer(customerId);
}

/** Lấy tin nhắn của 1 cuộc trò chuyện */
export async function getMessages(conversationId, requesterId, requesterRole) {
  const conv = await convById(conversationId);
  if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
  if (requesterRole !== 'admin' && conv.customerId !== requesterId) {
    throw new AppError('Bạn không có quyền xem cuộc trò chuyện này', 403);
  }
  const res = await db.query(
    // Phải nêu rõ alias m: products cũng có cột created_at.
    `${MSG_SELECT} WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
    [conversationId],
  );
  return res.rows;
}

/**
 * Gửi tin nhắn. Khách gửi thì bot trả lời ngay trong cùng response; admin gửi
 * thì bot tự tắt — hai bên cùng trả lời một khách sẽ rối.
 */
export async function sendMessage({ senderId, senderRole, content, conversationId, productId = null }) {
  let conv;
  if (senderRole === 'admin') {
    if (!conversationId) throw new AppError('Admin phải chỉ định cuộc trò chuyện', 400);
    conv = await convById(conversationId);
    if (!conv) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
  } else {
    conv = await getOrCreateConversation(senderId);
    conv = await maybeReviveBot(conv);
  }

  const nameRes = await db.query('SELECT name, email FROM users WHERE id = $1', [senderId]);
  const senderName = nameRes.rows[0]?.name || nameRes.rows[0]?.email || 'Người dùng';

  const message = await insertMessage(conv.id, {
    senderId, senderRole, senderName, content, productId,
  });

  if (senderRole === 'admin') {
    await db.query('UPDATE conversations SET ai_enabled = false WHERE id = $1', [conv.id]);
    return { message, botMessage: null, conversation: await convById(conv.id) };
  }

  if (!conv.aiEnabled) {
    return { message, botMessage: null, conversation: await convById(conv.id) };
  }

  const bot = await generateReply({
    text: content,
    userId: senderId,
    productId,
    lastProductId: conv.lastProductId,
  });

  const botMessage = await insertMessage(conv.id, {
    senderRole: 'ai',
    senderName: 'Trợ lý IKA',
    content: bot.message,
    productId: bot.productId,
    suggestions: bot.suggestions,
    intent: bot.intent,
  });

  if (bot.handoff) {
    await db.query('UPDATE conversations SET ai_enabled = false WHERE id = $1', [conv.id]);
    // Phải nổi lên trong hộp thư admin ngay, kể cả khi admin đã đọc hết
    // các tin trước đó.
    await db.query(
      'UPDATE conversations SET unread_by_admin = unread_by_admin + 1 WHERE id = $1',
      [conv.id],
    );
  }

  return { message, botMessage, conversation: await convById(conv.id) };
}

/** Admin: bật/tắt bot cho một hội thoại */
export async function setAiEnabled(conversationId, aiEnabled) {
  const res = await db.query(
    'UPDATE conversations SET ai_enabled = $2 WHERE id = $1 RETURNING id',
    [conversationId, aiEnabled],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
  return convById(conversationId);
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
