'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/auth-client'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    products: 12,
    orders: 0,
    customers: 1,
    revenue: 0,
  })

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
      <header className="sticky top-0 bg-card border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Bảng Điều Khiển Admin</h1>
          <Link href="/" className="text-accent hover:underline">
            ← Trang Chủ
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card rounded-lg p-6 shadow">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Sản Phẩm</p>
            <p className="text-4xl font-heading font-semibold text-foreground">{stats.products}</p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Đơn Hàng</p>
            <p className="text-4xl font-heading font-semibold text-foreground">{stats.orders}</p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Khách Hàng</p>
            <p className="text-4xl font-heading font-semibold text-foreground">{stats.customers}</p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Doanh Thu</p>
            <p className="text-3xl font-heading font-semibold text-accent">{stats.revenue.toLocaleString()} đ</p>
          </div>
        </div>

        {/* Navigation */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-6">Quản Lý</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard/admin/products" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-accent">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Sản Phẩm
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Thêm, sửa, xóa sản phẩm</p>
              <span className="text-accent text-sm font-medium">Quản Lý →</span>
            </div>
          </Link>

          <Link href="/dashboard/admin/orders" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-accent">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Đơn Hàng
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Xem và quản lý đơn hàng</p>
              <span className="text-accent text-sm font-medium">Quản Lý →</span>
            </div>
          </Link>

          <Link href="/dashboard/admin/customers" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-accent">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Khách Hàng
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Xem danh sách khách hàng</p>
              <span className="text-accent text-sm font-medium">Quản Lý →</span>
            </div>
          </Link>

          <Link href="/dashboard/admin/analytics" className="group">
            <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-accent">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                Thống Kê
              </h3>
              <p className="text-muted-foreground text-sm mb-4">Xem báo cáo và thống kê</p>
              <span className="text-accent text-sm font-medium">Xem →</span>
            </div>
          </Link>
        </div>

        {/* Recent Products */}
        <div className="bg-card rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-semibold text-foreground">Sản Phẩm Gần Đây</h2>
            <Link href="/dashboard/admin/products" className="text-accent hover:underline text-sm font-medium">
              Xem Tất Cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Tên</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Giá</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Collection</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-secondary transition-colors">
                  <td className="py-3 px-4 text-foreground">Áo Thun Trắng Premium</td>
                  <td className="py-3 px-4 text-foreground">299.000 đ</td>
                  <td className="py-3 px-4 text-muted-foreground">Áo Thun</td>
                  <td className="py-3 px-4">
                    <button className="text-accent hover:underline text-xs font-medium">Sửa</button>
                  </td>
                </tr>
                <tr className="border-b border-border hover:bg-secondary transition-colors">
                  <td className="py-3 px-4 text-foreground">Áo Polo Xanh Navy</td>
                  <td className="py-3 px-4 text-foreground">399.000 đ</td>
                  <td className="py-3 px-4 text-muted-foreground">Áo Polo</td>
                  <td className="py-3 px-4">
                    <button className="text-accent hover:underline text-xs font-medium">Sửa</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
