'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import ProductCard from '@/components/ProductCard'
import { useSession } from '@/auth-client'
import { getProducts, addToCart, ApiProduct } from '@/api'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<ApiProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getProducts({ search: query, limit: 50 })
      .then((res) => setResults(res.items))
      .catch((e) => setMessage(e.message))
      .finally(() => setIsLoading(false))
  }, [query])

  const handleAddToCart = async (product: ApiProduct) => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    try {
      await addToCart({ productId: product.id, size: product.sizes[0], color: product.colors[0], quantity: 1 })
      setMessage(`Đã thêm "${product.name}" vào giỏ ✓`)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-heading font-semibold text-foreground mb-2">Kết Quả Tìm Kiếm</h1>
            <p className="text-muted-foreground">
              {query && <>Tìm kiếm: <span className="text-accent font-medium">&quot;{query}&quot;</span></>}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {message && <p className="text-accent text-sm mb-6 font-medium">{message}</p>}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-secondary rounded h-96 mb-4" />
                  <div className="h-4 bg-secondary rounded mb-2" />
                  <div className="h-4 bg-secondary rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-8">
                Tìm thấy {results.length} sản phẩm
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6 text-lg">
                {query ? `Không tìm thấy kết quả cho "${query}"` : 'Nhập từ khóa để tìm sản phẩm'}
              </p>
              <Link href="/products" className="text-accent hover:underline font-medium">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
