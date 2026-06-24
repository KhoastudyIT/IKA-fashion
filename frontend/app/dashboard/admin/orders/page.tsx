'use client'

import Link from 'next/link'
import { useSession } from '@/auth-client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminOrdersPage() {
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
          <h1 className="text-2xl font-heading font-semibold text-foreground">Quản Lý Đơn Hàng</h1>
          <Link href="/dashboard/admin" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tổng Đơn Hàng</p>
            <p className="text-3xl font-heading font-semibold text-foreground">0</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Đơn Chờ Xử Lý</p>
            <p className="text-3xl font-heading font-semibold text-foreground">0</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Đơn Hoàn Thành</p>
            <p className="text-3xl font-heading font-semibold text-foreground">0</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tổng Doanh Thu</p>
            <p className="text-3xl font-heading font-semibold text-accent">0 đ</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Mã Đơn</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Khách Hàng</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Ngày</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Trạng Thái</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Tổng Tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center py-12 text-muted-foreground">
                  <td colSpan={5}>Chưa có đơn hàng nào</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
