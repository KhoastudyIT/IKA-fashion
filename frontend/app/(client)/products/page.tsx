'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { useSession } from '@/auth-client'
import { getProducts, getCollections, getProductByHandle, addToCart, addWishlist, removeWishlist, ApiProduct, Collection, ProductQuery } from '@/api'
import { useShop } from '@/components/context/ShopContext'
import { useUI } from '@/components/context/UIDialogContext'
import ProductCard from '@/components/ProductCard'

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating'
type CollectionFilter = string // 'all' | slug | 'uu-dai'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { syncCart, syncWishlist, isWishlisted } = useShop()
  const { toast } = useUI()
  const [wishlistBusyId, setWishlistBusyId] = useState<number | null>(null)
  const [buyNowBusyId, setBuyNowBusyId] = useState<number | null>(null)

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
    getCollections().then(res => setCollections(res.items || [])).catch(() => { })
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

  /**
   * Biến thể mặc định khi mua nhanh: cặp size–màu ĐẦU TIÊN còn hàng.
   *
   * Cứ lấy cứng sizes[0]/colors[0] thì sản phẩm còn hàng nhưng hết đúng size đầu
   * sẽ báo lỗi ngay khi bấm, dù kho vẫn còn size khác. Bảng tồn kho biến thể chỉ
   * có ở endpoint chi tiết nên phải lấy thêm — đổi lại nút bấm là ăn chắc.
   */
  const bienTheMuaNhanh = (p: ApiProduct) => {
    const sizes = p.sizes ?? []
    const colors = p.colors ?? []
    const kho = p.variantStock
    if (kho) {
      for (const size of sizes) {
        for (const color of colors) {
          if ((kho[`${size}|${color}`] ?? 0) > 0) return { size, color }
        }
      }
    }
    return { size: sizes[0] ?? '', color: colors[0] ?? '' }
  }

  // Mua nhanh từ thẻ sản phẩm: bỏ vào giỏ với biến thể còn hàng rồi sang giỏ
  // hàng — ở đó khách đổi lại size được nếu muốn.
  const handleBuyNow = async (product: ApiProduct) => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    setBuyNowBusyId(product.id)
    setError('')
    try {
      const chiTiet = await getProductByHandle(product.handle)
      const { size, color } = bienTheMuaNhanh(chiTiet)
      if (!size || !color) throw new Error('Sản phẩm chưa khai size/màu để mua nhanh')
      syncCart(await addToCart({ productId: product.id, size, color, quantity: 1 }))
      toast(`Đã thêm ${product.name} (size ${size} · ${color}) - đổi size ngay trong giỏ nếu cần`)
      router.push('/dashboard/customer/cart')
    } catch (e: any) {
      toast(e.message || 'Không thêm được vào giỏ', 'error')
      setBuyNowBusyId(null)
    }
  }

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
          <label className="flex items-center gap-2 mb-2 group">
            <input type="radio" checked={selectedCollection === 'all'} onChange={() => setSelectedCollection('all')} className="w-4 h-4 cursor-pointer" />
            <span className="text-sm text-foreground group-hover:text-accent transition-colors">Tất cả sản phẩm</span>
          </label>
          {(collections || []).map((col) => (
            <label key={col.id} className="flex items-center gap-2 mb-2 group">
              <input type="radio" checked={selectedCollection === col.slug} onChange={() => setSelectedCollection(col.slug)} className="w-4 h-4 cursor-pointer" />
              <span className="text-sm text-foreground group-hover:text-accent transition-colors capitalize">{col.name}</span>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex flex-col h-full bg-card rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-secondary w-full aspect-[3/4]" />
                      <div className="p-3 flex flex-col flex-grow space-y-2 mt-2">
                        <div className="h-4 bg-secondary rounded w-full" />
                        <div className="h-4 bg-secondary rounded w-2/3" />
                        <div className="mt-auto pt-2">
                          <div className="h-4 bg-secondary rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6">Hiển thị {products.length} sản phẩm</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {(products || []).map((product) => (
                      <ProductCard
                        key={product.handle}
                        product={product}
                        wished={isWishlisted(product.id)}
                        wishlistBusy={wishlistBusyId === product.id}
                        onWishlistToggle={handleWishlist}
                        onBuyNow={handleBuyNow}
                        buyNowBusy={buyNowBusyId === product.id}
                      />
                    ))}
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
