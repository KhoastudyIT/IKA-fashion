'use client'

import { useSession } from '@/auth-client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerSettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-8">Cài Đặt</h1>

      <div>
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
      </div>
    </>
  )
}
