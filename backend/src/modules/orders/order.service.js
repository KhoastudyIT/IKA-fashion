import pool from '../../db/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { isBackoffice } from '../../utils/roles.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';
import { assertUsable, computeDiscount } from '../coupons/coupon.service.js';

// SELECT chung: 1 đơn kèm mảng items (json_agg), alias camelCase cho FE
const ORDER_SELECT = `
  SELECT o.id, o.user_id AS "userId", o.total_price AS "totalPrice",
         o.discount, o.coupon_code AS "couponCode",
         o.status, o.payment_status AS "paymentStatus",
         o.shipping_address AS "shippingAddress", o.phone, o.notes,
         o.created_at AS "createdAt", o.updated_at AS "updatedAt",
         COALESCE(
           json_agg(
             json_build_object(
               'productId', oi.product_id, 'name', oi.name, 'img', oi.img,
               'price', oi.price, 'size', oi.size, 'color', oi.color,
               'quantity', oi.quantity, 'lineTotal', oi.price * oi.quantity
             ) ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
         ) AS items
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
`;

async function getOrderRow(id) {
  const res = await db.query(`${ORDER_SELECT} WHERE o.id = $1 GROUP BY o.id`, [id]);
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
    `${ORDER_SELECT} WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
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

export async function listAllOrders({ status, page = 1, limit = 15 } = {}) {
  page  = Math.max(1, Number(page)  || 1);
  limit = Math.max(1, Number(limit) || 15);

  const params = [];
  let whereSql = '';
  if (status) {
    params.push(status);
    whereSql = `WHERE o.status = $1`;
  }

  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM orders o ${whereSql}`,
    params,
  );
  const total = countRes.rows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `${ORDER_SELECT} ${whereSql} GROUP BY o.id ORDER BY o.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return { data: res.rows, pagination: { page, limit, total, totalPages } };
}

export async function updateOrderStatus(id, { status, paymentStatus }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa đơn để hai lần bấm "Hủy" liên tiếp không hoàn kho hai lần.
    const cur = await client.query(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id],
    );
    if (!cur.rows.length) throw new AppError('Không tìm thấy đơn hàng', 404);

    const wasCancelled = cur.rows[0].status === 'cancelled';
    const nowCancelled = status === 'cancelled';

    const upd = await client.query(
      `UPDATE orders SET
         status = COALESCE($2, status),
         payment_status = COALESCE($3, payment_status),
         updated_at = NOW()
       WHERE id = $1 RETURNING id`,
      [id, status ?? null, paymentStatus ?? null],
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
