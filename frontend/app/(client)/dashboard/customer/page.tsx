'use client'

import { useSession } from '@/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getMyOrders, getWishlist, Order } from '@/api'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export default function CustomerDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      getMyOrders().catch(() => [] as Order[]),
      getWishlist().catch(() => []),
    ])
      .then(([myOrders, wishlist]) => {
        setOrders(myOrders)
        setWishlistCount(wishlist.length)
      })
      .finally(() => setLoadingStats(false))
  }, [session])

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Bảng Điều Khiển Khách Hàng</h1>
          <Link href="/" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-card rounded-lg p-6 shadow">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Thông Tin Tài Khoản</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Tên</p>
                <p className="text-foreground font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                <p className="text-foreground font-medium">{session.user.email}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <Link href="/dashboard/customer/profile" className="text-accent hover:underline text-sm font-medium">
                  Chỉnh Sửa Thông Tin
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <Link href="/dashboard/customer/orders" className="bg-secondary rounded-lg p-6 hover:shadow-lg transition-shadow">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Đơn Hàng</p>
              <p className="text-3xl font-heading font-semibold text-foreground">
                {loadingStats ? '—' : orders.length}
              </p>
            </Link>
            <Link href="/wishlist" className="bg-secondary rounded-lg p-6 hover:shadow-lg transition-shadow">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Yêu Thích</p>
              <p className="text-3xl font-heading font-semibold text-foreground">
                {loadingStats ? '—' : wishlistCount}
              </p>
            </Link>
          </div>
        </div>

        {/* Navigation — 4 thẻ nên chia 2 cột ở md, 4 cột ở lg cho khỏi lẻ hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/customer/orders" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Lịch Sử Đơn Hàng
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Xem tất cả đơn hàng của bạn</p>
              <span className="text-accent text-sm font-medium">Xem Chi Tiết →</span>
            </div>
          </Link>

          <Link href="/wishlist" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Danh Sách Yêu Thích
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Các sản phẩm bạn đã lưu</p>
              <span className="text-accent text-sm font-medium">Xem Chi Tiết →</span>
            </div>
          </Link>

          <Link href="/dashboard/customer/messages" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-accent">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Tin Nhắn
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Liên hệ và nhận hỗ trợ từ Admin</p>
              <span className="text-accent text-sm font-medium">Xem Tin Nhắn →</span>
            </div>
          </Link>

          <Link href="/dashboard/customer/settings" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Cài Đặt
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Quản lý thông tin cá nhân</p>
              <span className="text-accent text-sm font-medium">Xem Chi Tiết →</span>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-12 bg-card rounded-lg p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">Hoạt Động Gần Đây</h2>
            {orders.length > 3 && (
              <Link href="/dashboard/customer/orders" className="text-sm text-accent hover:underline">
                Xem tất cả
              </Link>
            )}
          </div>

          {loadingStats ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : orders.length === 0 ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-muted-foreground">Bạn chưa đặt đơn hàng nào</p>
              <Link href="/products" className="text-sm text-accent hover:underline">
                Bắt đầu mua sắm →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 3).map(order => (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/customer/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 py-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        Đơn #{order.id.slice(0, 8).toUpperCase()}
                        <span className="text-muted-foreground font-normal">
                          {' '}· {order.items.length} sản phẩm
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        {' · '}
                        {STATUS_LABEL[order.status] ?? order.status}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      {order.totalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
