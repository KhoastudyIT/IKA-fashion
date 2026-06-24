'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, Heart, Search } from 'lucide-react'
import { useState } from 'react'
import { useSession, signOut } from '@/auth-client'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const dashboardHref = session?.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer'

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="text-2xl font-heading font-semibold tracking-widest text-foreground">
              IKA
            </div>
          </Link>

          {/* Center Menu */}
          <div className="hidden md:flex items-center gap-8">
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
            {session ? (
              <>
                <Link
                  href={dashboardHref}
                  className="hidden sm:inline-block px-4 py-2 text-accent font-medium text-sm hover:underline"
                >
                  {session.user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-block px-4 py-2 bg-foreground text-primary-foreground font-medium rounded text-sm hover:opacity-90 transition-opacity"
                >
                  Đăng Xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-block px-4 py-2 text-accent font-medium text-sm hover:underline"
                >
                  Đăng Nhập
                </Link>
                <Link
                  href="/auth/signup"
                  className="hidden sm:inline-block px-4 py-2 bg-foreground text-primary-foreground font-medium rounded text-sm hover:opacity-90 transition-opacity"
                >
                  Đăng Ký
                </Link>
              </>
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
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
  )
}
