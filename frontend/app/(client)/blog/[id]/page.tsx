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
    <div className="container mx-auto py-16 px-4 md:px-6 min-h-screen">
      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-sm text-accent hover:underline">
          ← Quay lại Tạp Chí
        </Link>

        <div className="mt-6 mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
              {post.category}
            </span>
            <span className="text-xs text-muted-foreground">{post.date}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            {post.title}
          </h1>
          <p className="text-muted-foreground font-sans">{post.excerpt}</p>
        </div>

        <div className="rounded overflow-hidden mb-10 bg-secondary">
          <img src={post.image} alt={post.title} className="w-full h-auto max-h-[480px] object-cover" />
        </div>

        <div className="space-y-5">
          {post.body.map((paragraph, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed font-sans">
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

      {related.length > 0 && (
        <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-border">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-6">Bài viết khác</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map(p => (
              <Link key={p.id} href={`/blog/${p.id}`} className="group flex gap-4">
                <div className="w-24 h-24 rounded overflow-hidden bg-secondary shrink-0">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold tracking-widest text-accent uppercase">
                    {p.category}
                  </span>
                  <h3 className="text-sm font-heading font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {p.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
