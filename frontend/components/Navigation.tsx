'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, Heart, Search, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from '@/auth-client'

const ANNOUNCEMENTS = [
  '🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
  '🔥 Flash Sale — Giảm đến 40% toàn bộ sản phẩm hôm nay!',
  '📦 Đổi trả miễn phí trong 7 ngày — Cam kết chính hãng 100%',
  '📞 Hotline hỗ trợ: 0123 456 789 · Thứ 2–6: 9AM–6PM',
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [announcementVisible, setAnnouncementVisible] = useState(true)
  const [announcementIndex, setAnnouncementIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setAnnouncementIndex(i => (i + 1) % ANNOUNCEMENTS.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const isActive = (path: string) => pathname === path

  const dashboardHref = session?.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer'

  return (
    <div className="sticky top-0 z-50">
      {/* Announcement Bar */}
      {announcementVisible && (
        <div style={{
          background: 'linear-gradient(90deg, #1a1a1a 0%, #2C2C2C 50%, #1a1a1a 100%)',
          color: '#FFFFFF',
          padding: '9px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <p style={{
            fontSize: '12px',
            letterSpacing: '0.5px',
            margin: 0,
            color: '#F5E6A3',
            fontFamily: 'Inter, sans-serif',
            transition: 'opacity 0.4s',
            textAlign: 'center',
          }}>
            {ANNOUNCEMENTS[announcementIndex]}
          </p>
          <button
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Đóng thông báo"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#9A9A9A',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <header className="bg-background border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="text-2xl font-heading font-semibold tracking-widest text-foreground">
              IKA
            </div>
          </Link>

          {/* Center Menu — gap hẹp lại ở md để 5 mục không tràn ra khỏi thanh */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className={`font-sans text-sm tracking-wide transition-colors ${
                isActive('/') ? 'text-accent' : 'text-foreground hover:text-accent'
              }`}
            >
              TRANG CHỦ
            </Link>
            <Link
              href="/products"
              className={`font-sans text-sm tracking-wide transition-colors ${
                isActive('/products') ? 'text-accent' : 'text-foreground hover:text-accent'
              }`}
            >
              SẢN PHẨM
            </Link>
            <Link
              href="/about"
              className={`font-sans text-sm tracking-wide transition-colors ${
                isActive('/about') ? 'text-accent' : 'text-foreground hover:text-accent'
              }`}
            >
              VỀ CHÚNG TÔI
            </Link>
            <Link
              href="/contact"
              className={`font-sans text-sm tracking-wide transition-colors ${
                isActive('/contact') ? 'text-accent' : 'text-foreground hover:text-accent'
              }`}
            >
              LIÊN HỆ
            </Link>
            <Link
              href="/blog"
              className={`font-sans text-sm tracking-wide transition-colors ${
                isActive('/blog') ? 'text-accent' : 'text-foreground hover:text-accent'
              }`}
            >
              TIN TỨC
            </Link>
            <Link
              href="/khuyen-mai"
              className={`font-sans text-sm tracking-wide transition-all relative group flex items-center gap-1 ${
                isActive('/khuyen-mai')
                  ? 'text-accent font-semibold'
                  : 'text-foreground hover:text-accent'
              }`}
            >
              <span className="relative">
                ƯU ĐÃI - GIẢM GIÁ
                <span className="absolute -top-2 -right-5 text-xs leading-none">🔥</span>
              </span>
              <span
                className={`absolute -bottom-1 left-0 h-px bg-accent transition-all duration-300 ${
                  isActive('/khuyen-mai') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-foreground hover:text-accent transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <Link
              href="/wishlist"
              className={`transition-colors ${isActive('/wishlist') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
              aria-label="Wishlist"
            >
              <Heart size={20} />
            </Link>
            <Link
              href="/cart"
              className={`transition-colors ${isActive('/cart') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={20} />
            </Link>
            {/* Đăng xuất nằm trong khu tài khoản, không để ở header nữa */}
            {session ? (
              <Link
                href={dashboardHref}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-accent font-medium text-sm hover:underline"
              >
                <User size={18} />
                {session.user.name}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-block px-4 py-2 bg-foreground text-primary-foreground font-medium rounded text-sm hover:opacity-90 transition-opacity"
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="pb-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                  setIsSearchOpen(false)
                  setSearchQuery('')
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-2 bg-secondary text-foreground placeholder-muted-foreground border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-foreground text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Tìm
              </button>
            </form>
          </div>
        )}
      </nav>
    </header>
    </div>
  )
}
