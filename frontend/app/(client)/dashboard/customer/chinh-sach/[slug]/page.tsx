import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { POLICIES, getPolicy } from '@/components/policies'

export function generateStaticParams() {
  return POLICIES.map(p => ({ slug: p.slug }))
}

export default async function DashboardPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const policy = getPolicy(slug)
  if (!policy) notFound()

  const { Content } = policy
  const others = POLICIES.filter(p => p.slug !== policy.slug)

  return (
    <>
      <Link
        href="/dashboard/customer/chinh-sach"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Tất cả chính sách
      </Link>

      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-3">
        {policy.title}
      </h1>
      <p className="text-muted-foreground mb-8">{policy.desc}</p>

      {/* Nội dung gốc có sẵn container max-w-7xl bên trong nên tự co lại vừa
          cột của dashboard, không cần chỉnh gì thêm. */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <Content />
      </div>

      <div className="mt-10 pt-8 border-t border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Xem thêm
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {others.map(p => (
            <Link
              key={p.slug}
              href={`/dashboard/customer/chinh-sach/${p.slug}`}
              className="px-4 py-3 rounded-lg border border-border text-sm text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              {p.title}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
