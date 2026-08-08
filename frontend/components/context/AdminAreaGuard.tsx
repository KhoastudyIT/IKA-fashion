'use client'

// =============================================================
// Tài khoản admin chỉ làm việc trong /dashboard/admin.
//
// Mọi trang thuộc nhóm (client) — trang chủ, sản phẩm, giỏ hàng, tin nhắn của
// khách — đều nằm sau lớp này, nên admin mở bất kỳ đường dẫn nào trong đó cũng
// bị đẩy về dashboard quản trị.
//
// Đây chỉ là lớp chặn giao diện. Việc cấm admin đặt hàng / nhắn tin thật sự do
// backend giữ: các router khách đã gắn authorize('customer') và trả 403.
// =============================================================

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/auth-client'

export default function AdminAreaGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = useSession()

  const isAdmin = !isPending && session?.user.role === 'admin'

  useEffect(() => {
    if (isAdmin) router.replace('/dashboard/admin')
  }, [isAdmin, pathname, router])

  // Chặn render luôn thay vì chỉ điều hướng: nếu vẫn vẽ children thì trong lúc
  // chờ chuyển trang, các trang khách vẫn kịp gọi API giỏ hàng / wishlist và
  // nhận về một loạt lỗi 403.
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="text-foreground font-heading text-lg mb-1">Tài khoản quản trị</p>
          <p className="text-muted-foreground text-sm">Đang chuyển về trang quản trị...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
