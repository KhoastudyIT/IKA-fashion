import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground mb-4">
              Về IKA
            </h1>
            <p className="text-lg text-muted-foreground">
              Khám phá câu chuyện đằng sau thương hiệu thời trang Việt Nam IKA
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            {/* Our Story */}
            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">Câu Chuyện Của Chúng Tôi</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                IKA đại diện cho một cam kết về thời trang chất lượng cao và công nghệ vải tiên tiến. Được thành lập 
                với niềm đam mê phục vụ khách hàng Việt Nam, chúng tôi cung cấp những sản phẩm thời trang bền bỉ, 
                thoải mái và không lỗi mốt.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Mỗi sản phẩm trong bộ sưu tập của chúng tôi được lựa chọn cẩn thận để đáp ứng các tiêu chuẩn 
                chất lượng, độ bền và sự tiện dụng. Chúng tôi tin rằng thời trang tốt không phải là dư thừa, 
                mà là sự cân bằng hoàn hảo giữa chức năng, phong cách và thoải mái.
              </p>
            </section>

            {/* Our Values */}
            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mb-8">Các Giá Trị Của Chúng Tôi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: 'Chất Lượng',
                    description: 'Sử dụng vải công nghệ cao, bền bỉ và thoải mái để mặc hàng ngày',
                  },
                  {
                    title: 'Giá Cạnh Tranh',
                    description: 'Cung cấp những sản phẩm tốt nhất với mức giá hợp lý',
                  },
                  {
                    title: 'Không Lỗi Mốt',
                    description:
                      'Các sản phẩm được thiết kế để tồn tại lâu dài và không bị lỗi mốt',
                  },
                  {
                    title: 'Bền Bỉ',
                    description: 'Cam kết chất lượng cao cho các sản phẩm có thời gian sử dụng dài',
                  },
                ].map((value) => (
                  <div key={value.title}>
                    <h3 className="font-heading font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact CTA */}
            <section className="bg-secondary rounded p-8 text-center">
              <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">Liên Hệ Với Chúng Tôi</h2>
              <p className="text-muted-foreground mb-6">
                Có câu hỏi về sản phẩm hoặc cần tư vấn chọn các item phù hợp?
              </p>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
              >
                Liên Hệ
              </Link>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
