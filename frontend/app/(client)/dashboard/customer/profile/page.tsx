'use client'

import Link from 'next/link'
import { useSession } from '@/auth-client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerProfilePage() {
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
      <header className="sticky top-0 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Hồ Sơ Cá Nhân</h1>
          <Link href="/dashboard/customer" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-lg shadow p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Tên Đầy Đủ
                </label>
                <input
                  type="text"
                  id="name"
                  defaultValue={session.user.name}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  defaultValue={session.user.email}
                  readOnly
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Số Điện Thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="0123456789"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                  Địa Chỉ
                </label>
                <input
                  type="text"
                  id="address"
                  placeholder="Địa chỉ của bạn"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                Thành Phố
              </label>
              <input
                type="text"
                id="city"
                placeholder="Thành phố"
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
              >
                Lưu Thay Đổi
              </button>
              <button
                type="button"
                className="px-6 py-3 border border-border text-foreground font-medium rounded hover:bg-secondary transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
