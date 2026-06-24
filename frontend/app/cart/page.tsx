'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ChevronRight } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { useSession } from '@/auth-client'
import { getCart, updateCartItem, removeCartItem, clearCart, createOrder, lineKey, Cart } from '@/api'

export default function CartPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // checkout form
  const [showCheckout, setShowCheckout] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

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

  const handleUpdate = async (key: string, quantity: number) => {
    if (quantity < 1) return handleRemove(key)
    try {
      setCart(await updateCartItem(key, quantity))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleRemove = async (key: string) => {
    try {
      setCart(await removeCartItem(key))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleClear = async () => {
    try {
      setCart(await clearCart())
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlacing(true)
    setError('')
    try {
      const order = await createOrder({ shippingAddress, phone, notes })
      router.push(`/dashboard/customer/orders?placed=${order.id}`)
    } catch (err: any) {
      setError(err.message || 'Đặt hàng thất bại')
      setPlacing(false)
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

  const items = cart?.items ?? []
  const subtotal = cart?.subtotal ?? 0

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-heading font-semibold text-foreground">Giỏ Hàng</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error && <p className="text-destructive mb-6 text-sm">{error}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-6 text-lg">Giỏ hàng của bạn đang trống</p>
                  <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity">
                    Tiếp Tục Mua Sắm
                    <ChevronRight size={20} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-8">
                    <p className="text-muted-foreground">{cart?.totalItems} sản phẩm trong giỏ</p>
                    <button onClick={handleClear} className="text-sm text-destructive hover:underline font-medium">Xóa Tất Cả</button>
                  </div>

                  {items.map((item) => {
                    const key = lineKey(item)
                    return (
                      <div key={key} className="flex gap-6 pb-6 border-b border-border">
                        <div className="w-24 h-24 bg-secondary rounded flex-shrink-0 overflow-hidden">
                          {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold text-foreground mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">Màu: {item.color} · Size: {item.size}</p>
                          <p className="text-sm text-muted-foreground mb-4">{item.price.toLocaleString()} đ / sản phẩm</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-border rounded w-fit">
                              <button onClick={() => handleUpdate(key, item.quantity - 1)} className="px-3 py-1 text-foreground hover:bg-secondary transition-colors">−</button>
                              <span className="px-3 py-1 border-l border-r border-border text-foreground font-medium">{item.quantity}</span>
                              <button onClick={() => handleUpdate(key, item.quantity + 1)} className="px-3 py-1 text-foreground hover:bg-secondary transition-colors">+</button>
                            </div>
                            <button onClick={() => handleRemove(key)} className="text-destructive hover:opacity-70 transition-opacity ml-auto" aria-label="Xóa">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground text-lg">{item.lineTotal.toLocaleString()} đ</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary / Checkout */}
            {items.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-secondary rounded p-8 sticky top-24">
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

                  {!showCheckout ? (
                    <button onClick={() => setShowCheckout(true)} className="w-full px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity mb-3">
                      Tiến Hành Đặt Hàng
                    </button>
                  ) : (
                    <form onSubmit={handlePlaceOrder} className="space-y-3 mb-3">
                      <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required placeholder="Địa chỉ giao hàng" className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Số điện thoại" className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú (không bắt buộc)" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
                      <button type="submit" disabled={placing} className="w-full px-6 py-3 bg-accent text-accent-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                        {placing ? 'Đang đặt hàng...' : 'Xác Nhận Đặt Hàng'}
                      </button>
                    </form>
                  )}

                  <Link href="/products" className="block w-full px-6 py-3 border border-foreground text-foreground font-medium rounded text-center hover:bg-foreground hover:text-primary-foreground transition-colors">
                    Tiếp Tục Mua Sắm
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
