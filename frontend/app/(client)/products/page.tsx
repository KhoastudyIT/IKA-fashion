'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Heart, X } from 'lucide-react'
import { useSession } from '@/auth-client'
import { getProducts, getCollections, addWishlist, removeWishlist, ApiProduct, Collection, ProductQuery } from '@/api'
import { useShop } from '@/components/context/ShopContext'

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating'
type CollectionFilter = string // 'all' | slug | 'uu-dai'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { syncWishlist, isWishlisted } = useShop()
  const [wishlistBusyId, setWishlistBusyId] = useState<number | null>(null)

  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [maxPrice, setMaxPrice] = useState(1000000)
  // Seed the initial filter from the URL ?collection= / ?isSale= param
  const [selectedCollection, setSelectedCollection] = useState<CollectionFilter>(
    () => {
      if (searchParams.get('isSale') === 'true') return 'uu-dai'
      return searchParams.get('collection') ?? 'all'
    }
  )
  const [showFilters, setShowFilters] = useState(false)

  const [products, setProducts] = useState<ApiProduct[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tải danh mục 1 lần
  useEffect(() => {
    getCollections().then(setCollections).catch(() => {})
  }, [])

  // Khi collection filter thay đổi → cập nhật URL để back-button / share hoạt động đúng
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('collection')
    params.delete('isSale')
    if (selectedCollection === 'uu-dai') {
      params.set('isSale', 'true')
    } else if (selectedCollection !== 'all') {
      params.set('collection', selectedCollection)
    }
    router.replace(`/products?${params.toString()}`, { scroll: false })
  }, [selectedCollection]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tải sản phẩm mỗi khi filter thay đổi
  useEffect(() => {
    setLoading(true)
    setError('')
    const query: ProductQuery = {
      sort: sortBy,
      priceMax: maxPrice,
      limit: 50,
    }
    if (selectedCollection === 'uu-dai') {
      query.isSale = true
    } else if (selectedCollection !== 'all') {
      query.collection = selectedCollection
    }

    getProducts(query)
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message || 'Không tải được sản phẩm'))
      .finally(() => setLoading(false))
  }, [sortBy, maxPrice, selectedCollection])

  // Bấm lần nữa thì bỏ yêu thích
  const handleWishlist = async (product: ApiProduct) => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    setWishlistBusyId(product.id)
    setError('')
    try {
      syncWishlist(
        isWishlisted(product.id)
          ? await removeWishlist(product.id)
          : await addWishlist(product.id),
      )
    } catch (e: any) {
      setError(e.message || 'Không cập nhật được yêu thích')
    } finally {
      setWishlistBusyId(null)
    }
  }

  // Nút đóng / mở, render lại bộ lọc chung cho cả Mobile và Desktop
  const renderFilters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Sắp Xếp</h3>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer"
          >
            <option value="newest">Mới Nhất</option>
            <option value="price_asc">Giá: Thấp → Cao</option>
            <option value="price_desc">Giá: Cao → Thấp</option>
            <option value="rating">Đánh Giá Cao</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 pointer-events-none text-foreground" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Khoảng Giá</h3>
        <input
          type="range"
          min="0"
          max="1000000"
          step="50000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(parseInt(e.target.value))}
          className="w-full h-1 bg-border rounded cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0đ</span>
          <span>≤ {(maxPrice / 1000).toFixed(0)}k</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Bộ Sưu Tập</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={selectedCollection === 'all'} onChange={() => setSelectedCollection('all')} className="w-4 h-4 cursor-pointer" />
            <span className="text-sm text-foreground">Tất Cả</span>
          </label>
          {/* Danh mục thực từ API */}
          {collections.map((col) => (
            <label key={col.slug} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={selectedCollection === col.slug} onChange={() => setSelectedCollection(col.slug)} className="w-4 h-4 cursor-pointer" />
              <span className="text-sm text-foreground">{col.name} ({col.productCount})</span>
            </label>
          ))}
          {/* Tab Ưu Đãi */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={selectedCollection === 'uu-dai'} onChange={() => setSelectedCollection('uu-dai')} className="w-4 h-4 cursor-pointer" />
            <span className="text-sm text-red-500 font-semibold">🏷️ Ưu Đãi</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-4">Sản Phẩm</h1>
            <p className="text-muted-foreground font-light">
              Khám phá bộ sưu tập thời trang chất lượng cao với công nghệ vải tiên tiến
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                {renderFilters()}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <span>Bộ Lọc</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {error && <p className="text-destructive mb-6 text-sm">{error}</p>}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-secondary rounded-lg h-80 mb-4" />
                      <div className="h-4 bg-secondary rounded mb-2" />
                      <div className="h-4 bg-secondary rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6">Hiển thị {products.length} sản phẩm</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => {
                      const wished = isWishlisted(product.id)
                      return (
                            <div key={product.handle} className="group relative">
                          {/* Nằm ngoài Link để không lồng button trong thẻ <a> */}
                          <button
                            onClick={() => handleWishlist(product)}
                            disabled={wishlistBusyId === product.id}
                            aria-pressed={wished}
                            aria-label={`${wished ? 'Bỏ yêu thích' : 'Yêu thích'} ${product.name}`}
                            className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-background/85 shadow-sm transition-colors disabled:opacity-50 ${
                              wished ? 'text-red-600' : 'text-foreground hover:text-red-600'
                            }`}
                          >
                            <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
                          </button>

                          {/* Badge giảm giá */}
                          {product.discount > 0 && (
                            <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow pointer-events-none">
                              -{product.discount}%
                            </div>
                          )}

                          <Link href={`/products/${product.handle}`}>
                            <div className="cursor-pointer">
                              <div className="bg-secondary rounded-lg overflow-hidden mb-4 h-80 flex items-center justify-center">
                                <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <h3 className="text-lg font-heading font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{product.description}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-lg font-semibold text-foreground">{product.price.toLocaleString('vi-VN')} đ</span>
                                  {product.discount > 0 && product.originalPrice && (
                                    <span className="text-sm text-muted-foreground line-through">{product.originalPrice.toLocaleString('vi-VN')} đ</span>
                                  )}
                                </div>
                                <span className="text-accent group-hover:underline text-sm font-medium">Chi Tiết →</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">★ {product.rating} · Đã bán {product.sold.toLocaleString('vi-VN')}</p>
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm</p>
                  <button
                    onClick={() => { setMaxPrice(1000000); setSelectedCollection('all') }}
                    className="text-accent hover:underline text-sm font-medium"
                  >
                    Xóa Bộ Lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowFilters(false)}
          ></div>

          {/* Drawer */}
          <div className="relative w-4/5 max-w-sm h-full bg-background p-6 overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-foreground">Bộ Lọc</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Đóng bộ lọc"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {renderFilters()}
          </div>
        </div>
      )}
    </>
  )
}
