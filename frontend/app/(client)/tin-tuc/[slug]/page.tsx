'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getArticle, getNews, Article } from '@/api'
import ArticleContent from '@/components/ArticleContent'

const viDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

export default function NewsDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const [article, setArticle] = useState<Article | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    setLoading(true)
    setNotFound(false)

    getArticle(slug)
      .then(found => {
        // Bỏ qua kết quả cũ nếu người dùng đã chuyển sang bài khác
        if (cancelled) return
        setArticle(found)
        return getNews({ limit: 5 }).then(res => {
          if (cancelled) return
          setRelated(res.items.filter(a => a.id !== found.id).slice(0, 4))
        })
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải bài viết...</p>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-heading font-semibold text-foreground mb-3">
          Không tìm thấy bài viết
        </h1>
        <p className="text-muted-foreground mb-8">
          Bài viết có thể đã bị gỡ hoặc đường dẫn không đúng.
        </p>
        <Link
          href="/tin-tuc"
          className="px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
        >
          ← Quay lại Tạp Chí
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative w-full h-[50vh] min-h-[320px] max-h-[520px] overflow-hidden bg-secondary">
        {article.img && (
          <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
          <div className="max-w-5xl mx-auto">
            <Link href="/tin-tuc" className="text-sm text-accent hover:underline mb-4 inline-block">
              ← Quay lại Tạp Chí
            </Link>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {article.category && (
                <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
                  {article.category.name}
                </span>
              )}
              <span className="text-xs text-white/60">{viDate(article.publishDate)}</span>
              <span className="text-xs text-white/60">· {article.author}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {article.excerpt && (
          <p className="text-lg text-muted-foreground font-sans mb-10 leading-relaxed border-l-4 border-accent pl-6 italic">
            {article.excerpt}
          </p>
        )}

        <ArticleContent content={article.content ?? ''} />

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Xem thêm sản phẩm phù hợp với gợi ý trong bài viết:
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-foreground text-primary-foreground font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Khám Phá Sản Phẩm
          </Link>
        </div>
      </article>

      {/* Bài viết khác */}
      {related.length > 0 && (
        <div className="bg-secondary">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-8">Bài viết khác</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {related.map(p => (
                <Link
                  key={p.id}
                  href={`/tin-tuc/${p.slug}`}
                  className="group flex gap-5 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-32 sm:w-40 shrink-0 overflow-hidden bg-secondary">
                    {p.img && (
                      <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <div className="py-4 pr-4 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] font-semibold tracking-widest text-accent uppercase">
                      {p.category?.name ?? 'TIN TỨC'}
                    </span>
                    <h3 className="text-sm font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors mt-1">
                      {p.title}
                    </h3>
                    <span className="text-xs text-muted-foreground mt-2">{viDate(p.publishDate)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
