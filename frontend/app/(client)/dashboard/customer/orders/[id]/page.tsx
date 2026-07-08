'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/auth-client'
import { getMyOrders, Order } from '@/api'
import { ArrowLeft, Package, MapPin, Phone, Clock, RotateCcw } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:   { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', step: 0 },
  confirmed: { label: 'Đã xác nhận',  color: '#1e40af', bg: '#dbeafe', step: 1 },
  shipped:   { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', step: 2 },
  completed: { label: 'Đã giao',      color: '#065f46', bg: '#d1fae5', step: 3 },
  cancelled: { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2', step: -1 },
}

const TIMELINE = [
  { key: 'pending',   label: 'Đặt hàng',     icon: '🛒', sub: 'Đơn hàng đã được tạo' },
  { key: 'confirmed', label: 'Xác nhận',      icon: '✅', sub: 'Shop đã xác nhận đơn' },
  { key: 'shipped',   label: 'Đang giao',     icon: '🚚', sub: 'Đang trên đường giao' },
  { key: 'completed', label: 'Đã nhận hàng',  icon: '🎉', sub: 'Giao hàng thành công' },
]

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return
    if (!session) { router.push('/auth/login'); return }
    getMyOrders()
      .then((orders) => {
        const found = orders.find(o => o.id === params.id)
        setOrder(found ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session, isPending, router, params.id])

  if (isPending || loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5DFD8', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#7A7A7A', fontSize: '14px' }}>Đang tải...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📦</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#2C2C2C', marginBottom: '8px' }}>Không tìm thấy đơn hàng</h1>
          <Link href="/dashboard/customer/orders" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </main>
    )
  }

  const status = STATUS_MAP[order.status] ?? { label: order.status, color: '#2C2C2C', bg: '#F9F5F0', step: 0 }
  const isCancelled = order.status === 'cancelled'

  return (
    <main style={{ minHeight: '100vh', background: '#FFFBF7', paddingBottom: '80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5DFD8', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard/customer/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A7A7A', textDecoration: 'none', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Đơn hàng của tôi
          </Link>
          <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: '#7A7A7A', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mã đơn hàng</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p style={{ fontSize: '13px', color: '#9A9A9A', marginTop: '6px' }}>
            <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #E5DFD8', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, color: '#2C2C2C', marginBottom: '24px' }}>
              Trạng thái đơn hàng
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {TIMELINE.map((t, i) => {
                const done = i <= status.step
                const active = i === status.step
                return (
                  <div key={t.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Connector line */}
                    {i < TIMELINE.length - 1 && (
                      <div style={{
                        position: 'absolute', top: '18px', left: '50%', width: '100%', height: '3px',
                        background: i < status.step ? '#D4AF37' : '#E5DFD8', zIndex: 0, transition: 'background 0.4s',
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', zIndex: 1,
                      background: done ? '#D4AF37' : '#FFFFFF',
                      border: `3px solid ${done ? '#D4AF37' : '#E5DFD8'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', boxShadow: active ? '0 0 0 6px rgba(212,175,55,0.15)' : 'none',
                      transition: 'all 0.4s',
                    }}>
                      {t.icon}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: active ? 700 : done ? 600 : 400, color: done ? '#2C2C2C' : '#9A9A9A', textAlign: 'center' }}>{t.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#9A9A9A', textAlign: 'center' }}>{t.sub}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '28px' }}>❌</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#991b1b' }}>Đơn hàng đã bị hủy</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>Vui lòng liên hệ hỗ trợ nếu bạn có thắc mắc.</p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Products */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #E5DFD8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Package size={18} style={{ color: '#D4AF37' }} />
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
                Sản phẩm đã mua ({order.items.length})
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingBottom: '16px', borderBottom: i < order.items.length - 1 ? '1px solid #F0EBE5' : 'none' }}>
                  <div style={{ width: '64px', height: '64px', background: '#F9F5F0', borderRadius: '8px', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.img ? <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>👕</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#2C2C2C' }}>{item.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7A7A7A' }}>
                      Màu: {item.color} &nbsp;·&nbsp; Size: {item.size} &nbsp;·&nbsp; Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#2C2C2C' }}>{item.lineTotal.toLocaleString('vi-VN')}đ</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9A9A9A' }}>{item.price.toLocaleString('vi-VN')} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reorder CTA */}
            <Link href="/products" style={{
              marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', border: '1.5px solid #2C2C2C', borderRadius: '8px',
              textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#2C2C2C',
            }}>
              <RotateCcw size={15} /> Mua thêm sản phẩm
            </Link>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Order summary */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5DFD8' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 600, color: '#2C2C2C', marginBottom: '16px' }}>Tóm tắt đơn hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A7A7A' }}>
                  <span>Tạm tính</span><span style={{ color: '#2C2C2C' }}>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A7A7A' }}>
                  <span>Vận chuyển</span><span style={{ color: '#22c55e' }}>Miễn phí</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5DFD8', paddingTop: '10px', fontWeight: 700, fontSize: '15px', color: '#2C2C2C' }}>
                  <span>Tổng cộng</span><span style={{ color: '#D4AF37' }}>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5DFD8' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 600, color: '#2C2C2C', marginBottom: '16px' }}>Thông tin giao hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#2C2C2C' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={15} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.6 }}>{order.shippingAddress}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Phone size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
                  <a href={`tel:${order.phone}`} style={{ color: '#2C2C2C', textDecoration: 'none' }}>{order.phone}</a>
                </div>
                {order.notes && (
                  <div style={{ background: '#F9F5F0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#7A7A7A', lineHeight: 1.6 }}>
                    📝 {order.notes}
                  </div>
                )}
              </div>
            </div>

            <Link href="/dashboard/customer/orders" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: '#2C2C2C', color: '#FFFFFF',
              borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            }}>
              <ArrowLeft size={15} /> Tất cả đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
