'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ChevronRight, Trash2 } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { useSession } from '@/auth-client'
import { getWishlist, removeWishlist, addToCart, ApiProduct } from '@/api'

export default function WishlistPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [items, setItems] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.push('/auth/login')
      return
    }
    getWishlist()
      .then(setItems)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false))
  }, [session, isPending, router])

  const handleRemove = async (productId: number) => {
    try {
      setItems(await removeWishlist(productId))
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  const handleAddToCart = async (p: ApiProduct) => {
    try {
      await addToCart({ productId: p.id, size: p.sizes[0], color: p.colors[0], quantity: 1 })
      setMessage(`Đã thêm "${p.name}" vào giỏ ✓`)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  if (isPending || loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-heading font-semibold text-foreground">Danh Sách Yêu Thích</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {message && <p className="text-accent text-sm mb-6 font-medium">{message}</p>}

          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-6 flex justify-center">
                <Heart size={48} className="text-accent opacity-50" />
              </div>
              <p className="text-muted-foreground mb-8 text-lg">Danh sách yêu thích đang trống</p>
              <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity">
                Khám Phá Sản Phẩm
                <ChevronRight size={20} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {items.map((p) => (
                <div key={p.id} className="group">
                  <Link href={`/products/${p.handle}`}>
                    <div className="bg-secondary rounded-lg overflow-hidden mb-4 h-72 flex items-center justify-center">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  </Link>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{p.name}</h3>
                  <p className="text-accent font-semibold mb-3">{p.price.toLocaleString()} đ</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddToCart(p)} className="flex-1 px-3 py-2 bg-foreground text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity">
                      Thêm Vào Giỏ
                    </button>
                    <button onClick={() => handleRemove(p.id)} className="px-3 py-2 border border-border text-destructive rounded hover:bg-secondary transition-colors" aria-label="Xóa">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
