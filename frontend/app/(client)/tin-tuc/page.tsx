'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { getNews, getNewsCategories, Article, NewsCategory } from '@/api'

const LIMIT = 9

const viDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

export default function NewsListPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getNews({ category: category || undefined, page, limit: LIMIT })
      setArticles(res.items)
      setTotalPages(res.pagination?.totalPages ?? 1)
    } catch (err: any) {
      setError(err.message || 'Không tải được bài viết')
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    // Chỉ hiện danh mục đã có bài đăng, tránh lọc ra trang trống
    getNewsCategories()
      .then(list => setCategories(list.filter(c => c.articleCount > 0)))
      .catch(() => {})
  }, [])

  // Bài đầu chỉ làm nổi bật ở trang 1 khi không lọc — sang trang 2 mà vẫn
  // phóng to bài đầu thì trông như bài quan trọng nhất, gây hiểu nhầm.
  const showFeatured = page === 1 && !category && articles.length > 0
  const featured = showFeatured ? articles[0] : null
  const rest = showFeatured ? articles.slice(1) : articles

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Tiêu đề trang */}
      <div className="text-center mb-12 space-y-4">
        <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase">Tạp Chí</p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
          Tạp Chí Thời Trang
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
          Cập nhật những xu hướng mới nhất, cẩm nang phối đồ và những câu chuyện truyền cảm hứng từ IKA.
        </p>
      </div>

      {/* Lọc theo danh mục */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => { setCategory(''); setPage(1) }}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
              category === '' ? 'bg-foreground text-primary-foreground' : 'bg-secondary text-foreground hover:bg-muted'
            }`}
          >
            Tất cả
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => { setCategory(c.slug); setPage(1) }}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
                category === c.slug ? 'bg-foreground text-primary-foreground' : 'bg-secondary text-foreground hover:bg-muted'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-center mb-8 text-sm">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary rounded-xl aspect-[16/10] mb-5" />
              <div className="h-4 bg-secondary rounded mb-3" />
              <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-6 text-lg">Chưa có bài viết nào.</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
          >
            Khám Phá Sản Phẩm
          </Link>
        </div>
      ) : (
        <>
          {/* Bài nổi bật */}
          {featured && (
            <Link href={`/tin-tuc/${featured.slug}`} className="group block mb-16">
              <div className="relative rounded-xl overflow-hidden">
                <div className="aspect-[21/9] bg-secondary overflow-hidden">
                  {featured.img && (
                    <img
                      src={featured.img}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                  <div className="flex items-center gap-3 mb-3">
                    {featured.category && (
                      <span className="text-[0.6875rem] font-semibold tracking-widest text-accent uppercase">
                        {featured.category.name}
                      </span>
                    )}
                    <span className="text-xs text-white/60">{viDate(featured.publishDate)}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-3 group-hover:text-accent transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-sm sm:text-base text-white/70 font-light max-w-2xl line-clamp-2">
                    {featured.excerpt}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Các bài còn lại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {rest.map(post => (
              <Link href={`/tin-tuc/${post.slug}`} key={post.id} className="group cursor-pointer flex flex-col h-full">
                <div className="relative bg-secondary rounded-xl overflow-hidden mb-5 aspect-[16/10] w-full shrink-0">
                  {post.img && (
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>

                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.6875rem] font-semibold tracking-widest text-accent uppercase">
                      {post.category?.name ?? 'TIN TỨC'}
                    </span>
                    <span className="text-xs text-muted-foreground">{viDate(post.publishDate)}</span>
                  </div>

                  <h2 className="text-xl font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-sm text-muted-foreground line-clamp-3 font-sans flex-1">
                    {post.excerpt}
                  </p>

                  <div className="pt-2 text-sm font-semibold text-foreground group-hover:text-accent transition-colors inline-flex items-center">
                    Đọc tiếp
                    <span className="ml-2 transform transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-16">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-5 py-2.5 border border-border rounded text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Trước
              </button>
              <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-5 py-2.5 border border-border rounded text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
