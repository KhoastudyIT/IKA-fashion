'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/auth-client'
import { getProducts, addToCart, ApiProduct } from '@/api'
import { useShop } from '@/components/context/ShopContext'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc',label: 'Giá: Cao → Thấp' },
  { value: 'rating',    label: 'Đánh giá cao nhất' },
  { value: 'sold',      label: 'Bán chạy nhất' },
]

function SkeletonCard() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5DFD8' }}>
      <div style={{ height: '220px', background: 'linear-gradient(90deg, #F0EBE5 25%, #F9F5F0 50%, #F0EBE5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: '16px' }}>
        <div style={{ height: '14px', background: '#F0EBE5', borderRadius: '4px', marginBottom: '10px', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: '12px', background: '#F0EBE5', borderRadius: '4px', width: '60%', animation: 'shimmer 1.4s infinite' }} />
      </div>
    </div>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { syncCart } = useShop()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState<ApiProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sort, setSort] = useState<string>('newest')
  const [maxPrice, setMaxPrice] = useState(1000000)
  const [showFilters, setShowFilters] = useState(false)
  const [localQ, setLocalQ] = useState(query)

  useEffect(() => { setLocalQ(query) }, [query])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsLoading(false); return }
    setIsLoading(true)
    getProducts({ search: query, sort: sort as any, priceMax: maxPrice, limit: 50 })
      .then((res) => setResults(res.items))
      .catch((e) => setMessage(e.message))
      .finally(() => setIsLoading(false))
  }, [query, sort, maxPrice])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (localQ.trim()) router.push(`/search?q=${encodeURIComponent(localQ.trim())}`)
  }

  const handleAddToCart = async (product: ApiProduct) => {
    if (!session) { router.push('/auth/login'); return }
    try {
      syncCart(await addToCart({ productId: product.id, size: product.sizes[0] ?? '', color: product.colors[0] ?? '', quantity: 1 }))
      setMessage(`✓ Đã thêm "${product.name}" vào giỏ hàng`)
      setTimeout(() => setMessage(''), 3000)
    } catch (e: any) { setMessage(e.message) }
  }

  const SUGGESTIONS = ['Áo thun', 'Áo polo', 'Quần kaki', 'Áo hoodie', 'Áo sơ mi']

  return (
    <main style={{ minHeight: '100vh', background: '#FFFBF7' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Search header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5DFD8', padding: '32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', fontWeight: 700, color: '#2C2C2C', marginBottom: '20px' }}>
            Tìm Kiếm
          </h1>
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
            <input
              type="text"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm IKA..."
              style={{
                width: '100%', padding: '14px 52px', fontSize: '1rem',
                border: '2px solid #E5DFD8', borderRadius: '12px', outline: 'none',
                background: '#FAFAFA', color: '#2C2C2C', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#D4AF37'}
              onBlur={e => e.target.style.borderColor = '#E5DFD8'}
            />
            {localQ && (
              <button type="button" onClick={() => { setLocalQ(''); router.push('/search') }}
                style={{ position: 'absolute', right: '52px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#7A7A7A' }}>
                <X size={16} />
              </button>
            )}
            <button type="submit" style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              padding: '8px 16px', background: '#D4AF37', color: '#1a1a1a', border: 'none',
              borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
            }}>
              Tìm
            </button>
          </form>

          {/* Suggestions */}
          {!query && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: '#7A7A7A', alignSelf: 'center' }}>Gợi ý:</span>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                  style={{ padding: '6px 14px', background: '#F9F5F0', border: '1px solid #E5DFD8', borderRadius: '20px', fontSize: '0.8125rem', color: '#2C2C2C', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {query && (
            <p style={{ fontSize: '0.875rem', color: '#7A7A7A' }}>
              {isLoading ? 'Đang tìm kiếm...' : `Kết quả cho `}
              {!isLoading && <strong style={{ color: '#2C2C2C' }}>"{query}"</strong>}
              {!isLoading && ` — ${results.length} sản phẩm`}
            </p>
          )}
        </div>
      </div>

      {query && (
        <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '24px' }}>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: `1.5px solid ${showFilters ? '#D4AF37' : '#E5DFD8'}`, borderRadius: '8px', background: showFilters ? 'rgba(212,175,55,0.08)' : '#FFFFFF', color: showFilters ? '#D4AF37' : '#2C2C2C', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
              <SlidersHorizontal size={15} /> Bộ lọc
            </button>

            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: '9px 14px', border: '1.5px solid #E5DFD8', borderRadius: '8px', background: '#FFFFFF', fontSize: '0.8125rem', color: '#2C2C2C', cursor: 'pointer', outline: 'none' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {message && (
              <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#D4AF37', fontWeight: 500 }}>{message}</span>
            )}
          </div>

          {/* Expandable filter panel */}
          {showFilters && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5DFD8', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2C2C2C', display: 'block', marginBottom: '8px' }}>
                    Giá tối đa: <strong style={{ color: '#D4AF37' }}>{(maxPrice / 1000).toFixed(0)}k đ</strong>
                  </label>
                  <input type="range" min={0} max={1000000} step={50000} value={maxPrice}
                    onChange={e => setMaxPrice(parseInt(e.target.value))}
                    style={{ width: '220px', accentColor: '#D4AF37' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#9A9A9A', marginTop: '4px' }}>
                    <span>0đ</span><span>1.000.000đ</span>
                  </div>
                </div>
                <button onClick={() => setMaxPrice(1000000)}
                  style={{ padding: '8px 14px', border: '1px solid #E5DFD8', borderRadius: '6px', background: '#F9F5F0', color: '#7A7A7A', fontSize: '0.75rem', cursor: 'pointer' }}>
                  Đặt lại
                </button>
              </div>
            </div>
          )}

          {/* Results grid */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {results.map((product) => (
                <ProductSearchCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.375rem', color: '#2C2C2C', marginBottom: '8px' }}>
                Không tìm thấy kết quả
              </h2>
              <p style={{ color: '#7A7A7A', marginBottom: '24px' }}>Thử từ khóa khác hoặc xem toàn bộ sản phẩm</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                    style={{ padding: '8px 16px', background: '#F9F5F0', border: '1px solid #E5DFD8', borderRadius: '20px', fontSize: '0.8125rem', color: '#2C2C2C', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '24px' }}>
                <Link href="/products" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
                  Xem tất cả sản phẩm →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function ProductSearchCard({ product, onAddToCart }: { product: ApiProduct; onAddToCart: (p: ApiProduct) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5DFD8', overflow: 'hidden',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'none', transition: 'all 0.3s',
      }}>
      <Link href={`/products/${product.handle}`} style={{ textDecoration: 'none' }}>
        <div style={{ position: 'relative', height: '200px', background: '#F9F5F0', overflow: 'hidden' }}>
          <img src={product.img} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s' }} />
        </div>
        <div style={{ padding: '14px 16px 8px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.6875rem', color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.type}</p>
          <h3 style={{ margin: '0 0 8px', fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C', lineHeight: 1.4, minHeight: '40px' }}>{product.name}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#D4AF37' }}>{product.price.toLocaleString('vi-VN')}đ</span>
            <span style={{ fontSize: '0.75rem', color: '#9A9A9A' }}>★ {product.rating}</span>
          </div>
        </div>
      </Link>
      <div style={{ padding: '8px 16px 14px' }}>
        <button onClick={() => onAddToCart(product)}
          style={{
            width: '100%', padding: '9px', background: hovered ? '#2C2C2C' : 'transparent',
            border: '1.5px solid #2C2C2C', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
            color: hovered ? '#FFFFFF' : '#2C2C2C', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px',
          }}>
          Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <>
      <Suspense fallback={
        <main style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #E5DFD8', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'ika-spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <style>{`@keyframes ika-spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: '#7A7A7A' }}>Đang tải...</p>
          </div>
        </main>
      }>
        <SearchPageContent />
      </Suspense>
    </>
  )
}
