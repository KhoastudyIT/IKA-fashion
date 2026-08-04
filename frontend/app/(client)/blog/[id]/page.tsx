import Link from 'next/link'
import { notFound } from 'next/navigation'
import { blogPosts, getPost } from '../posts'

export function generateStaticParams() {
  return blogPosts.map(post => ({ id: post.id }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPost(id)
  if (!post) notFound()

  const related = blogPosts.filter(p => p.id !== post.id)

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative w-full h-[50vh] min-h-[320px] max-h-[520px] overflow-hidden">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
          <div className="max-w-5xl mx-auto">
            <Link href="/blog" className="text-sm text-accent hover:underline mb-4 inline-block">
              ← Quay lại Tạp Chí
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
                {post.category}
              </span>
              <span className="text-xs text-white/60">{post.date}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-lg text-muted-foreground font-sans mb-10 leading-relaxed border-l-4 border-accent pl-6 italic">
          {post.excerpt}
        </p>

        <div className="space-y-6">
          {post.body.map((paragraph, i) => (
            <p key={i} className="text-foreground/90 leading-[1.85] font-sans text-base">
              {paragraph}
            </p>
          ))}
        </div>

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

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="bg-secondary">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-8">Bài viết khác</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {related.map(p => (
                <Link key={p.id} href={`/blog/${p.id}`} className="group flex gap-5 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-32 sm:w-40 shrink-0 overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="py-4 pr-4 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] font-semibold tracking-widest text-accent uppercase">
                      {p.category}
                    </span>
                    <h3 className="text-sm font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors mt-1">
                      {p.title}
                    </h3>
                    <span className="text-xs text-muted-foreground mt-2">{p.date}</span>
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
