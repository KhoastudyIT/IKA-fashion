'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, signOut } from '@/auth-client'
import {
  LayoutDashboard, Receipt, Heart, MessageSquare, User, Settings, FileText, LogOut, Menu, X,
} from 'lucide-react'

const NAV_ITEMS = [
  { name: 'Tổng Quan', href: '/dashboard/customer', icon: LayoutDashboard },
  { name: 'Đơn Hàng', href: '/dashboard/customer/orders', icon: Receipt },
  { name: 'Yêu Thích', href: '/wishlist', icon: Heart },
  { name: 'Tin Nhắn', href: '/dashboard/customer/messages', icon: MessageSquare },
  { name: 'Chính Sách', href: '/dashboard/customer/chinh-sach', icon: FileText },
  { name: 'Hồ Sơ', href: '/dashboard/customer/profile', icon: User },
  { name: 'Cài Đặt', href: '/dashboard/customer/settings', icon: Settings },
]

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isPending && !session) router.push('/auth/login')
  }, [session, isPending, router])

  const handleLogout = async () => {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
      await signOut()
      router.push('/')
    }
  }

  if (isPending || !session) return null

  const sidebar = (
    <>
      <div className="px-4 py-5 border-b border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tài khoản</p>
        <p className="font-heading font-semibold text-foreground truncate">{session.user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Đăng Xuất
        </button>
      </div>
    </>
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Thanh mở menu cho màn hẹp — sidebar bị ẩn ở đó */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden flex items-center gap-2 mb-6 px-4 py-2.5 rounded border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Menu className="w-4 h-4" />
          Menu tài khoản
        </button>

        <div className="flex gap-8">
          <aside className="hidden md:flex flex-col w-60 shrink-0 bg-card border border-border rounded-lg overflow-hidden self-start sticky top-28">
            {sidebar}
          </aside>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="w-72 bg-card flex flex-col shadow-xl">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </main>
  )
}
