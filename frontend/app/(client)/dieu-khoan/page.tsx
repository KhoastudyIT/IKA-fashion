import Content from '@/components/policies/dieu-khoan'
import { getPolicy } from '@/components/policies'

// Banner ảnh đã bỏ: nội dung này còn được nhúng thẳng trong khu tài khoản,
// nên phần đầu trang phải nhẹ để dùng chung được ở cả hai nơi.
export default function TermsOfServicePage() {
  const policy = getPolicy('dieu-khoan')!

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-3">
          {policy.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{policy.desc}</p>
      </div>

      <Content />
    </main>
  )
}
