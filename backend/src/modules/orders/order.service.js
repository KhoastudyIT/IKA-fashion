import pool from '../../db/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { isBackoffice } from '../../utils/roles.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';
import { assertUsable, computeDiscount } from '../coupons/coupon.service.js';
import { shippingFeeOf, isExpressAvailable, EXPRESS_CITY } from './shipping.js';

// SELECT chung: 1 đơn kèm mảng items (json_agg), alias camelCase cho FE
const ORDER_SELECT = `
  SELECT o.id, o.user_id AS "userId", o.total_price AS "totalPrice",
         u.name  AS "customerName",
         u.email AS "customerEmail",
         o.discount, o.coupon_code AS "couponCode",
         o.status, o.payment_status AS "paymentStatus",
         o.shipping_address AS "shippingAddress", o.phone, o.notes,
         o.cancel_reason AS "cancelReason",
         -- totalPrice ĐÃ gồm shippingFee; tiền hàng = totalPrice - shippingFee.
         o.shipping_fee AS "shippingFee",
         o.shipping_method AS "shippingMethod",
         o.payment_method AS "paymentMethod",
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

export async function createOrder(userId, {
  shippingAddress, phone, notes, couponCode, city,
  shippingMethod = 'standard', paymentMethod = 'cod',
}) {
  // Giao hỏa tốc là giao trong ngày nên chỉ chạy được ở nơi có kho. Chặn ở
  // SERVER chứ không chỉ ẩn nút trên giao diện — ẩn nút thì gọi thẳng API vẫn
  // đặt được hỏa tốc cho địa chỉ ở tỉnh, mà shop thì không giao nổi.
  //
  // Ưu tiên trường `city` client gửi kèm; không có thì dò trong chuỗi địa chỉ.
  if (shippingMethod === 'express' && !isExpressAvailable(city || shippingAddress)) {
    throw new AppError(
      `Giao hỏa tốc hiện chỉ áp dụng cho địa chỉ tại ${EXPRESS_CITY}. `
      + 'Vui lòng chọn giao hàng nhanh hoặc tiêu chuẩn.',
      400,
    );
  }

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

    // Phí ship tra từ bảng ở server theo MÃ phương thức. Không nhận số tiền từ
    // client — nếu nhận thì sửa request là đặt được hỏa tốc với phí 0 đồng.
    const shippingFee = shippingFeeOf(shippingMethod);

    // total_price = số tiền nhân viên giao hàng phải thu, tức đã gồm phí ship.
    // Trước đây phí bị bỏ ra ngoài nên tổng trong CSDL luôn thiếu đúng bằng phí.
    const totalPrice = subtotal - discount + shippingFee;

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_price, discount, coupon_code, shipping_address,
                           phone, notes, shipping_fee, shipping_method, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [userId, totalPrice, discount, appliedCode, shippingAddress, phone, notes ?? '',
        shippingFee, shippingMethod, paymentMethod],
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
      // Trừ kho của ĐÚNG biến thể trước. Câu UPDATE có điều kiện `stock >= $4`
      // nên tự nó đã nguyên tử: hai người cùng mua size cuối cùng thì chỉ một
      // người trừ được, người kia nhận 0 dòng và bị báo hết hàng.
      await decVariantStock(client, it);

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
  page = Math.max(1, Number(page) || 1);
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

/**
 * Bước chuyển trạng thái đơn hợp lệ.
 *
 * Trước đây updateOrderStatus nhận bất kỳ giá trị nào trong enum nên admin bấm
 * thẳng từ "chờ xác nhận" sang "hoàn thành" được — bỏ qua cả khâu đóng gói lẫn
 * giao hàng, và mâu thuẫn với đặc tả use case 3.5.9 trong báo cáo.
 *
 * Làm theo đúng khuôn NEXT_STATUSES của return.service.js.
 *
 * 'returned' KHÔNG nằm trong bảng này: đơn chỉ vào trạng thái đó qua luồng duyệt
 * yêu cầu trả hàng, để không ai đặt tay mà quên hoàn kho.
 */
/** Tên tiếng Việt để câu báo lỗi đọc được, thay vì in ra mã trạng thái. */
const ORDER_STATUS_VI = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng',
};

const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  // Hàng đã rời cửa hàng: giao xong, hoặc giao không thành thì hủy.
  shipped: ['completed', 'cancelled'],
  // Đã chốt — muốn trả hàng thì đi đường yêu cầu trả/đổi.
  completed: [],
  cancelled: [],
  returned: [],
};

export async function updateOrderStatus(id, { status, paymentStatus }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa đơn để hai lần bấm "Hủy" liên tiếp không hoàn kho hai lần.
    const cur = await client.query(
      'SELECT status, payment_status FROM orders WHERE id = $1 FOR UPDATE', [id],
    );
    if (!cur.rows.length) throw new AppError('Không tìm thấy đơn hàng', 404);

    const curStatus = cur.rows[0].status;

    // Chặn bước nhảy sai logic. Đặt lại đúng trạng thái đang có thì bỏ qua —
    // giao diện admin gửi cả cụm form nên hay gửi lại giá trị cũ.
    if (status && status !== curStatus) {
      if (!(NEXT_STATUSES[curStatus] ?? []).includes(status)) {
        throw new AppError(
          `Không thể chuyển đơn từ "${ORDER_STATUS_VI[curStatus] ?? curStatus}" `
          + `sang "${ORDER_STATUS_VI[status] ?? status}".`,
          400,
        );
      }
    }

    const wasCancelled = curStatus === 'cancelled';
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
    if (nowCancelled && !wasCancelled) await restoreStock(client, id);

    await client.query('COMMIT');
    return getOrderRow(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Hoàn tồn kho và suất flash sale của một đơn bị hủy.
 *
 * Chạy trong transaction của lời gọi, sau khi đơn đã được khóa bằng FOR UPDATE —
 * nếu không, hai lần hủy chồng nhau sẽ cộng kho hai lần.
 */
/**
 * Trừ kho của đúng biến thể (size + màu) khi đặt hàng.
 *
 * Điều kiện `stock >= $4` nằm ngay trong câu UPDATE nên phép kiểm và phép trừ
 * là một thao tác nguyên tử — không cần đọc trước rồi so sánh, vốn có khe hở
 * cho hai đơn cùng lúc lấy chung số suất cuối.
 *
 * Chỉ khi UPDATE không đụng dòng nào mới đọc lại để báo lỗi cho rõ nguyên nhân.
 */
async function decVariantStock(client, it) {
  const res = await client.query(
    `UPDATE product_variants
     SET stock = stock - $4, updated_at = NOW()
     WHERE product_id = $1 AND size = $2 AND color = $3 AND stock >= $4
     RETURNING stock`,
    [it.product_id, it.size, it.color, it.quantity],
  );
  if (res.rows.length) return;

  const cur = await client.query(
    'SELECT stock FROM product_variants WHERE product_id = $1 AND size = $2 AND color = $3',
    [it.product_id, it.size, it.color],
  );
  if (!cur.rows.length) {
    throw new AppError(
      `Sản phẩm "${it.name}" không còn bán size ${it.size} màu ${it.color}`, 400,
    );
  }
  throw new AppError(
    `Sản phẩm "${it.name}" size ${it.size} màu ${it.color} chỉ còn ${cur.rows[0].stock} sản phẩm`,
    400,
  );
}

/**
 * Trả hàng về kho cho mọi dòng của một đơn: tồn kho tổng, tồn kho theo biến
 * thể, và suất flash sale.
 *
 * Tách riêng và EXPORT vì có hai nơi cần: hủy đơn (order.service) và chốt trả
 * hàng (return.service). Trước đây module trả hàng chép lại logic này, nên khi
 * thêm bảng product_variants thì chỉ đường hủy đơn được cập nhật — trả hàng
 * xong tổng tồn kho tăng mà không size nào được cộng lại.
 *
 * KHÔNG hoàn lượt mã giảm giá ở đây: hủy đơn thì hoàn (xem restoreStock), còn
 * trả hàng là một quyết định nghiệp vụ khác.
 */
export async function restoreOrderStock(client, orderId) {
  const items = await client.query(
    'SELECT product_id, size, color, quantity, flash_sale_id FROM order_items WHERE order_id = $1',
    [orderId],
  );
  for (const it of items.rows) {
    await client.query(
      `UPDATE products
       SET stock = stock + $2, sold = GREATEST(0, sold - $2)
       WHERE id = $1`,
      [it.product_id, it.quantity],
    );
    // Hoàn về đúng biến thể đã trừ. Nếu biến thể đã bị admin xoá (đổi bảng
    // size/màu của sản phẩm) thì không có gì để cộng lại — tổng ở products vẫn
    // đúng, chỉ là phần dôi ra không quy được về size nào.
    await client.query(
      `UPDATE product_variants
       SET stock = stock + $4, updated_at = NOW()
       WHERE product_id = $1 AND size = $2 AND color = $3`,
      [it.product_id, it.size, it.color, it.quantity],
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

/**
 * Hoàn kho khi HỦY đơn: trả hàng về kho, đồng thời trả lại lượt dùng mã giảm giá.
 */
async function restoreStock(client, orderId) {
  await restoreOrderStock(client, orderId);

  // GREATEST(0, ...) chặn số âm nếu admin đã sửa tay lượt dùng của mã.
  await client.query(
    `UPDATE coupons c
     SET used = GREATEST(0, c.used - 1)
     FROM orders o
     WHERE o.id = $1
       AND o.coupon_code <> ''
       AND UPPER(c.code) = UPPER(o.coupon_code)`,
    [orderId],
  );
}

/** Trạng thái mà khách còn tự hủy đơn được — hàng chưa rời cửa hàng. */
export const CUSTOMER_CANCELLABLE = ['pending', 'confirmed'];

/** Vì sao đơn ở trạng thái này không tự hủy được — nói rõ để khách biết làm gì tiếp. */
const CANCEL_BLOCKED_REASON = {
  shipped: 'Đơn đã được giao cho đơn vị vận chuyển nên không tự hủy được. Vui lòng liên hệ cửa hàng để được hỗ trợ.',
  completed: 'Đơn đã giao xong. Nếu sản phẩm chưa vừa ý, bạn hãy gửi yêu cầu trả hoặc đổi hàng.',
  cancelled: 'Đơn hàng này đã được hủy trước đó.',
  returned: 'Đơn hàng này đã được trả lại nên không hủy được nữa.',
};

/**
 * Khách tự hủy đơn của mình.
 *
 * Chỉ áp dụng cho đơn chưa rời cửa hàng (`pending`, `confirmed`); đơn đang giao
 * phải liên hệ cửa hàng, đơn đã giao xong thì đi đường trả/đổi hàng. Kho và suất
 * flash được hoàn y hệt khi admin hủy đơn.
 *
 * Lượt dùng mã giảm giá ĐƯỢC trả lại, giống luồng admin hủy đơn — cả hai đều gọi
 * chung restoreStock nên không thể tính khác nhau.
 */
export async function cancelMyOrder(id, userId, reason = '') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa đơn trước khi đọc trạng thái: hai lần bấm "Hủy" liên tiếp thì lần sau
    // phải thấy đơn đã hủy chứ không hoàn kho thêm lần nữa.
    const cur = await client.query(
      'SELECT user_id, status FROM orders WHERE id = $1 FOR UPDATE', [id],
    );
    if (!cur.rows.length) throw new AppError('Không tìm thấy đơn hàng', 404);

    const { user_id: ownerId, status } = cur.rows[0];
    if (ownerId !== userId) {
      throw new AppError('Bạn không có quyền hủy đơn hàng này', 403);
    }
    if (!CUSTOMER_CANCELLABLE.includes(status)) {
      throw new AppError(CANCEL_BLOCKED_REASON[status] ?? 'Đơn hàng này không hủy được', 400);
    }

    await client.query(
      `UPDATE orders SET status = 'cancelled', cancel_reason = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, reason],
    );
    await restoreStock(client, id);

    await client.query('COMMIT');
    return getOrderRow(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
