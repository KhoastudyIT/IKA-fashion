import db from '../../db/index.js';

// Đơn bị hủy và đơn khách đã trả lại không được tính là doanh thu — dùng chung
// một định nghĩa ở mọi truy vấn dưới đây để các sheet trong báo cáo không đá nhau.
const REVENUE_STATUS = `o.status NOT IN ('cancelled', 'returned')`;

// Ngưỡng cảnh báo tồn kho, khớp với con số hiện trên bảng điều khiển.
const LOW_STOCK_THRESHOLD = 10;

/**
 * Các chỉ số tổng hợp của kỳ báo cáo, kèm vài số liệu toàn thời gian (tổng sản
 * phẩm, tổng khách) để người đọc có bối cảnh so sánh.
 */
async function getSummary(from, to) {
  const res = await db.query(
    `SELECT
       (SELECT COALESCE(SUM(o.total_price), 0)::bigint
        FROM orders o WHERE o.created_at >= $1 AND o.created_at < $2 AND ${REVENUE_STATUS})   AS revenue,
       (SELECT COUNT(*)::int
        FROM orders o WHERE o.created_at >= $1 AND o.created_at < $2)                          AS orders,
       (SELECT COUNT(*)::int
        FROM orders o WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status = 'cancelled') AS "cancelledOrders",
       (SELECT COUNT(*)::int
        FROM orders o WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status = 'completed') AS "completedOrders",
       (SELECT COALESCE(SUM(oi.quantity), 0)::int
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= $1 AND o.created_at < $2 AND ${REVENUE_STATUS})                  AS "itemsSold",
       (SELECT COUNT(*)::int
        FROM users WHERE role = 'customer' AND created_at >= $1 AND created_at < $2)           AS "newCustomers",
       (SELECT COUNT(*)::int FROM products)                                                     AS "totalProducts",
       (SELECT COUNT(*)::int FROM products WHERE stock < $3)                                    AS "lowStockCount",
       (SELECT COUNT(*)::int FROM users WHERE role = 'customer')                                AS "totalCustomers",
       -- Hai số toàn thời gian cho khối "tổng quan cửa hàng" trên bảng điều khiển,
       -- không phụ thuộc kỳ báo cáo đang chọn.
       (SELECT COUNT(*)::int FROM orders)                                                       AS "totalOrders",
       (SELECT COALESCE(SUM(o.total_price), 0)::bigint FROM orders o WHERE ${REVENUE_STATUS})   AS "totalRevenue"`,
    [from, to, LOW_STOCK_THRESHOLD],
  );

  const row = res.rows[0];
  // pg trả bigint dạng chuỗi để không mất độ chính xác; số tiền của cửa hàng
  // còn xa giới hạn Number nên ép về số cho tầng trên khỏi phải xử lý.
  const revenue = Number(row.revenue);
  const paidOrders = row.orders - row.cancelledOrders;

  return {
    ...row,
    revenue,
    totalRevenue: Number(row.totalRevenue),
    avgOrderValue: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
  };
}

/** Doanh thu và số đơn theo từng ngày, đã điền đủ cả những ngày không có đơn. */
async function getRevenueByDay(from, to) {
  const res = await db.query(
    `SELECT to_char(d, 'YYYY-MM-DD')       AS date,
            COALESCE(t.orders, 0)::int     AS orders,
            COALESCE(t.revenue, 0)::bigint AS revenue
     FROM generate_series($1::date, ($2::date - INTERVAL '1 day'), INTERVAL '1 day') AS d
     LEFT JOIN (
       SELECT o.created_at::date AS day,
              COUNT(*)::int      AS orders,
              SUM(o.total_price) AS revenue
       FROM orders o
       WHERE o.created_at >= $1 AND o.created_at < $2 AND ${REVENUE_STATUS}
       GROUP BY day
     ) t ON t.day = d::date
     ORDER BY d`,
    [from, to],
  );
  return res.rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
}

/** Sản phẩm bán chạy trong kỳ, kèm tồn kho hiện tại để biết có cần nhập thêm. */
async function getTopProducts(from, to, limit = 20) {
  const res = await db.query(
    `SELECT oi.name,
            COALESCE(c.name, p.collection, '—')  AS collection,
            SUM(oi.quantity)::int                AS sold,
            SUM(oi.price * oi.quantity)::bigint  AS revenue,
            COALESCE(MAX(p.stock), 0)::int       AS stock
     FROM order_items oi
     JOIN orders o       ON o.id = oi.order_id
     LEFT JOIN products p    ON p.id = oi.product_id
     LEFT JOIN collections c ON c.slug = p.collection
     WHERE o.created_at >= $1 AND o.created_at < $2 AND ${REVENUE_STATUS}
     GROUP BY oi.product_id, oi.name, c.name, p.collection
     ORDER BY sold DESC, revenue DESC
     LIMIT $3`,
    [from, to, limit],
  );
  return res.rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
}

/** Danh sách đơn trong kỳ để đối chiếu chi tiết. */
async function getOrders(from, to) {
  const res = await db.query(
    `SELECT o.id, o.created_at AS "createdAt", o.total_price AS total,
            o.discount, o.coupon_code AS "couponCode",
            o.status, o.payment_status AS "paymentStatus",
            o.phone, o.shipping_address AS "shippingAddress",
            u.name AS "customerName", u.email AS "customerEmail",
            COALESCE(SUM(oi.quantity), 0)::int AS "itemCount"
     FROM orders o
     LEFT JOIN users u        ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.created_at >= $1 AND o.created_at < $2
     GROUP BY o.id, u.name, u.email
     ORDER BY o.created_at DESC`,
    [from, to],
  );
  return res.rows;
}

async function getOrdersByStatus(from, to) {
  const res = await db.query(
    `SELECT o.status, COUNT(*)::int AS count,
            COALESCE(SUM(o.total_price), 0)::bigint AS revenue
     FROM orders o
     WHERE o.created_at >= $1 AND o.created_at < $2
     GROUP BY o.status
     ORDER BY count DESC`,
    [from, to],
  );
  return res.rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
}

async function getRevenueByCollection(from, to) {
  const res = await db.query(
    `SELECT COALESCE(c.name, p.collection, '—') AS collection,
            SUM(oi.quantity)::int               AS sold,
            SUM(oi.price * oi.quantity)::bigint AS revenue
     FROM order_items oi
     JOIN orders o           ON o.id = oi.order_id
     LEFT JOIN products p    ON p.id = oi.product_id
     LEFT JOIN collections c ON c.slug = p.collection
     WHERE o.created_at >= $1 AND o.created_at < $2 AND ${REVENUE_STATUS}
     GROUP BY COALESCE(c.name, p.collection, '—')
     ORDER BY revenue DESC`,
    [from, to],
  );
  return res.rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
}

async function getTopCustomers(from, to, limit = 20) {
  const res = await db.query(
    `SELECT u.name, u.phone, u.email,
            COUNT(o.id)::int                 AS orders,
            COALESCE(SUM(o.total_price), 0)::bigint AS spent
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.created_at >= $1 AND o.created_at < $2 AND ${REVENUE_STATUS}
     GROUP BY u.id, u.name, u.phone, u.email
     ORDER BY spent DESC
     LIMIT $3`,
    [from, to, limit],
  );
  return res.rows.map((r) => ({ ...r, spent: Number(r.spent) }));
}

/** Yêu cầu trả / đổi gửi trong kỳ. */
async function getReturns(from, to) {
  const res = await db.query(
    `SELECT r.created_at AS "createdAt", r.type, r.reason, r.status,
            r.admin_note AS "adminNote",
            o.total_price AS "orderTotal",
            u.name AS "customerName"
     FROM order_returns r
     JOIN orders o     ON o.id = r.order_id
     LEFT JOIN users u ON u.id = o.user_id
     WHERE r.created_at >= $1 AND r.created_at < $2
     ORDER BY r.created_at DESC`,
    [from, to],
  );
  return res.rows;
}

/** Hàng sắp hết — không phụ thuộc kỳ báo cáo, luôn là tình trạng kho hiện tại. */
async function getLowStock() {
  const res = await db.query(
    `SELECT p.name, p.handle,
            COALESCE(c.name, p.collection, '—') AS collection,
            p.stock, p.sold
     FROM products p
     LEFT JOIN collections c ON c.slug = p.collection
     WHERE p.stock < $1
     ORDER BY p.stock ASC, p.name ASC`,
    [LOW_STOCK_THRESHOLD],
  );
  return res.rows;
}

/**
 * Toàn bộ dữ liệu cho báo cáo Excel.
 *
 * Các truy vấn độc lập nhau nên chạy song song; tất cả đều là SELECT nên không
 * cần gói trong transaction.
 *
 * @param {{from: Date, to: Date}} range  Khoảng nửa mở [from, to)
 */
export async function getReportData({ from, to }) {
  const [
    summary, revenueByDay, topProducts, orders,
    ordersByStatus, revenueByCollection, topCustomers, returns, lowStock,
  ] = await Promise.all([
    getSummary(from, to),
    getRevenueByDay(from, to),
    getTopProducts(from, to),
    getOrders(from, to),
    getOrdersByStatus(from, to),
    getRevenueByCollection(from, to),
    getTopCustomers(from, to),
    getReturns(from, to),
    getLowStock(),
  ]);

  return {
    summary, revenueByDay, topProducts, orders,
    ordersByStatus, revenueByCollection, topCustomers, returns, lowStock,
  };
}
