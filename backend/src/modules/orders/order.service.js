import pool from '../../db/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
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

    // Lấy giỏ hàng (khóa dòng sản phẩm để trừ kho an toàn)
    const cart = await client.query(
      `SELECT ci.product_id, ci.size, ci.color, ci.quantity,
              p.name, p.img, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
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
        `INSERT INTO order_items (order_id, product_id, name, img, price, size, color, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, it.product_id, it.name, it.img, it.price, it.size, it.color, it.quantity],
      );
      await client.query(
        `UPDATE products SET stock = stock - $2, sold = sold + $2 WHERE id = $1`,
        [it.product_id, it.quantity],
      );
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
  if (user.role !== 'admin' && order.userId !== user.id) {
    throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
  }
  return order;
}

export async function listAllOrders({ status } = {}) {
  const params = [];
  let whereSql = '';
  if (status) {
    params.push(status);
    whereSql = `WHERE o.status = $1`;
  }
  const res = await db.query(
    `${ORDER_SELECT} ${whereSql} GROUP BY o.id ORDER BY o.created_at DESC`,
    params,
  );
  return res.rows;
}

export async function updateOrderStatus(id, { status, paymentStatus }) {
  const upd = await db.query(
    `UPDATE orders SET
       status = COALESCE($2, status),
       payment_status = COALESCE($3, payment_status),
       updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id, status ?? null, paymentStatus ?? null],
  );
  if (!upd.rows.length) throw new AppError('Không tìm thấy đơn hàng', 404);
  return getOrderRow(id);
}
