'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, ShoppingBag, Star, ThumbsUp, MessageCircle, HelpCircle } from 'lucide-react'
import { useSession } from '@/auth-client'
import { getProductByHandle, getProducts, addToCart, addWishlist, removeWishlist, getProductReviews, getMyProductReviews, createReview, canReviewProduct, ApiProduct, Review } from '@/api'
import { useChat } from '@/components/ChatContext'
import { useShop } from '@/components/context/ShopContext'

export default function ProductDetailPage() {
  const params = useParams<{ handle: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const chat = useChat()
  const { syncCart, syncWishlist, isWishlisted } = useShop()

  // Thông tin giảm giá đọc từ dữ liệu sản phẩm (không cần URL param nữa)

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

  const wishlisted = product ? isWishlisted(product.id) : false

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
      syncCart(await addToCart({ productId: product.id, size: selectedSize, color: selectedColor, quantity }))
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
      syncCart(await addToCart({ productId: product.id, size: selectedSize, color: selectedColor, quantity }))
      router.push('/dashboard/customer/cart')
    } catch (e: any) {
      setMessage(e.message || 'Không thêm được vào giỏ')
      setBusy(false)
    }
  }

  // Bấm lần nữa thì bỏ yêu thích
  const handleWishlist = async () => {
    if (!product || !requireLogin()) return
    try {
      if (wishlisted) {
        syncWishlist(await removeWishlist(product.id))
        setMessage('Đã bỏ khỏi yêu thích')
      } else {
        syncWishlist(await addWishlist(product.id))
        setMessage('Đã thêm vào yêu thích ✓')
      }
    } catch (e: any) {
      setMessage(e.message || 'Lỗi')
    }
  }

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </main>
      </>
    )
  }

  if (!product) {
    return (
      <>
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
      <main className="min-h-screen bg-background">
        <div className="border-b border-border py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <Link href="/" className="text-accent hover:underline">Trang Chủ</Link>
            <span className="text-muted-foreground">/</span>
            {product.discount > 0 ? (
              <Link href="/products?isSale=true" className="text-accent hover:underline">Ưu Đãi & Giảm Giá</Link>
            ) : (
              <Link href="/products" className="text-accent hover:underline">Sản Phẩm</Link>
            )}
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg overflow-hidden h-96 md:h-[600px] flex items-center justify-center relative">
                <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                {/* Badge giảm giá — lấy từ dữ liệu product */}
                {product.discount > 0 && (
                  <div style={{
                    position: 'absolute', top: '16px', left: '16px',
                    background: '#D4AF37', color: '#1a1a1a',
                    fontWeight: 800, fontSize: '15px',
                    padding: '6px 14px', borderRadius: '24px',
                    letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    -{product.discount}%
                  </div>
                )}
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
                  <button
                    onClick={handleWishlist}
                    aria-pressed={wishlisted}
                    aria-label={wishlisted ? 'Bỏ yêu thích' : 'Yêu thích'}
                    className={`p-2 rounded-full bg-secondary transition-colors ${
                      wishlisted ? 'text-red-600' : 'text-foreground hover:text-red-600'
                    }`}
                  >
                    <Heart size={24} fill={wishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Giá — hiển thị giá khuyến mãi nếu product có discount */}
                {product.discount > 0 && product.originalPrice ? (
                  <div className="mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl font-semibold text-accent">
                        {product.price.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        {product.originalPrice.toLocaleString('vi-VN')} đ
                      </span>
                      <span style={{
                        background: '#fee2e2', color: '#991b1b',
                        fontSize: '13px', fontWeight: 700,
                        padding: '3px 10px', borderRadius: '20px',
                      }}>
                        Tiết kiệm {(product.originalPrice - product.price).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-3xl font-semibold text-accent mb-2">{product.price.toLocaleString('vi-VN')} đ</p>
                )}

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

              {chat && (
                <button
                  onClick={() => chat.openChat({ id: product.id, name: product.name, img: product.img })}
                  className="w-full px-6 py-3.5 border border-accent text-accent font-semibold rounded flex items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MessageCircle size={18} />
                  Hỏi Tư Vấn Về Sản Phẩm Này
                </button>
              )}

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

          {/* ── Reviews & Q&A Section ───────────────────────────────────────────── */}
          <InteractiveTabs productId={product.id} productRating={product.rating} productSold={product.sold} />
        </div>
      </main>
    </>
  )
}

// Màu avatar theo thứ tự hiển thị
const AVATAR_COLORS = ['#D4AF37', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} style={{ color: i <= rating ? '#D4AF37' : '#E5DFD8', fill: i <= rating ? '#D4AF37' : 'none' }} />
      ))}
    </div>
  )
}

function InteractiveTabs({ productId, productRating, productSold }: { productId: number; productRating: number; productSold: number }) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews')

  return (
    <div style={{ marginTop: '80px', borderTop: '1px solid #E5DFD8', paddingTop: '64px' }}>
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #E5DFD8', marginBottom: '40px' }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            background: 'none', border: 'none', padding: '0 0 16px 0', cursor: 'pointer',
            fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600,
            color: activeTab === 'reviews' ? '#D4AF37' : '#9A9A9A',
            borderBottom: activeTab === 'reviews' ? '2px solid #D4AF37' : '2px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          Đánh Giá Khách Hàng
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          style={{
            background: 'none', border: 'none', padding: '0 0 16px 0', cursor: 'pointer',
            fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600,
            color: activeTab === 'qa' ? '#D4AF37' : '#9A9A9A',
            borderBottom: activeTab === 'qa' ? '2px solid #D4AF37' : '2px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          Hỏi Đáp (Q&A)
        </button>
      </div>

      {activeTab === 'reviews' ? (
        <ReviewsSection productId={productId} productRating={productRating} productSold={productSold} />
      ) : (
        <QASection />
      )}
    </div>
  )
}

function QASection() {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState([
    {
      id: 1, user: 'Ngọc Lan', date: '21/06/2026', content: 'Sản phẩm này có giặt máy được không ạ?',
      answer: 'Chào bạn, sản phẩm hoàn toàn có thể giặt máy. Tuy nhiên, để áo giữ form tốt nhất, bạn nên cho vào túi giặt và chọn chế độ giặt nhẹ nhé. Cảm ơn bạn!'
    },
    {
      id: 2, user: 'Hoàng Quân', date: '19/06/2026', content: 'Mình cao 1m75 nặng 65kg thì mặc size gì vừa shop?',
      answer: 'Chào Quân, với chiều cao và cân nặng của bạn, size L sẽ mặc vừa vặn, thoải mái nhé.'
    }
  ])
  const [newQuestion, setNewQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    setQuestions(prev => [{
      id: Date.now(), user: session?.user.name ?? 'Khách hàng',
      date: new Date().toLocaleDateString('vi-VN'), content: newQuestion, answer: ''
    }, ...prev])
    setSubmitted(true)
    setNewQuestion('')
  }

  return (
    <div>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E5DFD8', marginBottom: '40px' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 600, color: '#2C2C2C', marginBottom: '24px' }}>
          Đặt Câu Hỏi
        </h3>
        {!session ? (
          <div style={{ background: '#F9F5F0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#7A7A7A', marginBottom: '12px', fontSize: '14px' }}>Đăng nhập để đặt câu hỏi</p>
            <Link href="/auth/login" style={{ padding: '10px 24px', background: '#D4AF37', color: '#1a1a1a', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Đăng nhập</Link>
          </div>
        ) : submitted ? (
          <div style={{ background: '#d1fae5', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#065f46', fontWeight: 600 }}>✓ Cảm ơn bạn! Câu hỏi đã được gửi và đang chờ duyệt/trả lời.</p>
            <button onClick={() => setSubmitted(false)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Đặt thêm câu hỏi</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <textarea value={newQuestion} onChange={e => setNewQuestion(e.target.value)} required rows={3}
                placeholder="Ví dụ: Sản phẩm này khi nào restock màu đen?"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E5DFD8', borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#E5DFD8'}
              />
            </div>
            <button type="submit" disabled={!newQuestion.trim()}
              style={{ padding: '12px 32px', background: '#D4AF37', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: (!newQuestion.trim()) ? 0.5 : 1 }}>
              Gửi Câu Hỏi
            </button>
          </form>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {questions.map(q => (
          <div key={q.id} style={{ borderBottom: '1px solid #F0EBE5', paddingBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
              <HelpCircle size={20} style={{ color: '#9A9A9A', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#2C2C2C', fontSize: '15px' }}>{q.content}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9A9A9A' }}>Bởi <span style={{ color: '#7A7A7A' }}>{q.user}</span> vào {q.date}</p>
              </div>
            </div>
            {q.answer ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginLeft: '32px', background: '#F9F5F0', padding: '16px', borderRadius: '8px' }}>
                <MessageCircle size={18} style={{ color: '#D4AF37', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#2C2C2C', fontSize: '13px' }}>IKA Fashion (Admin)</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4A4A4A', lineHeight: 1.6 }}>{q.answer}</p>
                </div>
              </div>
            ) : (
              <div style={{ marginLeft: '32px', fontSize: '13px', color: '#9A9A9A', fontStyle: 'italic' }}>
                Đang chờ quản trị viên trả lời...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewsSection({ productId, productRating, productSold }: { productId: number; productRating: number; productSold: number }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  // Đánh giá của chính khách, kể cả cái chưa duyệt — danh sách công khai lọc
  // approved nên không có chúng.
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [myRating, setMyRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [myReview, setMyReview] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [canReview, setCanReview] = useState(false)

  useEffect(() => {
    getProductReviews(productId).then(setReviews).catch(() => setReviews([]))
  }, [productId])

  const loadMyReviews = () => {
    if (!session) { setMyReviews([]); return }
    getMyProductReviews(productId).then(setMyReviews).catch(() => setMyReviews([]))
  }

  useEffect(() => {
    if (!session) { setCanReview(false); setMyReviews([]); return }
    canReviewProduct(productId).then(r => setCanReview(r.canReview)).catch(() => setCanReview(false))
    loadMyReviews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myRating || !myReview.trim()) return
    setSaving(true)
    setError('')
    try {
      await createReview({ productId, rating: myRating, comment: myReview })
      setSubmitted(true)
      setMyReview('')
      setMyRating(0)
      loadMyReviews() // hiện ngay bài vừa gửi cho khách thấy
    } catch (err: any) {
      setError(err.message || 'Gửi đánh giá thất bại')
    } finally {
      setSaving(false)
    }
  }

  const ratingDist = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }))

  return (
    <div>
      {/* Rating overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px', marginBottom: '48px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '64px', fontWeight: 700, color: '#D4AF37', margin: 0, lineHeight: 1 }}>{productRating}</p>
          <StarRow rating={Math.round(productRating)} size={20} />
          <p style={{ fontSize: '13px', color: '#7A7A7A', margin: '8px 0 0' }}>{reviews.length} đánh giá</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
          {ratingDist.map(d => (
            <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#7A7A7A', width: '16px', textAlign: 'right' }}>{d.star}</span>
              <Star size={12} style={{ color: '#D4AF37', fill: '#D4AF37', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '8px', background: '#F0EBE5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${d.pct}%`, height: '100%', background: '#D4AF37', borderRadius: '4px', transition: 'width 0.6s' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#9A9A9A', width: '28px' }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Đánh giá của chính khách — hiện cả bài đang chờ duyệt */}
      {myReviews.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 600, color: '#2C2C2C', marginBottom: '14px' }}>
            Đánh Giá Của Bạn
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myReviews.map((review) => (
              <div key={review.id} style={{ background: '#FDF9F0', borderRadius: '12px', padding: '22px', border: '1px solid #D4AF37' }}>
                {/* Không hiện trạng thái duyệt: khâu kiểm duyệt là việc nội bộ
                    của cửa hàng, khách chỉ cần thấy bài mình đã gửi. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <StarRow rating={review.rating} size={14} />
                  <span style={{ fontSize: '12px', color: '#9A9A9A' }}>
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>{review.comment}</p>
                {review.reply && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#FFFFFF', padding: '14px', borderRadius: '8px', borderLeft: '2px solid #D4AF37', marginTop: '12px' }}>
                    <MessageCircle size={16} style={{ color: '#D4AF37', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#2C2C2C', fontSize: '12px' }}>Phản hồi từ IKA Fashion</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6 }}>{review.reply}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
        {reviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9A9A9A', fontSize: '14px', padding: '24px 0' }}>
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!
          </p>
        ) : reviews.map((review, idx) => (
          <div key={review.id} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5DFD8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                  {review.userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#2C2C2C' }}>{review.userName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <StarRow rating={review.rating} size={13} />
                    <span style={{ fontSize: '12px', color: '#9A9A9A' }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 12px' }}>{review.comment}</p>
            {review.reply && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#F9F5F0', padding: '14px', borderRadius: '8px', borderLeft: '2px solid #D4AF37' }}>
                <MessageCircle size={16} style={{ color: '#D4AF37', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#2C2C2C', fontSize: '12px' }}>Phản hồi từ IKA Fashion</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6 }}>{review.reply}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Write review */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E5DFD8' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 600, color: '#2C2C2C', marginBottom: '24px' }}>
          Viết Đánh Giá Của Bạn
        </h3>
        {!session ? (
          <div style={{ background: '#F9F5F0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#7A7A7A', marginBottom: '12px', fontSize: '14px' }}>Đăng nhập để viết đánh giá</p>
            <Link href="/auth/login" style={{ padding: '10px 24px', background: '#D4AF37', color: '#1a1a1a', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Đăng nhập</Link>
          </div>
        ) : !canReview ? (
          <div style={{ background: '#F9F5F0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#7A7A7A', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
              🛍️ Chỉ khách đã <strong>mua và nhận hàng thành công</strong> sản phẩm này mới có thể viết đánh giá.
              <br />Bạn vẫn có thể xem các đánh giá ở trên.
            </p>
          </div>
        ) : submitted ? (
          <div style={{ background: '#d1fae5', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#065f46', fontWeight: 600 }}>✓ Cảm ơn bạn đã gửi đánh giá!</p>
            <button onClick={() => setSubmitted(false)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>Viết thêm đánh giá</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2C2C2C', marginBottom: '10px' }}>Đánh giá của bạn *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} type="button"
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setMyRating(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <Star size={28} style={{ color: i <= (hoverRating || myRating) ? '#D4AF37' : '#E5DFD8', fill: i <= (hoverRating || myRating) ? '#D4AF37' : 'none', transition: 'all 0.15s' }} />
                  </button>
                ))}
                {myRating > 0 && <span style={{ fontSize: '13px', color: '#7A7A7A', alignSelf: 'center', marginLeft: '6px' }}>{['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][myRating]}</span>}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2C2C2C', marginBottom: '8px' }}>Nhận xét *</label>
              <textarea value={myReview} onChange={e => setMyReview(e.target.value)} required rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E5DFD8', borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#E5DFD8'}
              />
            </div>
            <button type="submit" disabled={!myRating || !myReview.trim() || saving}
              style={{ padding: '12px 32px', background: '#D4AF37', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: (!myRating || !myReview.trim() || saving) ? 0.5 : 1 }}>
              {saving ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
