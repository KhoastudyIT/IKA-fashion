'use client'

import Link from 'next/link'
import { useSession, signOut } from '@/auth-client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerSettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      router.push('/')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-heading font-semibold text-foreground">Cài Đặt</h1>
          <Link href="/dashboard/customer" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Section */}
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Thông Tin Cá Nhân</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tên</label>
              <input
                type="text"
                value={session.user.name}
                readOnly
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={session.user.email}
                readOnly
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground"
              />
            </div>
            <button className="px-4 py-2 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity">
              Cập Nhật Thông Tin
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Bảo Mật</h2>
          <div className="space-y-4">
            <button className="px-4 py-2 border border-border text-foreground font-medium rounded hover:bg-secondary transition-colors">
              Đổi Mật Khẩu
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-card rounded-lg shadow p-6 border border-destructive/30">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Đăng Xuất</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Bạn sẽ được đăng xuất khỏi tài khoản của mình.
          </p>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-6 py-2 bg-destructive text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Đang Đăng Xuất...' : 'Đăng Xuất'}
          </button>
        </div>
      </div>
    </main>
  )
}
