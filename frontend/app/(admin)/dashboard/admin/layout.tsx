'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from '@/auth-client'
import { isBackoffice, canAccessPath, ROLE_LABELS } from '@/lib/permissions'
import { getProducts, getAdminOrders, getUnreadMessageCount } from '@/api'
import {
  LayoutDashboard,
  ShoppingBag,
  FolderKanban,
  Receipt,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Ticket,
  Zap,
  Undo2,
  MessageSquare,
  ShieldCheck,
  Bell,
  Newspaper,
  Mail,
} from 'lucide-react'

import { useUI } from '@/components/context/UIDialogContext'
type Notification = { id: string; text: string; type: 'warning' | 'info'; date: Date }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { confirm } = useUI()
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const role = session?.user.role
  const allowed = isBackoffice(role)

  useEffect(() => {
    if (allowed) {
      Promise.all([getProducts({ limit: 100 }), getAdminOrders()]).then(([prods, ords]) => {
        const list: Notification[] = []
        // Cảnh báo hết hàng
        prods.items.forEach(p => {
          if (p.stock <= 5) {
            list.push({
              id: `stock-${p.id}`,
              text: `Sản phẩm "${p.name}" sắp hết hàng (còn ${p.stock})`,
              type: 'warning',
              date: new Date()
            })
          }
        })
        // Đơn hàng chờ xử lý
        const orderItems = ords.items ?? []
        orderItems.filter(o => o.status === 'pending').forEach(o => {
          list.push({
            id: `order-${o.id}`,
            text: `Đơn hàng #${o.id.slice(0, 8)} đang chờ xử lý`,
            type: 'info',
            date: new Date(o.createdAt)
          })
        })
        setNotifications(list.sort((a, b) => b.date.getTime() - a.date.getTime()))
      }).catch(() => { })

      // Load unread message count
      getUnreadMessageCount().then(d => setUnreadMessages(d.count)).catch(() => { })
    }
  }, [allowed])

  // Poll unread messages every 15s
  useEffect(() => {
    if (!allowed) return
    const interval = setInterval(() => {
      getUnreadMessageCount().then(d => setUnreadMessages(d.count)).catch(() => { })
    }, 15000)
    return () => clearInterval(interval)
  }, [allowed])

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (!allowed) {
      router.push('/dashboard/customer')
      return
    }
    // Nhân viên gõ thẳng URL của mục dành riêng cho admin thì đẩy về tổng quan.
    if (!canAccessPath(role, pathname)) {
      router.replace('/dashboard/admin')
    }
  }, [session, isPending, allowed, role, pathname, router])

  if (isPending || !session || !allowed || !canAccessPath(role, pathname)) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Menu đầy đủ của admin; nhân viên chỉ thấy phần canAccessPath cho qua.
  // Không còn mục "Thống Kê" riêng — báo cáo đã nằm trong Tổng Quan.
  const navItems = [
    { name: 'Tổng Quan', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Sản Phẩm', href: '/dashboard/admin/products', icon: ShoppingBag },
    { name: 'Danh Mục', href: '/dashboard/admin/collections', icon: FolderKanban },
    { name: 'Đơn Hàng', href: '/dashboard/admin/orders', icon: Receipt },
    { name: 'Trả / Đổi Hàng', href: '/dashboard/admin/returns', icon: Undo2 },
    { name: 'Khách Hàng', href: '/dashboard/admin/customers', icon: Users },
    { name: 'Đánh Giá', href: '/dashboard/admin/reviews', icon: MessageSquare },
    { name: 'Tin Nhắn', href: '/dashboard/admin/messages', icon: MessageSquare },
    { name: 'Liên Hệ', href: '/dashboard/admin/contacts', icon: Mail },
    { name: 'Khuyến Mãi', href: '/dashboard/admin/promotions', icon: Ticket },
    { name: 'Flash Sale', href: '/dashboard/admin/flash-sales', icon: Zap },
    { name: 'Tin Tức', href: '/dashboard/admin/news', icon: Newspaper },
    { name: 'Nhân Viên', href: '/dashboard/admin/staffs', icon: ShieldCheck },
    { name: 'Cài Đặt', href: '/dashboard/admin/settings', icon: Settings },
  ].filter((item) => canAccessPath(role, item.href))

  // Nav items that may carry a badge
  const navBadges: Record<string, number> = {
    '/dashboard/admin/messages': unreadMessages,
  }

  const handleLogout = async () => {
    if ((await confirm({ title: 'Bạn chắc chắn muốn đăng xuất?' }))) {
      await signOut()
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#FFFBF7] flex flex-col md:flex-row print:h-auto print:overflow-visible">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-full bg-[#2C2C2C] text-white border-r border-[#E5DFD8] print:hidden">
        <div className="h-16 shrink-0 flex items-center px-6 border-b border-[#3D3D3D]">
          <Link href="/dashboard/admin">
            <img src="/icon.svg" alt="IKA Fashion" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* Danh sách mục cuộn riêng khi màn thấp, để nút Đăng Xuất luôn nằm đáy */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const badge = navBadges[item.href] || 0
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${isActive
                    ? 'bg-[#D4AF37] text-[#2C2C2C]'
                    : 'text-gray-300 hover:bg-[#3D3D3D] hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {badge > 0 && (
                  <span className="bg-red-500 text-white text-[0.625rem] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 shrink-0 border-t border-[#3D3D3D]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded text-sm font-medium text-gray-300 hover:bg-destructive/20 hover:text-destructive-foreground transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden h-16 bg-[#2C2C2C] text-white flex justify-between items-center px-4 border-b border-[#3D3D3D] sticky top-0 z-50 print:hidden">
        <Link href="/dashboard/admin">
          <img src="/icon.svg" alt="IKA Fashion" className="h-9 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-300 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Drawer Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer Menu */}
          <aside className="relative flex flex-col w-64 bg-[#2C2C2C] text-white h-full z-50 shadow-xl max-w-xs animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#3D3D3D]">
              <img src="/icon.svg" alt="IKA Fashion" className="h-10 w-auto object-contain" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const badge = navBadges[item.href] || 0
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${isActive
                        ? 'bg-[#D4AF37] text-[#2C2C2C]'
                        : 'text-gray-300 hover:bg-[#3D3D3D] hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {badge > 0 && (
                      <span className="bg-red-500 text-white text-[0.625rem] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 shrink-0 border-t border-[#3D3D3D]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded text-sm font-medium text-gray-300 hover:bg-destructive/20 hover:text-destructive-foreground transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Đăng Xuất
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      {/* Vùng nội dung — nơi DUY NHẤT cuộn ở desktop */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 md:h-full md:overflow-y-auto print:h-auto print:overflow-visible">
        {/* Top Header - Desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-[#E5DFD8] justify-between items-center px-8 sticky top-0 z-30 print:hidden">
          <div className="flex items-center">
            <span className="text-[#7A7A7A] text-sm mr-2">Xin chào,</span>
            <span className="text-[#2C2C2C] font-semibold text-sm">{session.user.name}</span>
            <span className="ml-2 bg-[#D4AF37]/15 text-[#D4AF37] text-[0.625rem] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
              {ROLE_LABELS[session.user.role] ?? session.user.role}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#7A7A7A] hover:text-[#2C2C2C] hover:bg-[#F9F5F0] rounded-full transition-all relative cursor-pointer"
                title="Thông báo hệ thống"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[0.625rem] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown menu overlay */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5DFD8] rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="bg-[#F9F5F0] px-4 py-3 border-b border-[#E5DFD8] flex justify-between items-center">
                    <span className="font-heading font-semibold text-sm text-[#2C2C2C]">Thông Báo Hệ Thống</span>
                    <span className="text-[0.625rem] bg-[#D4AF37] text-white px-2 py-0.5 rounded font-bold">{notifications.length} mới</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E5DFD8]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">Không có thông báo mới</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-[#F9F5F0]/50 transition-colors">
                          <p className="text-xs text-[#2C2C2C] font-medium leading-relaxed">{n.text}</p>
                          <span className="text-[0.5625rem] text-muted-foreground block mt-1">
                            {new Date(n.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Wrapper — trần lấy từ --admin-max, rộng hơn trang khách vì
            khu quản trị toàn bảng nhiều cột. Màn 1920px trở xuống không chạm
            trần nên vẫn trải hết chỗ trống. */}
        <div className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-[var(--admin-max)] mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
