'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import { useSettings } from '@/components/context/SettingsContext'

// ─── SVG Social Icons ─────────────────────────────────────────────────────────
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.17a8.16 8.16 0 0 0 4.78 1.52V7.25a4.85 4.85 0 0 1-1.01-.56z" />
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
)

// ─── Data ─────────────────────────────────────────────────────────────────────
const navLinks = [
  { label: 'Sản Phẩm', href: '/products' },
  { label: 'Ưu Đãi - Giảm Giá', href: '/khuyen-mai' },
  { label: 'Về Chúng Tôi', href: '/about' },
  { label: 'Liên Hệ', href: '/contact' },
  { label: 'Tạp Chí Thời Trang', href: '/tin-tuc' },
]

const supportLinks = [
  { label: 'Chính Sách Đổi Trả', href: '/chinh-sach-doi-tra' },
  { label: 'Chính Sách Giao Hàng', href: '/chinh-sach-giao-hang' },
  { label: 'Câu Hỏi Thường Gặp', href: '/faq' },
  { label: 'Hướng Dẫn Chọn Size', href: '/huong-dan-size' },
  { label: 'Chính Sách Bảo Mật', href: '/chinh-sach-bao-mat' },
  { label: 'Điều Khoản Sử Dụng', href: '/dieu-khoan' },
]

// Link mạng xã hội lấy từ Cài Đặt Hệ Thống; mục nào admin bỏ trống thì ẩn luôn
const buildSocialLinks = (s: {
  tiktokUrl: string; facebookUrl: string; instagramUrl: string; youtubeUrl: string
}) => [
  { label: 'TikTok', href: s.tiktokUrl, icon: <TikTokIcon />, color: '#010101' },
  { label: 'YouTube', href: s.youtubeUrl, icon: <YouTubeIcon />, color: '#FF0000' },
  { label: 'Facebook', href: s.facebookUrl, icon: <FacebookIcon />, color: '#1877F2' },
  { label: 'Instagram', href: s.instagramUrl, icon: <InstagramIcon />, color: '#E1306C' },
].filter((link) => link.href)

// ─── Component ────────────────────────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null)

  // Trước đây đọc localStorage nên chỉ máy admin thấy được cấu hình đã sửa;
  // giờ lấy từ API qua SettingsProvider nên khách vào web cũng thấy đúng.
  const { settings: storeSettings } = useSettings()
  const socialLinks = buildSocialLinks(storeSettings)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer className="print:hidden" style={{
      background: 'linear-gradient(180deg, #1C1C1C 0%, #141414 100%)',
      color: '#E8E2DA',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Top Strip: USP bar ──────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { icon: '🚚', title: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 500.000đ' },
            { icon: '🔄', title: 'Đổi trả dễ dàng', sub: 'Trong vòng 7 ngày' },
            { icon: '🛡️', title: 'Bảo hành chất lượng', sub: 'Cam kết chính hãng 100%' },
            { icon: '📞', title: 'Hỗ trợ 24/7', sub: `Hotline: ${storeSettings.hotline}` },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8125rem', color: '#FFFFFF' }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#9A9A9A' }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Footer ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '64px 24px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px' }}>

          <div>
            {/* Dấu hiệu vuông icon.svg — ruột hình thoi #2C2C2C sáng hơn nền footer
                một chút, cộng khung vàng nên vẫn tách khỏi nền tối. */}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <img
                src={storeSettings.logo || '/icon.svg'}
                alt={storeSettings.storeName}
                style={{ height: '56px', width: 'auto', maxWidth: '220px', objectFit: 'contain', marginBottom: '16px', display: 'inline-block' }}
              />
            </Link>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.8, color: '#9A9A9A', marginBottom: '20px', maxWidth: '240px' }}>
              Thương hiệu thời trang Việt Nam với cam kết chất lượng cao, công nghệ vải tiên tiến và phong cách hiện đại.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#9A9A9A' }}>{storeSettings.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
                <a href={`tel:${storeSettings.hotline}`} style={{ fontSize: '0.75rem', color: '#9A9A9A', textDecoration: 'none' }}>{storeSettings.hotline}</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
                <a href={`mailto:${storeSettings.email}`} style={{ fontSize: '0.75rem', color: '#9A9A9A', textDecoration: 'none' }}>{storeSettings.email}</a>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.6875rem', letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>Theo dõi chúng tôi</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHoveredSocial(social.label)}
                    onMouseLeave={() => setHoveredSocial(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '8px',
                      border: `1px solid ${hoveredSocial === social.label ? social.color : 'rgba(255,255,255,0.1)'}`,
                      background: hoveredSocial === social.label ? social.color : 'rgba(255,255,255,0.05)',
                      color: hoveredSocial === social.label ? '#fff' : '#9A9A9A',
                      textDecoration: 'none', transition: 'all 0.25s',
                      transform: hoveredSocial === social.label ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
              Điều Hướng
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {navLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </nav>

            <div style={{ marginTop: '32px' }}>
              <h4 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>Giờ Hoạt Động</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { day: 'Thứ 2 – Thứ 6', time: '9:00 – 18:00' },
                  { day: 'Thứ 7', time: '10:00 – 16:00' },
                  { day: 'Chủ Nhật', time: 'Đóng cửa' },
                ].map((h) => (
                  <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9A9A9A' }}>
                    <span>{h.day}</span>
                    <span style={{ color: h.time === 'Đóng cửa' ? '#666' : '#D4AF37' }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
              Hỗ Trợ Khách Hàng
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {supportLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </nav>

            <div style={{ marginTop: '32px' }}>
              <h4 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>
                Phương Thức Thanh Toán
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {[
                  { id: 'cod', alt: 'Thanh toán COD', src: '/payments/cod.png' },
                  { id: 'vnpay', alt: 'Thanh toán VNPay', src: '/payments/vnpay.png' },
                  { id: 'momo', alt: 'Thanh toán MoMo', src: '/payments/momo.png' },
                  { id: 'zalopay', alt: 'Thanh toán ZaloPay', src: '/payments/zalopay.png' },
                  { id: 'visa', alt: 'Thanh toán Visa', src: '/payments/visa.png' },
                  { id: 'mastercard', alt: 'Thanh toán Mastercard', src: '/payments/Mastercard.png' },
                ].map((pm) => (
                  <PaymentBadge key={pm.id} src={pm.src} alt={pm.alt} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
              Nhận Tin Ưu Đãi
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#9A9A9A', lineHeight: 1.7, marginBottom: '20px' }}>
              Đăng ký để nhận thông báo về bộ sưu tập mới, ưu đãi độc quyền và tips phối đồ mỗi tuần.
            </p>

            {subscribed ? (
              <div style={{ padding: '14px 16px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '8px', fontSize: '0.8125rem', color: '#D4AF37', textAlign: 'center' }}>
                ✓ Đăng ký thành công! Cảm ơn bạn.
              </div>
            ) : (
              <form onSubmit={handleSubscribe}>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    required
                    style={{ width: '100%', padding: '12px 48px 12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.target.style.borderColor = '#D4AF37')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                  <button type="submit" aria-label="Đăng ký" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', background: '#D4AF37', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1a1a1a' }}>
                    <ArrowRight size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#666', lineHeight: 1.5 }}>
                  Bằng cách đăng ký, bạn đồng ý với <Link href="/chinh-sach-bao-mat" style={{ color: '#D4AF37', textDecoration: 'none' }}>Chính sách bảo mật</Link> của chúng tôi.
                </p>
              </form>
            )}

            <div style={{ marginTop: '28px' }}>
              <h4 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>
                Tải App IKA
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <AppBadge src="/payments/app-store.png" alt="Tải trên App Store" />
                <AppBadge src="/payments/google-play.png" alt="Tải trên Google Play" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>© {new Date().getFullYear()} {storeSettings.storeName}. Tất cả quyền được bảo lưu.</p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'Bảo Mật', href: '/chinh-sach-bao-mat' },
              { label: 'Điều Khoản', href: '/dieu-khoan' },
              { label: 'Đổi Trả', href: '/chinh-sach-doi-tra' },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'none' }}>{link.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#444', margin: 0 }}>🇻🇳 Thương hiệu thuần Việt — Made with ❤️ in Vietnam</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Helper: Footer link với hover effect ─────────────────────────────────────
function FooterLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem',
        color: hovered ? '#D4AF37' : '#9A9A9A', textDecoration: 'none', transition: 'color 0.2s',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: hovered ? '#D4AF37' : '#444', flexShrink: 0, transition: 'background 0.2s' }} />
      {label}
    </Link>
  )
}

// ─── Payment & App Badges ─────────────────────────────────────────────────────
function PaymentBadge({ src, alt }: { src: string; alt: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={alt}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '64px',
        height: '36px',
        transition: 'transform 0.3s ease',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none'
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: '6px',
          filter: hovered ? 'none' : 'grayscale(100%) opacity(60%)',
          transition: 'all 0.3s ease'
        }}
      />
    </div>
  )
}

// Ứng dụng di động chưa phát hành nên badge chỉ là ảnh tĩnh. Để nguyên thẻ <a
// href="#" target="_blank"> như trước thì bấm vào là mở ra một tab trắng.
function AppBadge({ src, alt }: { src: string; alt: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      title="Ứng dụng di động sắp ra mắt"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        transition: 'transform 0.3s ease',
        transform: hovered ? 'translateY(-2px)' : 'none'
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height: '40px',
          width: 'auto',
          objectFit: 'contain',
          borderRadius: '6px',
          filter: hovered ? 'none' : 'grayscale(100%) opacity(50%)',
          transition: 'all 0.3s ease'
        }}
      />
    </div>
  )
}