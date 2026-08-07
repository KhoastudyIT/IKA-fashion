import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { ShopProvider } from '@/components/context/ShopContext'

// Trang 404 nằm ngoài nhóm (client) nên phải tự bọc ShopProvider cho Navigation
export default function NotFound() {
  return (
    <ShopProvider>
      <Navigation />
      <main style={{ minHeight: '80vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          {/* Giant 404 */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(100px, 20vw, 180px)',
              fontWeight: 700,
              color: '#F0EBE5',
              lineHeight: 1,
              margin: 0,
              userSelect: 'none',
            }}>404</p>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '48px',
            }}>🔍</div>
          </div>

          <p style={{ fontSize: '12px', letterSpacing: '4px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>
            Trang không tìm thấy
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: '#2C2C2C', marginBottom: '12px' }}>
            Oops! Trang này không tồn tại
          </h1>
          <p style={{ fontSize: '15px', color: '#7A7A7A', lineHeight: 1.7, marginBottom: '36px' }}>
            Trang bạn đang tìm có thể đã được di chuyển, đổi tên hoặc không còn tồn tại. Hãy thử tìm kiếm hoặc quay lại trang chủ.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            <Link href="/" style={{
              padding: '13px 28px', background: '#2C2C2C', color: '#FFFFFF',
              borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            }}>
              ← Về trang chủ
            </Link>
            <Link href="/products" style={{
              padding: '13px 28px', border: '1.5px solid #2C2C2C', color: '#2C2C2C',
              borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            }}>
              Xem sản phẩm
            </Link>
          </div>

          {/* Quick links */}
          <div style={{ borderTop: '1px solid #E5DFD8', paddingTop: '28px' }}>
            <p style={{ fontSize: '13px', color: '#9A9A9A', marginBottom: '16px' }}>Có thể bạn đang tìm:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: '👕 Sản phẩm', href: '/products' },
                { label: '🔥 Ưu đãi', href: '/khuyen-mai' },
                { label: '📞 Liên hệ', href: '/contact' },
                { label: '🛒 Giỏ hàng', href: '/dashboard/customer/cart' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{
                  padding: '8px 16px', background: '#F9F5F0', borderRadius: '20px',
                  textDecoration: 'none', fontSize: '13px', color: '#2C2C2C',
                }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </ShopProvider>
  )
}
