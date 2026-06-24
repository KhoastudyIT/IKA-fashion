'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, ShoppingBag } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { useSession } from '@/auth-client'
import { getProductByHandle, getProducts, addToCart, addWishlist, ApiProduct } from '@/api'

export default function ProductDetailPage() {
  const params = useParams<{ handle: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const [product, setProduct] = useState<ApiProduct | null>(null)
  const [related, setRelated] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!params?.handle) return
    setLoading(true)
    getProductByHandle(params.handle)
      .then((p) => {
        setProduct(p)
        setSelectedColor(p.colors[0] || '')
        setSelectedSize(p.sizes[0] || '')
        return getProducts({ collection: p.collection, limit: 8 }).then((res) =>
          setRelated(res.items.filter((r) => r.handle !== p.handle).slice(0, 4)),
        )
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [params?.handle])

  const requireLogin = () => {
    if (!session) {
      router.push('/auth/login')
      return false
    }
    return true
  }

  const handleAddToCart = async () => {
    if (!product || !requireLogin()) return
    setBusy(true)
    setMessage('')
    try {
      await addToCart({ productId: product.id, size: selectedSize, color: selectedColor, quantity })
      setMessage('Đã thêm vào giỏ hàng ✓')
    } catch (e: any) {
      setMessage(e.message || 'Không thêm được vào giỏ')
    } finally {
      setBusy(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product || !requireLogin()) return
    setBusy(true)
    try {
      await addToCart({ productId: product.id, size: selectedSize, color: selectedColor, quantity })
      router.push('/cart')
    } catch (e: any) {
      setMessage(e.message || 'Không thêm được vào giỏ')
      setBusy(false)
    }
  }

  const handleWishlist = async () => {
    if (!product || !requireLogin()) return
    try {
      await addWishlist(product.id)
      setMessage('Đã thêm vào yêu thích ✓')
    } catch (e: any) {
      setMessage(e.message || 'Lỗi')
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </main>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-semibold text-foreground mb-4">Sản phẩm không tìm thấy</h1>
            <Link href="/products" className="text-accent hover:underline font-medium">← Quay lại danh sách sản phẩm</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="border-b border-border py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <Link href="/" className="text-accent hover:underline">Trang Chủ</Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/products" className="text-accent hover:underline">Sản Phẩm</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg overflow-hidden h-96 md:h-[600px] flex items-center justify-center">
                <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, idx) => (
                  <div key={idx} className="bg-secondary rounded-lg overflow-hidden h-24 cursor-pointer hover:opacity-70">
                    <img src={image} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">{product.name}</h1>
                  <button onClick={handleWishlist} className="p-2 rounded-full bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Yêu thích">
                    <Heart size={24} />
                  </button>
                </div>
                <p className="text-3xl font-semibold text-accent mb-2">{product.price.toLocaleString()} đ</p>
                <p className="text-sm text-muted-foreground mb-4">★ {product.rating} · Đã bán {product.sold} · Còn {product.stock} sản phẩm</p>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-heading font-semibold text-foreground mb-3">ĐẶC ĐIỂM NỔI BẬT</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 bg-accent rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                {product.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Màu Sắc</label>
                    <div className="flex gap-3 flex-wrap">
                      {product.colors.map((color) => (
                        <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded border-2 text-sm font-medium transition-colors ${selectedColor === color ? 'border-accent text-accent' : 'border-border text-foreground hover:border-accent'}`}>
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Kích Cỡ</label>
                    <div className="grid grid-cols-4 gap-2">
                      {product.sizes.map((size) => (
                        <button key={size} onClick={() => setSelectedSize(size)} className={`py-2 rounded border-2 text-sm font-medium transition-colors ${selectedSize === size ? 'border-accent text-accent' : 'border-border text-foreground hover:border-accent'}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Số Lượng</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 border border-border rounded text-foreground hover:bg-secondary">−</button>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 px-3 py-2 text-center bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                    <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 border border-border rounded text-foreground hover:bg-secondary">+</button>
                  </div>
                </div>
              </div>

              {message && <p className="text-sm font-medium text-accent">{message}</p>}

              <div className="flex gap-4 pt-4">
                <button onClick={handleAddToCart} disabled={busy} className="flex-1 px-6 py-4 bg-foreground text-primary-foreground font-semibold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  <ShoppingBag size={20} />
                  Thêm Vào Giỏ
                </button>
                <button onClick={handleBuyNow} disabled={busy} className="flex-1 px-6 py-4 border-2 border-foreground text-foreground font-semibold rounded hover:bg-foreground hover:text-primary-foreground transition-colors disabled:opacity-50">
                  Mua Ngay
                </button>
              </div>

              <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">✓ Miễn phí vận chuyển toàn quốc</p>
                <p className="font-medium text-foreground">✓ Đổi trả miễn phí trong 7 ngày</p>
                <p className="font-medium text-foreground">✓ Bảo hành chất lượng</p>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="text-3xl font-heading font-semibold text-foreground mb-8">Sản Phẩm Tương Tự</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((rp) => (
                  <Link key={rp.handle} href={`/products/${rp.handle}`}>
                    <div className="group cursor-pointer">
                      <div className="bg-secondary rounded-lg overflow-hidden mb-3 h-64 flex items-center justify-center">
                        <img src={rp.img} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">{rp.name}</h3>
                      <p className="text-accent font-semibold">{rp.price.toLocaleString()} đ</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
