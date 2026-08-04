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
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-8">Lịch Sử Đơn Hàng</h1>

      <div>
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
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">Giao đến: {order.shippingAddress} · {order.phone}</p>
                  <Link href={`/dashboard/customer/orders/${order.id}`} className="text-sm font-medium text-accent hover:underline flex-shrink-0 ml-4">
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
