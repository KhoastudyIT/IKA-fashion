'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ChevronRight } from 'lucide-react'
import { useSession } from '@/auth-client'
import { getCart, updateCartItem, removeCartItem, clearCart, lineKey, Cart } from '@/api'
import { useShop } from '@/components/context/ShopContext'

export default function CustomerCartPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { syncCart } = useShop()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.push('/auth/login')
      return
    }
    getCart()
      .then(setCart)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [session, isPending, router])

  // Cập nhật cả state trang lẫn badge trên header từ cùng một response
  const applyCart = (next: Cart) => {
    setCart(next)
    syncCart(next)
  }

  const handleUpdate = async (key: string, quantity: number) => {
    if (quantity < 1) return handleRemove(key)
    try {
      applyCart(await updateCartItem(key, quantity))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleRemove = async (key: string) => {
    try {
      applyCart(await removeCartItem(key))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleClear = async () => {
    try {
      applyCart(await clearCart())
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  const items = cart?.items ?? []
  const subtotal = cart?.subtotal ?? 0

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-8">Giỏ Hàng</h1>

      {error && <p className="text-destructive mb-6 text-sm">{error}</p>}

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6 text-lg">Giỏ hàng của bạn đang trống</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity">
              Tiếp Tục Mua Sắm
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Items */}
          <div className="xl:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground text-sm">{cart?.totalItems} sản phẩm trong giỏ</p>
                <button onClick={handleClear} className="text-sm text-destructive hover:underline font-medium">Xóa Tất Cả</button>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => {
                  const key = lineKey(item)
                  return (
                    <div key={key} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                      <div className="w-20 h-20 bg-secondary rounded flex-shrink-0 overflow-hidden">
                        {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-foreground mb-1 truncate flex items-center gap-2">
                          {item.name}
                          {item.isFlashSale && (
                            <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full font-medium whitespace-nowrap">
                              ⚡ Flash Sale
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-1">Màu: {item.color} · Size: {item.size}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-foreground">{item.price.toLocaleString()} đ</span>
                          {item.originalPrice != null && item.originalPrice > item.price && (
                            <span className="text-xs text-muted-foreground line-through">{item.originalPrice.toLocaleString()} đ</span>
                          )}
                          <span className="text-sm text-muted-foreground">/ sản phẩm</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-border rounded w-fit">
                            <button onClick={() => handleUpdate(key, item.quantity - 1)} className="px-3 py-1 text-foreground hover:bg-secondary transition-colors">−</button>
                            <span className="px-3 py-1 border-l border-r border-border text-foreground font-medium">{item.quantity}</span>
                            <button onClick={() => handleUpdate(key, item.quantity + 1)} className="px-3 py-1 text-foreground hover:bg-secondary transition-colors">+</button>
                          </div>
                          <button onClick={() => handleRemove(key)} className="text-destructive hover:opacity-70 transition-opacity" aria-label="Xóa">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-foreground">{item.lineTotal.toLocaleString()} đ</p>
                        {item.originalPrice != null && item.originalPrice > item.price && (
                          <p className="text-xs text-muted-foreground line-through mt-1">
                            {item.originalLineTotal.toLocaleString()} đ
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="xl:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-28">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Tóm Tắt Đơn Hàng</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="text-foreground font-medium">{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vận chuyển</span>
                  <span className="text-foreground font-medium">Miễn phí</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-heading font-semibold text-foreground">Tổng cộng</span>
                  <span className="text-2xl font-semibold text-accent">{subtotal.toLocaleString()} đ</span>
                </div>
              </div>

              <Link href="/checkout" className="block w-full px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity mb-3 text-center">
                Tiến Hành Thanh Toán →
              </Link>

              <Link href="/products" className="block w-full px-6 py-3 border border-foreground text-foreground font-medium rounded text-center hover:bg-foreground hover:text-primary-foreground transition-colors">
                Tiếp Tục Mua Sắm
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
