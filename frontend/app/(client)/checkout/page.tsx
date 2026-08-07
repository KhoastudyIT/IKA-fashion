'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/auth-client'
import { getCart, createOrder, applyCoupon, Cart, AppliedCoupon } from '@/api'
import { useShop } from '@/components/context/ShopContext'
import { Check, ChevronRight, MapPin, Phone, CreditCard, Package, Truck } from 'lucide-react'

type Step = 1 | 2 | 3

const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Giao hàng tiêu chuẩn', sub: '3–5 ngày làm việc', price: 0, icon: '📦' },
  { id: 'fast', label: 'Giao hàng nhanh', sub: '1–2 ngày làm việc', price: 30000, icon: '⚡' },
  { id: 'express', label: 'Giao hỏa tốc', sub: 'Trong ngày (nội thành)', price: 60000, icon: '🚀' },
]

const PAYMENT_OPTIONS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '/payments/cod.png' },
  { id: 'momo', label: 'Ví MoMo', icon: '/payments/momo.png' },
  { id: 'vnpay', label: 'VNPay / Chuyển khoản', icon: '/payments/vnpay.png' },
]

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: 'Thông tin' },
    { n: 2 as Step, label: 'Vận chuyển' },
    { n: 3 as Step, label: 'Thanh toán' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '40px' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: current >= s.n ? '#D4AF37' : '#E5DFD8',
              color: current >= s.n ? '#1a1a1a' : '#7A7A7A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '14px',
              transition: 'all 0.3s',
            }}>
              {current > s.n ? <Check size={16} /> : s.n}
            </div>
            <span style={{ fontSize: '11px', color: current >= s.n ? '#D4AF37' : '#7A7A7A', fontWeight: current === s.n ? 600 : 400, whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: '2px', background: current > s.n ? '#D4AF37' : '#E5DFD8', margin: '0 8px', marginTop: '-20px', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { refreshCounts } = useShop()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [shipping, setShipping] = useState('standard')
  const [payment, setPayment] = useState('cod')

  // Mã giảm giá
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    if (isPending) return
    if (!session) { router.push('/auth/login'); return }
    getCart()
      .then((c) => {
        if (!c || c.items.length === 0) { router.push('/dashboard/customer/cart'); return }
        setCart(c)
        if (session.user.name) setName(session.user.name)
      })
      .catch(() => router.push('/dashboard/customer/cart'))
      .finally(() => setLoading(false))
  }, [session, isPending, router])

  if (isPending || loading) {
    return (
      <>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #E5DFD8', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#7A7A7A', fontSize: '14px' }}>Đang tải...</p>
          </div>
        </main>
      </>
    )
  }

  const shippingFee = SHIPPING_OPTIONS.find(s => s.id === shipping)?.price ?? 0
  const subtotal = cart?.subtotal ?? 0
  const discount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, subtotal + shippingFee - discount)

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setApplyingCoupon(true)
    setCouponError('')
    try {
      const result = await applyCoupon(code, subtotal)
      setAppliedCoupon(result)
    } catch (e: any) {
      setAppliedCoupon(null)
      setCouponError(e.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  const handlePlaceOrder = async () => {
    if (!cart) return
    setPlacing(true)
    setError('')
    try {
      const order = await createOrder({
        shippingAddress: `${address}, ${city}`,
        phone,
        notes: `Vận chuyển: ${shipping} | Thanh toán: ${payment}${notes ? ' | Ghi chú: ' + notes : ''}`,
        couponCode: appliedCoupon?.code,
      })
      // Đặt hàng xong backend đã dọn giỏ — đồng bộ lại badge
      await refreshCounts()
      router.push(`/order-success?orderId=${order.id}&total=${total}`)
    } catch (e: any) {
      setError(e.message || 'Đặt hàng thất bại, vui lòng thử lại')
      setPlacing(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E5DFD8',
    borderRadius: '8px', fontSize: '14px', color: '#2C2C2C',
    background: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: '#2C2C2C', marginBottom: '6px',
  }

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <main style={{ minHeight: '100vh', background: '#FFFBF7', paddingBottom: '80px' }}>
        {/* Header */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5DFD8', padding: '16px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#7A7A7A' }}>
            <Link href="/" style={{ color: '#D4AF37', textDecoration: 'none' }}>Trang chủ</Link>
            <ChevronRight size={14} />
            <Link href="/dashboard/customer/cart" style={{ color: '#D4AF37', textDecoration: 'none' }}>Giỏ hàng</Link>
            <ChevronRight size={14} />
            <span style={{ color: '#2C2C2C', fontWeight: 600 }}>Thanh toán</span>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 700, color: '#2C2C2C', marginBottom: '32px' }}>
            Thanh Toán
          </h1>

          <StepIndicator current={step} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            {/* ── Left: Form ──────────────────────────────────────── */}
            <div>

              {/* STEP 1: Thông tin */}
              {step === 1 && (
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E5DFD8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <MapPin size={20} style={{ color: '#D4AF37' }} />
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
                      Thông tin giao hàng
                    </h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Họ và tên *</label>
                      <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A"
                        onFocus={e => e.target.style.borderColor = '#D4AF37'}
                        onBlur={e => e.target.style.borderColor = '#E5DFD8'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Số điện thoại *</label>
                      <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0912 345 678" type="tel"
                        onFocus={e => e.target.style.borderColor = '#D4AF37'}
                        onBlur={e => e.target.style.borderColor = '#E5DFD8'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Tỉnh / Thành phố *</label>
                      <select style={{ ...inputStyle, cursor: 'pointer' }} value={city} onChange={e => setCity(e.target.value)}
                        onFocus={e => e.target.style.borderColor = '#D4AF37'}
                        onBlur={e => e.target.style.borderColor = '#E5DFD8'}>
                        <option value="">Chọn tỉnh/thành</option>
                        {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Hưng Yên', 'Thái Nguyên', 'Nghệ An'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Địa chỉ *</label>
                      <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                        onFocus={e => e.target.style.borderColor = '#D4AF37'}
                        onBlur={e => e.target.style.borderColor = '#E5DFD8'} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Ghi chú đơn hàng <span style={{ fontWeight: 400, color: '#7A7A7A' }}>(không bắt buộc)</span></label>
                      <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                        onFocus={e => e.target.style.borderColor = '#D4AF37'}
                        onBlur={e => e.target.style.borderColor = '#E5DFD8'} />
                    </div>
                  </div>

                  <button
                    onClick={() => { if (name && phone && address && city) setStep(2) }}
                    disabled={!name || !phone || !address || !city}
                    style={{ marginTop: '24px', width: '100%', padding: '14px', background: '#2C2C2C', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px', opacity: (!name || !phone || !address || !city) ? 0.5 : 1 }}
                  >
                    Tiếp Theo: Chọn Vận Chuyển →
                  </button>
                </div>
              )}

              {/* STEP 2: Vận chuyển */}
              {step === 2 && (
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E5DFD8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <Truck size={20} style={{ color: '#D4AF37' }} />
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
                      Phương thức vận chuyển
                    </h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                    {SHIPPING_OPTIONS.map(opt => (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '16px 20px', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${shipping === opt.id ? '#D4AF37' : '#E5DFD8'}`,
                        background: shipping === opt.id ? 'rgba(212,175,55,0.05)' : '#FAFAFA',
                        transition: 'all 0.2s',
                      }}>
                        <input type="radio" name="shipping" value={opt.id} checked={shipping === opt.id} onChange={() => setShipping(opt.id)} style={{ accentColor: '#D4AF37', width: '18px', height: '18px' }} />
                        <span style={{ fontSize: '22px' }}>{opt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#2C2C2C' }}>{opt.label}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#7A7A7A' }}>{opt.sub}</p>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: opt.price === 0 ? '#22c55e' : '#2C2C2C' }}>
                          {opt.price === 0 ? 'Miễn phí' : opt.price.toLocaleString('vi-VN') + 'đ'}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', background: 'transparent', color: '#2C2C2C', border: '1.5px solid #2C2C2C', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      ← Quay lại
                    </button>
                    <button onClick={() => setStep(3)} style={{ flex: 2, padding: '13px', background: '#2C2C2C', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px' }}>
                      Tiếp Theo: Thanh Toán →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Thanh toán */}
              {step === 3 && (
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E5DFD8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <CreditCard size={20} style={{ color: '#D4AF37' }} />
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
                      Phương thức thanh toán
                    </h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                    {PAYMENT_OPTIONS.map(opt => (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '16px 20px', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${payment === opt.id ? '#D4AF37' : '#E5DFD8'}`,
                        background: payment === opt.id ? 'rgba(212,175,55,0.05)' : '#FAFAFA',
                        transition: 'all 0.2s',
                      }}>
                        <input type="radio" name="payment" value={opt.id} checked={payment === opt.id} onChange={() => setPayment(opt.id)} style={{ accentColor: '#D4AF37', width: '18px', height: '18px' }} />
                        <img src={opt.icon} alt={opt.label} style={{ width: '44px', height: '28px', objectFit: 'contain', borderRadius: '4px' }} />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#2C2C2C' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Review info */}
                  <div style={{ background: '#F9F5F0', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '13px', lineHeight: 1.8, color: '#2C2C2C' }}>
                    <p><strong>👤</strong> {name} &nbsp;|&nbsp; <strong>📞</strong> {phone}</p>
                    <p><strong>📍</strong> {address}, {city}</p>
                    <p><strong>🚚</strong> {SHIPPING_OPTIONS.find(s => s.id === shipping)?.label}</p>
                    <p><strong>💳</strong> {PAYMENT_OPTIONS.find(p => p.id === payment)?.label}</p>
                  </div>

                  {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', background: 'transparent', color: '#2C2C2C', border: '1.5px solid #2C2C2C', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      ← Quay lại
                    </button>
                    <button onClick={handlePlaceOrder} disabled={placing} style={{ flex: 2, padding: '13px', background: '#D4AF37', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: placing ? 0.7 : 1, letterSpacing: '0.5px' }}>
                      {placing ? 'Đang xử lý...' : `✓ Đặt Hàng — ${total.toLocaleString('vi-VN')}đ`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Order Summary ─────────────────────────────── */}
            <div style={{ position: 'sticky', top: '96px' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #E5DFD8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Package size={18} style={{ color: '#D4AF37' }} />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
                    Đơn hàng của bạn ({cart?.totalItems} sản phẩm)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                  {cart?.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '52px', height: '52px', background: '#F9F5F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {item.img ? <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px' }}>👕</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#2C2C2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#7A7A7A' }}>{item.color} / {item.size} × {item.quantity}</p>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#2C2C2C', flexShrink: 0 }}>{item.lineTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>

                {/* Mã giảm giá */}
                <div style={{ borderTop: '1px solid #E5DFD8', paddingTop: '16px', marginBottom: '4px' }}>
                  {appliedCoupon ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Đã áp mã <strong style={{ fontFamily: 'monospace' }}>{appliedCoupon.code}</strong>
                      </span>
                      <button onClick={handleRemoveCoupon} style={{ background: 'transparent', border: 'none', color: '#7A7A7A', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Bỏ</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon() } }}
                          placeholder="Nhập mã giảm giá"
                          style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5DFD8', borderRadius: '8px', fontSize: '13px', color: '#2C2C2C', background: '#FFFFFF', outline: 'none', textTransform: 'uppercase', fontFamily: 'monospace' }}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon || !couponInput.trim()}
                          style={{ padding: '10px 16px', background: '#2C2C2C', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: (applyingCoupon || !couponInput.trim()) ? 0.5 : 1 }}
                        >
                          {applyingCoupon ? '...' : 'Áp dụng'}
                        </button>
                      </div>
                      {couponError && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>{couponError}</p>}
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #E5DFD8', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#7A7A7A' }}>
                    <span>Tạm tính</span><span style={{ color: '#2C2C2C' }}>{subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a' }}>
                      <span>Giảm giá ({appliedCoupon?.code})</span><span>−{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#7A7A7A' }}>
                    <span>Phí vận chuyển</span>
                    <span style={{ color: shippingFee === 0 ? '#22c55e' : '#2C2C2C' }}>
                      {shippingFee === 0 ? 'Miễn phí' : shippingFee.toLocaleString('vi-VN') + 'đ'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#2C2C2C', borderTop: '1px solid #E5DFD8', paddingTop: '12px' }}>
                    <span>Tổng cộng</span>
                    <span style={{ color: '#D4AF37' }}>{total.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#F9F5F0', borderRadius: '8px', fontSize: '12px', color: '#7A7A7A', lineHeight: 1.6 }}>
                  🔒 Thông tin của bạn được mã hóa và bảo mật tuyệt đối.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}