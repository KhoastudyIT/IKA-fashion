'use client'

import Link from 'next/link'
import { useSession } from '@/auth-client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAnalyticsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

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
      <header className="sticky top-0 bg-card border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Thống Kê & Báo Cáo</h1>
          <Link href="/dashboard/admin" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Doanh Thu Tháng Này</p>
            <p className="text-3xl font-heading font-semibold text-accent">0 đ</p>
            <p className="text-xs text-muted-foreground mt-2">+0% so với tháng trước</p>
          </div>

          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Số Đơn Hàng</p>
            <p className="text-3xl font-heading font-semibold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-2">Tháng này</p>
          </div>

          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Khách Hàng Mới</p>
            <p className="text-3xl font-heading font-semibold text-foreground">1</p>
            <p className="text-xs text-muted-foreground mt-2">Tháng này</p>
          </div>

          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tỷ Lệ Chuyển Đổi</p>
            <p className="text-3xl font-heading font-semibold text-foreground">0%</p>
            <p className="text-xs text-muted-foreground mt-2">Trung bình</p>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Doanh Thu Theo Ngày</h2>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Biểu đồ sẽ hiển thị tại đây</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Sản Phẩm Bán Chạy</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Áo Thun Trắng</span>
                <span className="text-muted-foreground">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Áo Polo Xanh Navy</span>
                <span className="text-muted-foreground">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Quần Đen Slim Fit</span>
                <span className="text-muted-foreground">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Khách Hàng Hàng Đầu</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Tên</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Đơn Hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Chi Tiêu</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center py-8 text-muted-foreground">
                  <td colSpan={4}>Chưa có dữ liệu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
