'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// href trỏ đến /products/[handle] — handle khớp với sản phẩm giảm giá trong DB backend
const initialProducts = [
  { id: 1,  name: 'Áo Polo Bo Sọc Form Regular PO136 Màu Trắng',      oldPrice: 450000, newPrice: 270000, discount: 40, rating: 4.8, soldCount: 312, tag: 'Bestseller', emoji: '👕', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-1.jpg',       href: '/products/sale-polo-1' },
  { id: 2,  name: 'Áo Thun Lạnh Thể Thao Thoáng Mát Navy BS3234-Đen', oldPrice: 650000, newPrice: 429000, discount: 34, rating: 4.9, soldCount: 189, tag: 'Hot Deal',   emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-2.jpg',       href: '/products/sale-polo-2' },
  { id: 3,  name: 'Áo Polo Màu Trơn Nam Ngắn Tay',                    oldPrice: 590000, newPrice: 354000, discount: 40, rating: 4.7, soldCount: 254, tag: 'Flash Sale', emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-3.jpg',       href: '/products/sale-polo-3' },
  { id: 4,  name: 'Áo Polo Nam Màu Xanh Lá - North Sails',            oldPrice: 280000, newPrice: 168000, discount: 40, rating: 4.6, soldCount: 421, tag: 'Phổ biến',  emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-4.webp',     href: '/products/sale-polo-4' },
  { id: 5,  name: 'Quần Trouser Trắng Trơn',                          oldPrice: 520000, newPrice: 312000, discount: 40, rating: 4.8, soldCount: 312, tag: 'Bestseller', emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-1.jpg', href: '/products/sale-quan-1' },
  { id: 6,  name: 'Quần Âu Be Trơn',                                  oldPrice: 480000, newPrice: 288000, discount: 40, rating: 4.7, soldCount: 205, tag: 'Flash Sale', emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-2.jpg', href: '/products/sale-quan-2' },
  { id: 7,  name: 'Quần Tây Nam Thanh Lịch Tôn Dáng Form Slim',       oldPrice: 550000, newPrice: 330000, discount: 40, rating: 4.6, soldCount: 178, tag: 'Hot Deal',   emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-3.webp', href: '/products/sale-quan-3' },
  { id: 8,  name: 'Quần Dài Công Sở Thẳng Nam Cao Cấp',              oldPrice: 620000, newPrice: 372000, discount: 40, rating: 4.9, soldCount: 143, tag: 'Mới giảm',  emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-4.webp', href: '/products/sale-quan-4' },
]

const extraProducts = [
  { id: 9,  name: 'Áo Polo Nam Regular Fit Màu Trắng',                oldPrice: 780000, newPrice: 499000, discount: 36, rating: 4.8, soldCount: 143, tag: 'Mới giảm',  emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-5.webp',     href: '/products/sale-polo-5' },
  { id: 10, name: 'Áo Polo Saint Laurent',                            oldPrice: 390000, newPrice: 234000, discount: 40, rating: 4.5, soldCount: 367, tag: 'Flash Sale', emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-6.webp',     href: '/products/sale-polo-6' },
  { id: 11, name: 'Áo Polo Ralph Lauren',                             oldPrice: 520000, newPrice: 312000, discount: 40, rating: 4.9, soldCount: 98,  tag: 'Combo',      emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-7.webp',     href: '/products/sale-polo-7' },
  { id: 12, name: 'Áo Polo Unisex Cổ Bẻ Tay Ngắn',                  oldPrice: 870000, newPrice: 609000, discount: 30, rating: 4.7, soldCount: 211, tag: 'Mới về',     emoji: '👔', type: 'Áo Polo', image: '/Giam-Gia/Ao/Ao-Polo/Polo-8.webp',     href: '/products/sale-polo-8' },
  { id: 13, name: 'Áo Thun Trắng Premium Classic',                   oldPrice: 450000, newPrice: 270000, discount: 40, rating: 4.8, soldCount: 312, tag: 'Bestseller', emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-1.jpg',      href: '/products/sale-thun-1' },
  { id: 14, name: 'Áo Thun Kẻ Sọc Premium',                          oldPrice: 520000, newPrice: 364000, discount: 30, rating: 4.9, soldCount: 189, tag: 'Hot Deal',   emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-2.jpg',      href: '/products/sale-thun-2' },
  { id: 15, name: 'Áo Thun Nam Slim Fit Xanh Navy',                  oldPrice: 590000, newPrice: 354000, discount: 40, rating: 4.7, soldCount: 254, tag: 'Flash Sale', emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-3.jpg',      href: '/products/sale-thun-3' },
  { id: 16, name: 'Áo Thun Xám EasyCare',                            oldPrice: 480000, newPrice: 288000, discount: 40, rating: 4.6, soldCount: 421, tag: 'Phổ biến',  emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-4.jpg',      href: '/products/sale-thun-4' },
  { id: 17, name: 'Áo Thun Nam AirLight Trắng',                      oldPrice: 550000, newPrice: 330000, discount: 40, rating: 4.8, soldCount: 143, tag: 'Mới giảm',  emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-5.jpg',      href: '/products/sale-thun-5' },
  { id: 18, name: 'Áo Thun Đen Dài Tay FormFit',                     oldPrice: 620000, newPrice: 372000, discount: 40, rating: 4.5, soldCount: 367, tag: 'Flash Sale', emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-6.jpg',      href: '/products/sale-thun-6' },
  { id: 19, name: 'Áo Thun Classic Fit Màu Đen - Calvin Klein',      oldPrice: 780000, newPrice: 468000, discount: 40, rating: 4.9, soldCount: 98,  tag: 'Combo',      emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-7.webp',     href: '/products/sale-thun-7' },
  { id: 20, name: 'Áo Thun Unisex Basic',                            oldPrice: 420000, newPrice: 294000, discount: 30, rating: 4.7, soldCount: 211, tag: 'Mới về',     emoji: '👕', type: 'Áo Thun', image: '/Giam-Gia/Ao/Ao-SoMi/SoMi-8.jpg',      href: '/products/sale-thun-8' },
  { id: 21, name: 'Quần Jean Xanh Ôm Dáng Kiểu Anh',                oldPrice: 680000, newPrice: 408000, discount: 40, rating: 4.8, soldCount: 312, tag: 'Bestseller', emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-5.jpg', href: '/products/sale-quan-5' },
  { id: 22, name: 'Quần Tây Nam Xám Trơn Công Sở',                  oldPrice: 590000, newPrice: 354000, discount: 40, rating: 4.6, soldCount: 189, tag: 'Hot Deal',   emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-6.jpg', href: '/products/sale-quan-6' },
  { id: 23, name: 'Quần Kaki Nam Casual',                            oldPrice: 750000, newPrice: 450000, discount: 40, rating: 4.9, soldCount: 254, tag: 'Flash Sale', emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-7.webp', href: '/products/sale-quan-7' },
  { id: 24, name: 'Quần Âu Đen Trơn Slim Fit',                      oldPrice: 640000, newPrice: 384000, discount: 40, rating: 4.7, soldCount: 421, tag: 'Phổ biến',  emoji: '👖', type: 'Quần',    image: '/Giam-Gia/Quan/Quan-Tay/QuanTay-8.webp', href: '/products/sale-quan-8' },
]


const saleProducts = [...initialProducts, ...extraProducts]
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const tick = () => {
      const diff = Math.max(0, end.getTime() - Date.now())
      setTimeLeft({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return timeLeft
}

export default function KhuyenMaiPage() {
  const { h, m, s } = useCountdown()
  const pad = (n: number) => String(n).padStart(2, '0')
  const [showAll, setShowAll] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleShowAll = () => {
    if (!showAll) {
      setAnimating(true)
      setShowAll(true)
    } else {
      setShowAll(false)
      setAnimating(false)
    }
  }
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
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2C2C2C 50%, #1a1a1a 100%)',
          padding: '80px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
            <p style={{ color: '#D4AF37', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
              ⚡ Chương Trình Đặc Biệt
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '16px' }}>
              Ưu Đãi &amp; Giảm Giá
            </h1>
            <p style={{ color: '#aaa', fontSize: '17px', marginBottom: '36px', lineHeight: 1.7 }}>
              Giảm đến <span style={{ color: '#D4AF37', fontWeight: 700 }}>40%</span> toàn bộ sản phẩm IKA Fashion — Chỉ trong hôm nay!
            </p>
            {/* Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
              <span style={{ color: '#D4AF37', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' }}>Kết thúc sau</span>
              {[pad(h), pad(m), pad(s)].map((val, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#D4AF37', color: '#1a1a1a', fontWeight: 800, fontSize: '28px', borderRadius: '8px', padding: '8px 14px', fontFamily: 'monospace', minWidth: '56px', textAlign: 'center', display: 'inline-block' }}>{val}</span>
                  {i < 2 && <span style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 800 }}>:</span>}
                </span>
              ))}
            </div>
            <a href="#sale-products" style={{ display: 'inline-block', padding: '14px 40px', background: '#D4AF37', color: '#1a1a1a', fontWeight: 700, borderRadius: '4px', textDecoration: 'none', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Khám Phá Ngay
            </a>
          </div>
        </section>

        {/* Stats Bar */}
        <section style={{ background: '#F9F5F0', borderBottom: '1px solid #E5DFD8', padding: '28px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🏷️', label: 'Sản phẩm giảm giá', value: '200+' },
              { icon: '⚡', label: 'Giảm tối đa', value: '40%' },
              { icon: '🛍️', label: 'Đơn hàng hôm nay', value: '1.248' },
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
        <section id="sale-products" style={{ padding: '72px 24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '12px', letterSpacing: '4px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Flash Sale</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: '#2C2C2C', marginBottom: '16px' }}>Sản Phẩm Đang Giảm Giá</h2>
            <p style={{ color: '#7A7A7A', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              Tất cả sản phẩm IKA đều được áp dụng công nghệ vải tiên tiến — Chất lượng đảm bảo, giá ưu đãi!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
            {initialProducts.map((product) => (
              <SaleCard key={product.id} product={product} />
            ))}
            {showAll && extraProducts.map((product, i) => (
              <div
                key={product.id}
                className="extra-card"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <SaleCard product={product} />
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '56px' }}>
            <button
              onClick={handleShowAll}
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
                <><span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Xem Thêm {extraProducts.length} Sản Phẩm</>
              )}
            </button>
          </div>
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

function SaleCard({ product }: { product: typeof saleProducts[0] }) {
  const [hovered, setHovered] = useState(false)
  const tagColorMap: Record<string, { bg: string; color: string }> = {
    'Bestseller': { bg: '#d1fae5', color: '#065f46' },
    'Hot Deal': { bg: '#fee2e2', color: '#991b1b' },
    'Flash Sale': { bg: '#ffedd5', color: '#9a3412' },
    'Phổ biến': { bg: '#dbeafe', color: '#1e40af' },
    'Mới giảm': { bg: '#ede9fe', color: '#5b21b6' },
    'Combo': { bg: '#fce7f3', color: '#9d174d' },
    'Mới về': { bg: '#ccfbf1', color: '#0f766e' },
  }
  const tc = tagColorMap[product.tag] ?? { bg: '#f3f4f6', color: '#374151' }

  // Truyền dữ liệu sale qua query params để trang chi tiết hiển thị giá khuyến mãi
  const saleHref = product.href
    + '?oldPrice=' + encodeURIComponent(product.oldPrice)
    + '&newPrice=' + encodeURIComponent(product.newPrice)
    + '&discount=' + encodeURIComponent(product.discount)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #E5DFD8',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s, transform 0.3s',
        boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
    >
      {/* Image area — click anywhere on image → detail page */}
      <Link href={saleHref} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ position: 'relative', background: '#F9F5F0', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s',
                transform: hovered ? 'scale(1.07)' : 'scale(1)',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ fontSize: '80px', transition: 'transform 0.4s', transform: hovered ? 'scale(1.12)' : 'scale(1)', display: 'block' }}>{product.emoji}</span>
          )}

          {/* Discount badge */}
          <div style={{ position: 'absolute', top: '14px', left: '14px', background: '#D4AF37', color: '#1a1a1a', fontWeight: 800, fontSize: '13px', padding: '4px 10px', borderRadius: '20px' }}>
            -{product.discount}%
          </div>

          {/* Tag */}
          <span style={{ position: 'absolute', top: '14px', right: '14px', background: tc.bg, color: tc.color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>
            {product.tag}
          </span>

          {/* Hover overlay CTA */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: hovered ? 'auto' : 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: '#D4AF37', color: '#1a1a1a', fontWeight: 700, borderRadius: '4px', fontSize: '13px', letterSpacing: '1px' }}>
              🛍️ Xem Chi Tiết
            </span>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px' }}>
        <p style={{ fontSize: '11px', color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{product.type}</p>

        {/* Product name — click → detail page */}
        <Link href={saleHref} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '15px',
            fontWeight: 600,
            color: hovered ? '#D4AF37' : '#2C2C2C',
            lineHeight: 1.4,
            marginBottom: '12px',
            minHeight: '42px',
            transition: 'color 0.2s',
            cursor: 'pointer',
          }}>{product.name}</h3>
        </Link>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '13px' }}>{product.oldPrice.toLocaleString('vi-VN')}₫</span>
          <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '17px' }}>{product.newPrice.toLocaleString('vi-VN')}₫</span>
        </div>

        {/* Rating + sold */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ color: '#D4AF37', fontSize: '13px', fontWeight: 600 }}>★ {product.rating}</span>
          <span style={{ color: '#7A7A7A', fontSize: '12px' }}>Đã bán {product.soldCount}</span>
        </div>

        {/* Detail button — "Xem Chi Tiết" */}
        <Link
          href={saleHref}
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '10px',
            border: '1.5px solid #2C2C2C',
            color: '#2C2C2C',
            fontWeight: 600,
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '12px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            transition: 'background 0.2s, color 0.2s',
            background: hovered ? '#2C2C2C' : 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2C2C2C'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2C2C2C' }}
        >
          Xem Chi Tiết
        </Link>
      </div>
    </div>
  )
}
