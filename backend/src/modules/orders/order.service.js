import pool from '../../db/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { isBackoffice } from '../../utils/roles.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';
import { assertUsable, computeDiscount } from '../coupons/coupon.service.js';

// SELECT chung: 1 đơn kèm mảng items (json_agg), alias camelCase cho FE
const ORDER_SELECT = `
  SELECT o.id, o.user_id AS "userId", o.total_price AS "totalPrice",
         u.name  AS "customerName",
         u.email AS "customerEmail",
         o.discount, o.coupon_code AS "couponCode",
         o.status, o.payment_status AS "paymentStatus",
         o.shipping_address AS "shippingAddress", o.phone, o.notes,
         o.created_at AS "createdAt", o.updated_at AS "updatedAt",
         COALESCE(
           json_agg(
             json_build_object(
               'productId', oi.product_id, 'name', oi.name, 'img', oi.img,
               'price', oi.price, 'size', oi.size, 'color', oi.color,
               'quantity', oi.quantity, 'lineTotal', oi.price * oi.quantity,
               -- Giá niêm yết và chương trình flash lúc đặt: hoá đơn PDF cần để
               -- in mức giảm của từng dòng hàng.
               'listPrice', oi.list_price, 'flashSaleId', oi.flash_sale_id
             ) ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
         ) AS items,
         -- Yêu cầu trả/đổi mới nhất của đơn (NULL = chưa có). Gắn kèm ở đây để
         -- trang chi tiết đơn của khách không phải gọi thêm một API nữa.
         (SELECT json_build_object(
                   'id', r.id, 'type', r.type, 'reason', r.reason, 'images', r.images,
                   'status', r.status, 'adminNote', r.admin_note,
                   'createdAt', r.created_at, 'resolvedAt', r.resolved_at)
          FROM order_returns r
          WHERE r.order_id = o.id
          ORDER BY r.created_at DESC LIMIT 1) AS "returnRequest"
  FROM orders o
  LEFT JOIN users u ON u.id = o.user_id
  LEFT JOIN order_items oi ON oi.order_id = o.id
`;

// json_agg gom order_items nên phải GROUP BY. o.id là khóa chính của orders nên
// Postgres tự suy ra các cột o.*, nhưng cột của users thì phải liệt kê tay.
const ORDER_GROUP_BY = 'GROUP BY o.id, u.name, u.email';

async function getOrderRow(id) {
  const res = await db.query(`${ORDER_SELECT} WHERE o.id = $1 ${ORDER_GROUP_BY}`, [id]);
  return res.rows[0] ?? null;
}

export async function createOrder(userId, { shippingAddress, phone, notes, couponCode }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy giỏ hàng kèm giá hiệu lực (khóa dòng sản phẩm để trừ kho an toàn).
    // FOR UPDATE OF p xếp hàng những người cùng mua một sản phẩm, nhờ đó hai
    // khách bấm đặt cùng lúc không cùng đọc được số suất flash còn lại.
    const cart = await client.query(
      `SELECT ci.product_id, ci.size, ci.color, ci.quantity,
              p.name, p.img, p.stock,
              p.price                  AS list_price,
              ${effectivePriceSQL('p')} AS price,
              active_flash.id          AS flash_sale_id,
              active_flash.remaining   AS flash_remaining
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       ${activeFlashJoin('p')}
       WHERE ci.user_id = $1
       FOR UPDATE OF p`,
      [userId],
    );
    if (!cart.rows.length) throw new AppError('Giỏ hàng đang trống', 400);

    // Kiểm tra tồn kho
    for (const it of cart.rows) {
      if (it.stock < it.quantity) {
        throw new AppError(`Sản phẩm "${it.name}" không đủ hàng (còn ${it.stock})`, 400);
      }
    }

    // Suất flash tính trên TỔNG số lượng của một sản phẩm, không phải từng dòng:
    // cùng một áo đặt 2 size là hai dòng giỏ hàng nhưng vẫn ăn chung một quota.
    const flashWanted = new Map();
    for (const it of cart.rows) {
      if (!it.flash_sale_id) continue;
      flashWanted.set(it.flash_sale_id, (flashWanted.get(it.flash_sale_id) ?? 0) + it.quantity);
    }
    for (const it of cart.rows) {
      if (!it.flash_sale_id) continue;
      const wanted = flashWanted.get(it.flash_sale_id);
      if (wanted > it.flash_remaining) {
        // Một dòng đơn chỉ mang được một đơn giá nên không thể vừa bán giá flash
        // cho phần trong suất vừa bán giá thường cho phần vượt. Báo rõ còn bao
        // nhiêu suất thay vì âm thầm tính khác giá đã hiển thị.
        throw new AppError(
          `Sản phẩm "${it.name}" chỉ còn ${it.flash_remaining} suất giá flash sale, bạn đang đặt ${wanted}.`,
          400,
        );
      }
    }

    const subtotal = cart.rows.reduce((s, it) => s + it.price * it.quantity, 0);

    // Áp mã giảm giá (nếu có) — kiểm tra lại phía server + tăng lượt dùng
    let discount = 0;
    let appliedCode = '';
    if (couponCode) {
      const cr = await client.query(
        'SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) FOR UPDATE', [couponCode],
      );
      const coupon = assertUsable(cr.rows[0], subtotal);
      discount = computeDiscount(coupon, subtotal);
      appliedCode = coupon.code;
      await client.query('UPDATE coupons SET used = used + 1 WHERE id = $1', [coupon.id]);
    }

    const totalPrice = subtotal - discount;

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_price, discount, coupon_code, shipping_address, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, totalPrice, discount, appliedCode, shippingAddress, phone, notes ?? ''],
    );
    const orderId = orderRes.rows[0].id;

    for (const it of cart.rows) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, name, img, price, list_price, flash_sale_id, size, color, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [orderId, it.product_id, it.name, it.img, it.price, it.list_price,
         it.flash_sale_id ?? null, it.size, it.color, it.quantity],
      );
      await client.query(
        `UPDATE products SET stock = stock - $2, sold = sold + $2 WHERE id = $1`,
        [it.product_id, it.quantity],
      );
      // Trừ suất flash đã dùng, không thì cột stock vô nghĩa và chương trình
      // bán được vô hạn cho tới khi hết giờ.
      if (it.flash_sale_id) {
        await client.query(
          `UPDATE flash_sales SET sold = sold + $2, updated_at = NOW() WHERE id = $1`,
          [it.flash_sale_id, it.quantity],
        );
      }
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    return getOrderRow(orderId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listMyOrders(userId) {
  const res = await db.query(
    `${ORDER_SELECT} WHERE o.user_id = $1 ${ORDER_GROUP_BY} ORDER BY o.created_at DESC`,
    [userId],
  );
  return res.rows;
}

export async function getOrder(id, user) {
  const order = await getOrderRow(id);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
  if (!isBackoffice(user.role) && order.userId !== user.id) {
    throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
  }
  return order;
}

export async function listAllOrders({ status, search, page = 1, limit = 15 } = {}) {
  page  = Math.max(1, Number(page)  || 1);
  limit = Math.max(1, Number(limit) || 15);

  const params = [];
  const where = [];

  if (status) {
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }

  // Tìm trên TOÀN BỘ đơn chứ không chỉ trang đang xem. Mã đơn hiển thị cho admin
  // là 8 ký tự đầu của UUID nên phải so bằng ILIKE trên dạng text; bỏ '#' ở đầu
  // để admin dán thẳng mã nhìn thấy trên bảng cũng tra được.
  const term = String(search ?? '').trim().replace(/^#/, '');
  if (term) {
    params.push(`%${term}%`);
    const i = params.length;
    where.push(`(
      o.id::text ILIKE $${i}
      OR o.phone ILIKE $${i}
      OR o.shipping_address ILIKE $${i}
      OR u.name ILIKE $${i}
      OR u.email ILIKE $${i}
    )`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Thống kê tính trên TOÀN BỘ đơn khớp bộ lọc, không phải trang đang xem —
  // các thẻ ở đầu trang quản lý đơn mà chỉ cộng 15 dòng của trang thì vừa sai
  // vừa nhảy số mỗi lần lật trang.
  //
  // Doanh thu chỉ tính đơn đã hoàn thành: cửa hàng thu tiền khi giao nên đơn
  // chưa giao xong chưa mang lại đồng nào. Cùng định nghĩa với trang Tổng Quan
  // (modules/stats/stats.service.js) để hai nơi không lệch nhau.
  const summaryRes = await db.query(
    `SELECT COUNT(*)::int                                            AS total,
            COUNT(*) FILTER (WHERE o.status = 'pending')::int        AS pending,
            COUNT(*) FILTER (WHERE o.status = 'completed')::int      AS completed,
            COALESCE(SUM(o.total_price)
                     FILTER (WHERE o.status = 'completed'), 0)::bigint AS revenue
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     ${whereSql}`,
    params,
  );
  const summaryRow = summaryRes.rows[0];
  const summary = { ...summaryRow, revenue: Number(summaryRow.revenue) };

  const total = summary.total;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `${ORDER_SELECT} ${whereSql} ${ORDER_GROUP_BY} ORDER BY o.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return { data: res.rows, pagination: { page, limit, total, totalPages }, summary };
}

export async function updateOrderStatus(id, { status, paymentStatus }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa đơn để hai lần bấm "Hủy" liên tiếp không hoàn kho hai lần.
    const cur = await client.query(
      'SELECT status, payment_status FROM orders WHERE id = $1 FOR UPDATE', [id],
    );
    if (!cur.rows.length) throw new AppError('Không tìm thấy đơn hàng', 404);

    const wasCancelled = cur.rows[0].status === 'cancelled';
    const nowCancelled = status === 'cancelled';

    // Cửa hàng thu tiền khi giao (COD), nên đơn đã giao xong thì đương nhiên đã
    // thanh toán — không để tồn tại đơn vừa "hoàn thành" vừa "chưa thanh toán".
    // Chỉ nâng từ 'unpaid'; 'refunded' là trạng thái đã chốt, không đụng tới.
    let nextPayment = paymentStatus ?? null;
    if (status === 'completed' && !nextPayment && cur.rows[0].payment_status === 'unpaid') {
      nextPayment = 'paid';
    }
    // Chặn cả chiều ngược lại: không cho gỡ thanh toán của đơn đã giao xong.
    const finalStatus = status ?? cur.rows[0].status;
    if (nextPayment === 'unpaid' && finalStatus === 'completed') {
      throw new AppError(
        'Đơn đã hoàn thành thì phải ở trạng thái đã thanh toán. '
        + 'Nếu cần hoàn tiền, hãy xử lý qua yêu cầu trả hàng.',
        400,
      );
    }

    const upd = await client.query(
      `UPDATE orders SET
         status = COALESCE($2, status),
         payment_status = COALESCE($3, payment_status),
         updated_at = NOW()
       WHERE id = $1 RETURNING id`,
      [id, status ?? null, nextPayment],
    );
    if (!upd.rows.length) throw new AppError('Không tìm thấy đơn hàng', 404);

    // Chỉ hoàn khi đơn thực sự CHUYỂN SANG hủy — cập nhật lại đơn đã hủy thì thôi.
    if (nowCancelled && !wasCancelled) {
      const items = await client.query(
        'SELECT product_id, quantity, flash_sale_id FROM order_items WHERE order_id = $1',
        [id],
      );
      for (const it of items.rows) {
        await client.query(
          `UPDATE products
           SET stock = stock + $2, sold = GREATEST(0, sold - $2)
           WHERE id = $1`,
          [it.product_id, it.quantity],
        );
        // Trả lại suất flash, không thì đơn hủy vẫn ăn mất suất của chương trình.
        if (it.flash_sale_id) {
          await client.query(
            `UPDATE flash_sales
             SET sold = GREATEST(0, sold - $2), updated_at = NOW()
             WHERE id = $1`,
            [it.flash_sale_id, it.quantity],
          );
        }
      }
    }

    await client.query('COMMIT');
    return getOrderRow(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
