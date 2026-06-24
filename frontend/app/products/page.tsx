'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getProducts, getCollections, ApiProduct, Collection, ProductQuery } from '@/api'

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating'

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [maxPrice, setMaxPrice] = useState(1000000)
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const [products, setProducts] = useState<ApiProduct[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tải danh mục 1 lần
  useEffect(() => {
    getCollections().then(setCollections).catch(() => {})
  }, [])

  // Tải sản phẩm mỗi khi filter thay đổi
  useEffect(() => {
    setLoading(true)
    setError('')
    const query: ProductQuery = {
      sort: sortBy,
      priceMax: maxPrice,
      limit: 50,
    }
    if (selectedCollection !== 'all') query.collection = selectedCollection

    getProducts(query)
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message || 'Không tải được sản phẩm'))
      .finally(() => setLoading(false))
  }, [sortBy, maxPrice, selectedCollection])

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground mb-4">Sản Phẩm</h1>
            <p className="text-muted-foreground font-light">
              Khám phá bộ sưu tập thời trang chất lượng cao với công nghệ vải tiên tiến
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className={`w-full md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
              <div className="space-y-6 sticky top-24">
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
                    {collections.map((col) => (
                      <label key={col.slug} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={selectedCollection === col.slug} onChange={() => setSelectedCollection(col.slug)} className="w-4 h-4 cursor-pointer" />
                        <span className="text-sm text-foreground">{col.name} ({col.productCount})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <div className="md:hidden mb-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <span>Bộ Lọc</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
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
                    {products.map((product) => (
                      <Link key={product.handle} href={`/products/${product.handle}`}>
                        <div className="group cursor-pointer">
                          <div className="bg-secondary rounded-lg overflow-hidden mb-4 h-80 flex items-center justify-center relative">
                            <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-foreground">{product.price.toLocaleString()} đ</span>
                            <span className="text-accent group-hover:underline text-sm font-medium">Chi Tiết →</span>
                          </div>
                        </div>
                      </Link>
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
    </>
  )
}
