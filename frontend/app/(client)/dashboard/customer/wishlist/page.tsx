'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ChevronRight, Trash2 } from 'lucide-react'
import { useSession } from '@/auth-client'
import { getWishlist, removeWishlist, addToCart, ApiProduct } from '@/api'
import { useShop } from '@/components/context/ShopContext'

export default function CustomerWishlistPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { syncCart, syncWishlist } = useShop()
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
      const next = await removeWishlist(productId)
      setItems(next)
      syncWishlist(next)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  const handleAddToCart = async (p: ApiProduct) => {
    try {
      syncCart(await addToCart({ productId: p.id, size: p.sizes[0], color: p.colors[0], quantity: 1 }))
      setMessage(`Đã thêm "${p.name}" vào giỏ ✓`)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-8">Danh Sách Yêu Thích</h1>

      {message && <p className="text-accent text-sm mb-6 font-medium">{message}</p>}

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6">
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
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((p) => (
            <div key={p.id} className="group bg-card border border-border rounded-lg overflow-hidden">
              <Link href={`/products/${p.handle}`}>
                <div className="bg-secondary overflow-hidden aspect-square flex items-center justify-center">
                  <img src={p.img} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                </div>
              </Link>
              <div className="p-3">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-0.5 truncate">{p.name}</h3>
                <p className="text-accent font-semibold text-sm mb-2.5">{p.price.toLocaleString()} đ</p>
                <div className="flex gap-1.5">
                  <button onClick={() => handleAddToCart(p)} className="flex-1 px-2 py-1.5 bg-foreground text-primary-foreground text-xs font-medium rounded hover:opacity-90 transition-opacity">
                    Thêm Vào Giỏ
                  </button>
                  <button onClick={() => handleRemove(p.id)} className="px-2 py-1.5 border border-border text-destructive rounded hover:bg-secondary transition-colors" aria-label="Xóa khỏi yêu thích">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
