'use client'

import Link from 'next/link'
import { useSession } from '@/auth-client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerWishlistPage() {
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
          <h1 className="text-2xl font-heading font-semibold text-foreground">Danh Sách Yêu Thích</h1>
          <Link href="/dashboard/customer" className="text-accent hover:underline">
            ← Quay Lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">Bạn chưa lưu sản phẩm nào</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity text-sm"
            >
              Khám Phá Sản Phẩm
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
