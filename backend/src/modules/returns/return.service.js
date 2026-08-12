import pool from '../../db/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

/** Số ngày kể từ lúc đơn hoàn tất mà khách còn được yêu cầu trả / đổi. */
export const RETURN_WINDOW_DAYS = 7;

const RETURN_COLS = `
  r.id,
  r.order_id    AS "orderId",
  r.type,
  r.reason,
  r.images,
  r.status,
  r.admin_note  AS "adminNote",
  r.resolved_at AS "resolvedAt",
  r.created_at  AS "createdAt"
`;

// Thông tin đơn đi kèm để trang quản trị khỏi phải gọi thêm API.
const ORDER_COLS = `
  o.total_price   AS "orderTotal",
  o.status        AS "orderStatus",
  o.created_at    AS "orderCreatedAt",
  u.name          AS "customerName",
  u.email         AS "customerEmail",
  o.phone         AS "customerPhone"
`;

/** Yêu cầu đang mở = chờ duyệt hoặc đã duyệt nhưng chưa xử lý xong. */
const OPEN_STATUSES = ['pending', 'approved'];

// ─── Khách hàng ──────────────────────────────────────────────────────────────

export async function createReturn(userId, { orderId, type, reason, images }) {
  const ordRes = await db.query(
    'SELECT id, user_id, status, updated_at FROM orders WHERE id = $1', [orderId],
  );
  const order = ordRes.rows[0];
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
  if (order.user_id !== userId) {
    throw new AppError('Bạn không có quyền thao tác trên đơn hàng này', 403);
  }
  if (order.status !== 'completed') {
    throw new AppError(
      'Chỉ đơn hàng đã hoàn thành mới yêu cầu trả hoặc đổi được. '
      + 'Đơn chưa giao xong thì hãy liên hệ để hủy.',
      400,
    );
  }

  // Mốc tính hạn là lúc đơn chuyển sang hoàn thành (updated_at), không phải lúc
  // đặt hàng — đơn giao lâu thì khách vẫn còn đủ thời gian đổi trả.
  const daysSince = (Date.now() - new Date(order.updated_at).getTime()) / 86400000;
  if (daysSince > RETURN_WINDOW_DAYS) {
    throw new AppError(
      `Đã quá ${RETURN_WINDOW_DAYS} ngày kể từ khi đơn hoàn thành nên không yêu cầu trả/đổi được nữa.`,
      400,
    );
  }

  try {
    const res = await db.query(
      `INSERT INTO order_returns (order_id, type, reason, images)
       VALUES ($1, $2, $3, $4::jsonb) RETURNING id`,
      [orderId, type, reason, JSON.stringify(images ?? [])],
    );
    return getReturnById(res.rows[0].id);
  } catch (err) {
    // Chỉ số một-phần chặn yêu cầu thứ hai khi đơn còn yêu cầu đang mở.
    if (err.code === '23505') {
      throw new AppError('Đơn hàng này đang có một yêu cầu chờ xử lý', 409);
    }
    throw err;
  }
}

export async function listMyReturns(userId) {
  const res = await db.query(
    `SELECT ${RETURN_COLS}, ${ORDER_COLS}
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     JOIN users  u ON u.id = o.user_id
     WHERE o.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId],
  );
  return res.rows;
}

// ─── Dùng chung ──────────────────────────────────────────────────────────────

export async function getReturnById(id) {
  const res = await db.query(
    `SELECT ${RETURN_COLS}, ${ORDER_COLS}
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     JOIN users  u ON u.id = o.user_id
     WHERE r.id = $1`,
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy yêu cầu', 404);
  return res.rows[0];
}

// ─── Admin / nhân viên ───────────────────────────────────────────────────────

export async function listReturns({ status, page = 1, limit = 15 } = {}) {
  page  = Math.max(1, Number(page)  || 1);
  limit = Math.max(1, Number(limit) || 15);

  const params = [];
  let whereSql = '';
  if (status) {
    params.push(status);
    whereSql = `WHERE r.status = $1`;
  }

  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM order_returns r ${whereSql}`, params,
  );
  const total = countRes.rows[0].total;

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `SELECT ${RETURN_COLS}, ${ORDER_COLS}
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     JOIN users  u ON u.id = o.user_id
     ${whereSql}
     ORDER BY r.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Bước chuyển hợp lệ — không cho quay lại trạng thái đã chốt. */
const NEXT_STATUSES = {
  pending:  ['approved', 'rejected'],
  approved: ['completed', 'rejected'],
  rejected: [],
  completed: [],
};

/**
 * Admin xét duyệt yêu cầu.
 *
 * Chỉ khi CHỐT trả hàng (`completed` + type `return`) mới đụng tới kho và tiền:
 * hoàn tồn kho, hoàn suất flash sale, đánh dấu đơn là đã trả và đã hoàn tiền.
 *
 * Đổi mới không đụng kho — khách trả một cái và nhận lại một cái cùng loại nên
 * số lượng ròng không đổi; đơn vẫn là 'completed' vì khách vẫn đang giữ hàng.
 */
export async function updateReturnStatus(id, { status, adminNote }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cur = await client.query(
      'SELECT * FROM order_returns WHERE id = $1 FOR UPDATE', [Number(id)],
    );
    if (!cur.rows.length) throw new AppError('Không tìm thấy yêu cầu', 404);
    const row = cur.rows[0];

    if (status && status !== row.status) {
      if (!NEXT_STATUSES[row.status].includes(status)) {
        throw new AppError(
          `Không thể chuyển yêu cầu từ "${row.status}" sang "${status}"`, 400,
        );
      }
    }

    const nextStatus = status ?? row.status;
    const isFinal = nextStatus === 'completed' || nextStatus === 'rejected';

    await client.query(
      `UPDATE order_returns SET
         status      = $2,
         admin_note  = COALESCE($3, admin_note),
         resolved_at = CASE WHEN $4::bool THEN NOW() ELSE resolved_at END,
         updated_at  = NOW()
       WHERE id = $1`,
      [Number(id), nextStatus, adminNote ?? null, isFinal],
    );

    if (nextStatus === 'completed' && row.status !== 'completed' && row.type === 'return') {
      const items = await client.query(
        'SELECT product_id, quantity, flash_sale_id FROM order_items WHERE order_id = $1',
        [row.order_id],
      );
      for (const it of items.rows) {
        await client.query(
          `UPDATE products
           SET stock = stock + $2, sold = GREATEST(0, sold - $2)
           WHERE id = $1`,
          [it.product_id, it.quantity],
        );
        // Hàng trả về thì suất flash cũng phải trả lại cho chương trình.
        if (it.flash_sale_id) {
          await client.query(
            `UPDATE flash_sales
             SET sold = GREATEST(0, sold - $2), updated_at = NOW()
             WHERE id = $1`,
            [it.flash_sale_id, it.quantity],
          );
        }
      }
      await client.query(
        `UPDATE orders SET
           status = 'returned',
           payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END,
           updated_at = NOW()
         WHERE id = $1`,
        [row.order_id],
      );
    }

    await client.query('COMMIT');
    return getReturnById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export { OPEN_STATUSES };
