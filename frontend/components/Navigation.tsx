'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, Heart, Search, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from '@/auth-client'
import { useShop } from '@/components/context/ShopContext'
import { useSettings } from '@/components/context/SettingsContext'
import { isBackoffice } from '@/lib/permissions'

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

// Dòng hotline lấy từ cấu hình cửa hàng nên phải dựng lại mỗi khi settings đổi.
const buildAnnouncements = (hotline: string, workingHours: string) => [
  '🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
  '🔥 Flash Sale — Giảm đến 40% toàn bộ sản phẩm hôm nay!',
  '📦 Đổi trả miễn phí trong 7 ngày — Cam kết chính hãng 100%',
  `📞 Hotline hỗ trợ: ${hotline}${workingHours ? ` · ${workingHours}` : ''}`,
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { cartCount, wishlistCount } = useShop()
  const { settings } = useSettings()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [announcementVisible, setAnnouncementVisible] = useState(true)
  const [announcementIndex, setAnnouncementIndex] = useState(0)

  const announcements = buildAnnouncements(settings.hotline, settings.workingHours)

  useEffect(() => {
    const id = setInterval(() => {
      setAnnouncementIndex(i => (i + 1) % announcements.length)
    }, 4000)
    return () => clearInterval(id)
  }, [announcements.length])

  const isActive = (path: string) => pathname === path

  const dashboardHref = isBackoffice(session?.user.role) ? '/dashboard/admin' : '/dashboard/customer'

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
            {announcements[announcementIndex]}
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
          <div className="flex items-center h-20 gap-4 lg:gap-8">
            <Link href="/" className="flex-shrink-0">
              <img
                src={settings.logo || '/icon.svg'}
                alt={settings.storeName}
                className="h-12 w-auto max-h-12 max-w-[200px] object-contain object-left"
              />
            </Link>

            {/* Menu — gap hẹp lại ở md để 6 mục không tràn ra khỏi thanh */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                href="/"
                className={`font-sans text-sm tracking-wide transition-colors ${isActive('/') ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
              >
                TRANG CHỦ
              </Link>
              <Link
                href="/products"
                className={`font-sans text-sm tracking-wide transition-colors ${isActive('/products') ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
              >
                SẢN PHẨM
              </Link>
              <Link
                href="/about"
                className={`font-sans text-sm tracking-wide transition-colors ${isActive('/about') ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
              >
                VỀ CHÚNG TÔI
              </Link>
              <Link
                href="/contact"
                className={`font-sans text-sm tracking-wide transition-colors ${isActive('/contact') ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
              >
                LIÊN HỆ
              </Link>
              <Link
                href="/tin-tuc"
                className={`font-sans text-sm tracking-wide transition-colors ${isActive('/tin-tuc') ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
              >
                TIN TỨC
              </Link>
              <Link
                href="/khuyen-mai"
                className={`font-sans text-sm tracking-wide transition-all relative group flex items-center gap-1 ${isActive('/khuyen-mai')
                    ? 'text-accent font-semibold'
                    : 'text-foreground hover:text-accent'
                  }`}
              >
                <span className="relative">
                  ƯU ĐÃI - GIẢM GIÁ
                  <span className="absolute -top-2 -right-5 text-xs leading-none">🔥</span>
                </span>
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-accent transition-all duration-300 ${isActive('/khuyen-mai') ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                />
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 ml-auto flex-shrink-0">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-foreground hover:text-accent transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
              <Link
                href="/dashboard/customer/wishlist"
                className={`transition-colors relative ${isActive('/dashboard/customer/wishlist') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
                aria-label={`Yêu thích, ${wishlistCount} sản phẩm`}
              >
                <Heart size={20} />
                <CountBadge count={wishlistCount} />
              </Link>
              <Link
                href="/dashboard/customer/cart"
                className={`transition-colors relative ${isActive('/dashboard/customer/cart') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              >
                <ShoppingBag size={20} />
                <CountBadge count={cartCount} />
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
