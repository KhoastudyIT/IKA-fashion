'use client'

// =============================================================
// Trang Ưu Đãi — lấy thẳng các chương trình Flash Sale đang chạy từ API.
//
// Trước đây trang này render một mảng sản phẩm viết cứng trong file nên hiện
// hàng giảm giá kể cả khi admin chưa tạo chương trình nào. Giờ chưa có chương
// trình thì trang báo rõ là chưa có.
// =============================================================

import { useState, useEffect, useMemo } from 'react'
import ProductCard from '@/components/ProductCard'
import { getActiveFlashSales, FlashSale } from '@/api'

const PAGE_SIZE = 8

/** Đếm ngược tới mốc `target`. Không có mốc thì không hiện đồng hồ. */
function useCountdown(target: number | null) {
  const [left, setLeft] = useState<{ h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    if (target == null) {
      setLeft(null)
      return
    }
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return left
}

export default function KhuyenMaiPage() {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getActiveFlashSales()
      .then(setSales)
      .catch((err) => setError(err.message || 'Không tải được chương trình ưu đãi'))
      .finally(() => setLoading(false))
  }, [])

  // Đồng hồ chạy theo chương trình sắp hết hạn nhất; chương trình không đặt
  // hạn kết thúc thì bỏ qua.
  const soonestEnd = useMemo(() => {
    const ends = sales
      .map((fs) => (fs.endsAt ? new Date(fs.endsAt).getTime() : null))
      .filter((t): t is number => t != null && t > Date.now())
    return ends.length ? Math.min(...ends) : null
  }, [sales])

  const timeLeft = useCountdown(soonestEnd)
  const pad = (n: number) => String(n).padStart(2, '0')

  const maxDiscount = sales.reduce((m, fs) => Math.max(m, fs.discountPercent), 0)
  const totalRemaining = sales.reduce((s, fs) => s + fs.remaining, 0)

  // ProductCard nhận dữ liệu sản phẩm, nên dựng lại từ dòng flash sale.
  const cards = sales.map((fs) => ({
    id: fs.productId,
    name: fs.name,
    handle: fs.handle,
    img: fs.img,
    price: fs.productPrice,     // giá niêm yết → hiện gạch ngang
    effectivePrice: fs.price,   // giá flash    → giá hiển thị chính
    originalPrice: fs.productPrice,
    discount: fs.discountPercent,
    isFlashSale: true,
    flashRemaining: fs.remaining,
    sold: fs.sold,
  }))

  const visible = showAll ? cards : cards.slice(0, PAGE_SIZE)
  const hiddenCount = Math.max(0, cards.length - PAGE_SIZE)

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .extra-card {
          animation: fadeSlideUp 0.5s ease both;
        }
      `}</style>
      <main style={{ background: 'var(--background)', minHeight: '100vh' }}>

        {/* Hero Banner */}
        <section style={{
          position: 'relative',
          padding: '80px 24px',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          <img
            src="/banners/banner-arrivals.jpeg"
            alt="Ưu đãi IKA Fashion"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
            <p style={{ color: '#D4AF37', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
              ⚡ Chương Trình Đặc Biệt
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '16px' }}>
              Ưu Đãi &amp; Giảm Giá
            </h1>
            <p style={{ color: '#aaa', fontSize: '17px', marginBottom: '36px', lineHeight: 1.7 }}>
              {maxDiscount > 0 ? (
                <>Giảm đến <span style={{ color: '#D4AF37', fontWeight: 700 }}>{maxDiscount}%</span> — số suất có hạn!</>
              ) : (
                <>Theo dõi để không bỏ lỡ đợt Flash Sale tiếp theo của IKA Fashion.</>
              )}
            </p>

            {/* Countdown — chỉ hiện khi có chương trình đặt hạn kết thúc */}
            {timeLeft && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <span style={{ color: '#D4AF37', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' }}>Kết thúc sau</span>
                {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#D4AF37', color: '#1a1a1a', fontWeight: 800, fontSize: '28px', borderRadius: '8px', padding: '8px 14px', fontFamily: 'monospace', minWidth: '56px', textAlign: 'center', display: 'inline-block' }}>{val}</span>
                    {i < 2 && <span style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 800 }}>:</span>}
                  </span>
                ))}
              </div>
            )}

            {cards.length > 0 && (
              <a href="#sale-products" style={{ display: 'inline-block', padding: '14px 40px', background: '#D4AF37', color: '#1a1a1a', fontWeight: 700, borderRadius: '4px', textDecoration: 'none', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Khám Phá Ngay
              </a>
            )}
          </div>
        </section>

        {/* Stats Bar — số liệu lấy từ chính các chương trình đang chạy */}
        <section style={{ background: '#F9F5F0', borderBottom: '1px solid #E5DFD8', padding: '28px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🏷️', label: 'Sản phẩm đang giảm', value: String(cards.length) },
              { icon: '⚡', label: 'Giảm tối đa', value: maxDiscount > 0 ? `${maxDiscount}%` : '—' },
              { icon: '🛍️', label: 'Suất ưu đãi còn lại', value: String(totalRemaining) },
              { icon: '🚚', label: 'Miễn phí vận chuyển', value: 'Đơn từ 500K' },
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{stat.icon}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '20px', color: '#D4AF37', margin: 0, fontFamily: "'Playfair Display', serif" }}>{stat.value}</p>
                  <p style={{ fontSize: '12px', color: '#7A7A7A', margin: 0 }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products Grid */}
        <section id="sale-products" style={{ padding: '72px 24px', maxWidth: '1280px', margin: '0 auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', color: '#b91c1c', fontSize: '14px', borderRadius: '4px', marginBottom: '32px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', color: '#7A7A7A', padding: '48px 0' }}>Đang tải chương trình ưu đãi...</p>
          ) : cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: '#F9F5F0', border: '1px solid #E5DFD8', borderRadius: '8px' }}>
              <p style={{ fontSize: '40px', margin: 0 }}>🕗</p>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#2C2C2C', margin: '12px 0 8px' }}>
                Hiện chưa có chương trình ưu đãi nào
              </h3>
              <p style={{ color: '#7A7A7A', fontSize: '14px', margin: 0 }}>
                Các đợt Flash Sale sẽ xuất hiện tại đây ngay khi bắt đầu. Ghé lại sau nhé!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {visible.map((product, i) => (
                  <div
                    key={product.id}
                    className={i >= PAGE_SIZE ? 'extra-card' : undefined}
                    style={i >= PAGE_SIZE ? { animationDelay: `${(i - PAGE_SIZE) * 80}ms` } : undefined}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {hiddenCount > 0 && (
                <div style={{ textAlign: 'center', marginTop: '56px' }}>
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 40px',
                      border: '1.5px solid #2C2C2C',
                      color: '#2C2C2C',
                      fontWeight: 600,
                      borderRadius: '4px',
                      background: 'transparent',
                      fontSize: '13px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2C2C2C'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#2C2C2C' }}
                  >
                    {showAll ? (
                      <><span style={{ fontSize: '16px', lineHeight: 1 }}>↑</span> Thu Gọn</>
                    ) : (
                      <><span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Xem Thêm {hiddenCount} Sản Phẩm</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Bottom Banner */}
        <section style={{ background: 'linear-gradient(135deg, #2C2C2C 0%, #1a1a1a 100%)', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 40px)', color: '#fff', marginBottom: '12px' }}>Đừng bỏ lỡ cơ hội này!</h2>
            <p style={{ color: '#aaa', marginBottom: '32px', lineHeight: 1.7 }}>
              Đăng ký nhận thông báo để không bỏ lỡ các đợt sale tiếp theo của IKA.
            </p>
            <form style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }} onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn..." required
                style={{ flex: '1', minWidth: '220px', padding: '12px 18px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '12px 28px', background: '#D4AF37', color: '#1a1a1a', fontWeight: 700, borderRadius: '4px', border: 'none', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Đăng Ký Ngay
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
