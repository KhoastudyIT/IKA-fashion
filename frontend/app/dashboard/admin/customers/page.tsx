'use client'

import Link from 'next/link'
import { useSession } from '@/auth-client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCustomersPage() {
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
          <h1 className="text-2xl font-heading font-semibold text-foreground">Quản Lý Khách Hàng</h1>
          <Link href="/dashboard/admin" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tổng Khách Hàng</p>
            <p className="text-3xl font-heading font-semibold text-foreground">1</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Khách Hàng Mới (30 ngày)</p>
            <p className="text-3xl font-heading font-semibold text-foreground">1</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tỷ Lệ Hoạt Động</p>
            <p className="text-3xl font-heading font-semibold text-accent">100%</p>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Tên</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Email</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Ngày Tạo</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Đơn Hàng</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Chi Tiêu</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-secondary transition-colors">
                  <td className="py-4 px-6 text-foreground font-medium">{session.user.name}</td>
                  <td className="py-4 px-6 text-foreground">{session.user.email}</td>
                  <td className="py-4 px-6 text-muted-foreground">Hôm nay</td>
                  <td className="py-4 px-6 text-foreground">0</td>
                  <td className="py-4 px-6 text-foreground">0 đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
