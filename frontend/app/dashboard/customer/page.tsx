'use client'

import { useSession } from '@/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CustomerDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Bảng Điều Khiển Khách Hàng</h1>
          <Link href="/" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-card rounded-lg p-6 shadow">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Thông Tin Tài Khoản</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Tên</p>
                <p className="text-foreground font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                <p className="text-foreground font-medium">{session.user.email}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <Link href="/dashboard/customer/profile" className="text-accent hover:underline text-sm font-medium">
                  Chỉnh Sửa Thông Tin
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-lg p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Đơn Hàng</p>
              <p className="text-3xl font-heading font-semibold text-foreground">0</p>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Yêu Thích</p>
              <p className="text-3xl font-heading font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/customer/orders" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Lịch Sử Đơn Hàng
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Xem tất cả đơn hàng của bạn</p>
              <span className="text-accent text-sm font-medium">Xem Chi Tiết →</span>
            </div>
          </Link>

          <Link href="/dashboard/customer/wishlist" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Danh Sách Yêu Thích
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Các sản phẩm bạn đã lưu</p>
              <span className="text-accent text-sm font-medium">Xem Chi Tiết →</span>
            </div>
          </Link>

          <Link href="/dashboard/customer/settings" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Cài Đặt
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Quản lý thông tin cá nhân</p>
              <span className="text-accent text-sm font-medium">Xem Chi Tiết →</span>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-12 bg-card rounded-lg p-6 shadow">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Hoạt Động Gần Đây</h2>
          <p className="text-muted-foreground">Chưa có hoạt động nào</p>
        </div>
      </div>
    </main>
  )
}
