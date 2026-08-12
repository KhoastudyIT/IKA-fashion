// =============================================================
// Giá hiệu lực của một sản phẩm — nguồn sự thật duy nhất.
//
// Thứ tự ưu tiên:
//   1. flash sale đang chạy còn suất  (flash_sales.price)
//   2. products.price                 (đã là giá bán sau `discount` của sản phẩm)
//
// Mọi nơi HIỂN THỊ giá và mọi nơi TÍNH TIỀN đều phải đi qua đây. Nếu trang sản
// phẩm, giỏ hàng và lúc chốt đơn dùng ba cách tính khác nhau thì khách sẽ thấy
// một giá rồi bị trừ tiền theo giá khác.
// =============================================================

/**
 * Điều kiện "chương trình flash sale còn hiệu lực với sản phẩm này".
 *
 * `sold < stock` là phần hay bị bỏ sót: hết suất thì phải dừng,
 * không thì flash sale thành giảm giá vĩnh viễn tới khi hết giờ.
 */
export const activeFlashWhere = (fs = 'fs') => `
  ${fs}.active = TRUE
  AND ${fs}.starts_at <= NOW()
  AND (${fs}.ends_at IS NULL OR ${fs}.ends_at >= NOW())
  AND ${fs}.sold < ${fs}.stock`;

/**
 * LEFT JOIN LATERAL lấy suất flash rẻ nhất đang có hiệu lực của sản phẩm.
 * Bí danh bảng sản phẩm mặc định là `p`.
 *
 * Kết quả nằm ở bí danh `active_flash` với các cột:
 *   id (flash_sales.id), price, remaining
 */
export const activeFlashJoin = (productAlias = 'p') => `
  LEFT JOIN LATERAL (
    SELECT fs.id,
           fs.price,
           fs.stock - fs.sold AS remaining
    FROM flash_sales fs
    WHERE fs.product_id = ${productAlias}.id
      AND ${activeFlashWhere('fs')}
    ORDER BY fs.price ASC
    LIMIT 1
  ) active_flash ON TRUE`;

/** Biểu thức SQL tính giá hiệu lực. Dùng kèm activeFlashJoin(). */
export const effectivePriceSQL = (productAlias = 'p') =>
  `COALESCE(active_flash.price, ${productAlias}.price)`;

/**
 * Phần trăm giảm, luôn tính trên giá niêm yết hiện tại của sản phẩm.
 * Không dựa vào original_price đã chụp lúc tạo chương trình — admin sửa giá sản
 * phẩm sau đó là con số lệch ngay.
 */
export function discountPercent(listPrice, salePrice) {
  const list = Number(listPrice ?? 0);
  const sale = Number(salePrice ?? 0);
  if (!(list > 0) || !(sale > 0) || sale >= list) return 0;
  return Math.round((1 - sale / list) * 100);
}
