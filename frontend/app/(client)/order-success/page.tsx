'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { CheckCircle, Package, MapPin, ArrowRight, RotateCcw } from 'lucide-react'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') ?? ''
  const total = Number(searchParams.get('total') ?? 0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{
        maxWidth: '560px', width: '100%', textAlign: 'center',
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.5s, transform 0.5s',
      }}>
        {/* Animated checkmark */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '96px', height: '96px', background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(212,175,55,0.35)',
            animation: 'pulse-gold 2s ease-in-out infinite',
          }}>
            <CheckCircle size={48} color="#1a1a1a" strokeWidth={2} />
          </div>
        </div>

        <p style={{ fontSize: '12px', letterSpacing: '4px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
          Thành công
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, color: '#2C2C2C', marginBottom: '12px', lineHeight: 1.2 }}>
          Đặt hàng thành công!
        </h1>
        <p style={{ fontSize: '16px', color: '#7A7A7A', marginBottom: '32px', lineHeight: 1.7 }}>
          Cảm ơn bạn đã tin tưởng IKA Fashion. Đơn hàng của bạn đang được xử lý và sẽ được giao sớm nhất có thể.
        </p>

        {/* Order info card */}
        <div style={{
          background: '#FFFFFF', borderRadius: '16px', padding: '28px',
          border: '1px solid #E5DFD8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          marginBottom: '28px', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F0EBE5' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Mã đơn hàng</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#2C2C2C', fontFamily: 'monospace', margin: 0 }}>
                #{orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Tổng tiền</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#D4AF37', margin: 0 }}>
                {total.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '✅', label: 'Đặt hàng thành công', sub: 'Ngay bây giờ', done: true },
              { icon: '📋', label: 'Xác nhận đơn hàng', sub: 'Trong vòng 30 phút', done: false },
              { icon: '📦', label: 'Đóng gói & chuẩn bị', sub: '1–2 giờ', done: false },
              { icon: '🚚', label: 'Giao hàng', sub: '1–3 ngày làm việc', done: false },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: t.done ? 'rgba(212,175,55,0.15)' : '#F9F5F0',
                  border: t.done ? '2px solid #D4AF37' : '2px solid #E5DFD8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>{t.icon}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: t.done ? 600 : 400, fontSize: '14px', color: t.done ? '#2C2C2C' : '#7A7A7A' }}>{t.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9A9A9A' }}>{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: '#F9F5F0', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Package size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#2C2C2C' }}>Email xác nhận</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#7A7A7A', lineHeight: 1.5 }}>Đã gửi đến email của bạn</p>
            </div>
          </div>
          <div style={{ background: '#F9F5F0', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <MapPin size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#2C2C2C' }}>Theo dõi đơn</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#7A7A7A', lineHeight: 1.5 }}>Dashboard của bạn</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard/customer/orders" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '13px 28px', background: '#2C2C2C', color: '#FFFFFF',
            borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          }}>
            <Package size={16} /> Xem đơn hàng
          </Link>
          <Link href="/products" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '13px 28px', border: '1.5px solid #2C2C2C', color: '#2C2C2C',
            borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          }}>
            <RotateCcw size={16} /> Tiếp tục mua sắm
          </Link>
        </div>

        <p style={{ marginTop: '24px', fontSize: '13px', color: '#9A9A9A' }}>
          Câu hỏi? Liên hệ <a href="mailto:hello@ikafashion.com" style={{ color: '#D4AF37' }}>hello@ikafashion.com</a>
        </p>
      </div>

      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 8px 32px rgba(212,175,55,0.35); }
          50% { box-shadow: 0 8px 48px rgba(212,175,55,0.6); }
        }
      `}</style>
    </main>
  )
}

export default function OrderSuccessPage() {
  return (
    <>
      <Suspense fallback={
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#7A7A7A' }}>Đang tải...</p>
        </main>
      }>
        <OrderSuccessContent />
      </Suspense>
    </>
  )
}
