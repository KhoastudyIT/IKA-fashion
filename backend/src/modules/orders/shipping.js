/**
 * Bảng phí vận chuyển — nguồn sự thật DUY NHẤT.
 *
 * Client chỉ gửi lên MÃ phương thức, không gửi số tiền. Nếu tin số tiền client
 * gửi thì khách sửa request là đặt được "giao hỏa tốc" với phí 0 đồng.
 *
 * Giá phải khớp với SHIPPING_OPTIONS ở frontend/app/(client)/checkout/page.tsx —
 * lệch nhau thì khách thấy một số, đơn lưu một số khác, đúng lỗi đang sửa.
 */
export const SHIPPING_METHODS = {
  standard: { fee: 0,     label: 'Giao hàng tiêu chuẩn' },
  fast:     { fee: 30000, label: 'Giao hàng nhanh' },
  // Giao trong ngày chỉ làm được ở nơi có kho — xem EXPRESS_CITY bên dưới.
  express:  { fee: 60000, label: 'Giao hỏa tốc', cityOnly: 'TP. Hồ Chí Minh' },
};

export const SHIPPING_CODES = Object.keys(SHIPPING_METHODS);

/** Tỉnh/thành duy nhất giao hỏa tốc được. Trùng với một mục trong VN_CITIES. */
export const EXPRESS_CITY = 'TP. Hồ Chí Minh';

/**
 * Các cách khách hay gõ tên TP. Hồ Chí Minh, đã bỏ dấu và bỏ dấu câu.
 *
 * Khách gõ địa chỉ tự do nên không thể so khớp đúng từng ký tự với chuỗi trong
 * VN_CITIES: "TPHCM", "tp ho chi minh", "Sài Gòn" đều là cùng một nơi.
 */
const HCMC_ALIASES = ['ho chi minh', 'hochiminh', 'tphcm', 'hcm', 'sai gon', 'saigon'];

/**
 * Bỏ dấu, bỏ dấu câu, gộp khoảng trắng — để so tên địa danh cho dễ.
 *
 * Dùng \p{Diacritic} thay cho dải ký tự tổ hợp U+0300–U+036F: viết thẳng dải đó
 * vào mã nguồn thì trong trình soạn thảo nó hiện ra như ô trống, rất dễ bị sửa
 * hỏng mà không ai nhìn ra.
 */
export function normalizePlace(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nơi nhận có được giao hỏa tốc không.
 *
 * Nhận vào tên tỉnh/thành, hoặc cả chuỗi địa chỉ nếu client không gửi riêng
 * trường thành phố (ví dụ gọi API trực tiếp).
 */
export function isExpressAvailable(cityOrAddress) {
  const s = normalizePlace(cityOrAddress);
  return HCMC_ALIASES.some(alias => s.includes(alias));
}

/** Phí của một phương thức. Mã lạ thì tính 0 thay vì ném lỗi — Zod đã chặn ở cửa. */
export function shippingFeeOf(method) {
  return SHIPPING_METHODS[method]?.fee ?? 0;
}

/** Tên tiếng Việt để in lên hóa đơn PDF và hiện ở khu quản trị. */
export function shippingLabelOf(method) {
  return SHIPPING_METHODS[method]?.label ?? method;
}

/**
 * Phương thức thanh toán.
 *
 * Hiện chỉ COD chạy thật. MoMo và VNPay có trong ràng buộc CHECK của CSDL để
 * sau này thêm không phải sửa lược đồ, nhưng KHÔNG được mở ở tầng nhận dữ liệu
 * chừng nào chưa có luồng thanh toán — cho khách chọn rồi không xử lý gì là
 * hứa suông.
 */
export const PAYMENT_METHODS = {
  cod: { label: 'Thanh toán khi nhận hàng (COD)' },
};

export const PAYMENT_CODES = Object.keys(PAYMENT_METHODS);

export function paymentLabelOf(method) {
  return PAYMENT_METHODS[method]?.label ?? method;
}
