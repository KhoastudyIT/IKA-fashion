'use client'

import { useSession } from '@/auth-client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getMyOrders, getWishlist, Order } from '@/api'
import { Receipt, Heart, Wallet } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default function CustomerDashboard() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
      .finally(() => setLoading(false))
  }, [session])

  // Đơn đã huỷ không phải tiền đã tiêu, không tính vào tổng chi tiêu.
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const stats = [
    { label: 'Đơn hàng', value: orders.length, icon: Receipt, href: '/dashboard/customer/orders' },
    { label: 'Yêu thích', value: wishlistCount, icon: Heart, href: '/wishlist' },
    {
      label: 'Tổng chi tiêu',
      value: `${totalSpent.toLocaleString('vi-VN')} đ`,
      icon: Wallet,
      href: '/dashboard/customer/orders',
    },
  ]

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">
          Chào {session?.user.name}
        </h1>
        <p className="text-muted-foreground mt-1">Tổng quan tài khoản của bạn tại IKA Fashion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-card border border-border rounded-lg p-5 hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-accent" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-heading font-semibold text-foreground">
                {loading ? '—' : stat.value}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-semibold text-foreground">Đơn hàng gần đây</h2>
          {orders.length > 5 && (
            <Link href="/dashboard/customer/orders" className="text-sm text-accent hover:underline">
              Xem tất cả
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Đang tải...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Bạn chưa đặt đơn hàng nào</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2.5 bg-foreground text-primary-foreground font-medium rounded text-sm hover:opacity-90 transition-opacity"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orders.slice(0, 5).map(order => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/customer/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      Đơn #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')} · {order.items.length} sản phẩm
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[11px] font-medium px-2 py-1 rounded border ${
                        STATUS_STYLE[order.status] ?? 'bg-secondary text-muted-foreground border-border'
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {order.totalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
