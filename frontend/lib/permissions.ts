'use client'

// =============================================================
// Phân quyền khu quản trị (bản sao phía giao diện).
//
//   admin — toàn quyền.
//   staff — nhân viên: CHỈ XEM sản phẩm, danh mục, khách hàng, khuyến mãi;
//           QUẢN LÝ được đơn hàng, tin nhắn và liên hệ.
//
// Đây chỉ là lớp che giao diện cho gọn mắt. Quyền thật do backend giữ:
// router admin đã gắn authorize('admin','staff') + readOnly('staff') và trả
// 403 cho mọi thao tác ghi của nhân viên.
// =============================================================

import { useSession } from '@/auth-client'

export type Role = 'customer' | 'staff' | 'admin'

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  customer: 'Khách hàng',
}

/** Tài khoản được vào /dashboard/admin. */
export function isBackoffice(role?: string) {
  return role === 'admin' || role === 'staff'
}

/**
 * Các mục nhân viên KHÔNG được mở. Dùng chung cho việc lọc menu và chặn khi
 * người dùng gõ thẳng URL, nên chỉ khai báo một chỗ này.
 */
export const ADMIN_ONLY_PATHS = [
  '/dashboard/admin/reviews',
  '/dashboard/admin/news',
  '/dashboard/admin/staffs',
  '/dashboard/admin/analytics',
  '/dashboard/admin/settings',
]

export function canAccessPath(role: string | undefined, pathname: string) {
  if (role === 'admin') return true
  if (role !== 'staff') return false
  return !ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * `canWrite` = được thêm/sửa/xóa ở các mục chỉ-xem của nhân viên
 * (sản phẩm, danh mục, khách hàng, khuyến mãi).
 */
export function useAdminRole() {
  const { data: session, isPending } = useSession()
  const role = session?.user.role
  return {
    role,
    isPending,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    canWrite: role === 'admin',
  }
}
