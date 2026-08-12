// =============================================================
// Vai trò người dùng
//
//   customer — khách mua hàng.
//   staff    — nhân viên: CHỈ XEM sản phẩm, danh mục, khách hàng, khuyến mãi;
//              được QUẢN LÝ đơn hàng, tin nhắn và liên hệ.
//   admin    — toàn quyền.
//
// Quyền chỉ-xem của staff do middleware `readOnly('staff')` giữ (chặn mọi
// method khác GET), nên router chỉ cần liệt kê role được vào.
// =============================================================

export const ROLES = ['customer', 'staff', 'admin'];

/** Các vai trò làm việc trong khu quản trị. */
export const BACKOFFICE_ROLES = ['admin', 'staff'];

export function isBackoffice(role) {
  return BACKOFFICE_ROLES.includes(role);
}
