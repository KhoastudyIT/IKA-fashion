'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/auth-client'
import { getMyOrders, Order } from '@/api'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export default function CustomerOrdersPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.push('/auth/login')
      return
    }
    getMyOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session, isPending, router])

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Lịch Sử Đơn Hàng</h1>
          <Link href="/dashboard/customer" className="text-accent hover:underline">← Quay Lại</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào</p>
            <Link href="/products" className="inline-block px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity">
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-lg shadow p-6">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Mã đơn</p>
                    <p className="text-foreground font-mono text-sm">{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Ngày đặt</p>
                    <p className="text-foreground text-sm">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-medium">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">Tổng tiền</p>
                    <p className="text-accent font-semibold">{order.totalPrice.toLocaleString()} đ</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">{it.name} <span className="text-muted-foreground">({it.color}/{it.size}) × {it.quantity}</span></span>
                      <span className="text-muted-foreground">{it.lineTotal.toLocaleString()} đ</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">Giao đến: {order.shippingAddress} · {order.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
