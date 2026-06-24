import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background" />
          
          <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="mb-6 space-y-2">
              <p className="text-xs sm:text-sm font-sans tracking-widest text-muted-foreground uppercase">
                Thương Hiệu Thời Trang Việt Nam
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-semibold text-foreground leading-tight">
                IKA Fashion
              </h1>
            </div>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              Khám phá bộ sưu tập thời trang chất lượng cao với công nghệ vải tiên tiến, thiết kế hiện đại phù hợp với cuộc sống Việt Nam.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/products"
                className="px-8 py-3 bg-foreground text-primary-foreground font-sans text-sm font-medium tracking-wide hover:opacity-90 transition-opacity rounded"
              >
                KHÁM PHÁ NGAY
              </Link>
              <Link
                href="/about"
                className="px-8 py-3 border border-foreground text-foreground font-sans text-sm font-medium tracking-wide hover:bg-foreground hover:text-primary-foreground transition-colors rounded"
              >
                TÌM HIỂU THÊM
              </Link>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <svg
              className="w-6 h-6 text-accent animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Featured Collections */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase mb-4">
                Bộ Sưu Tập
              </p>
              <h2 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground">
                Các Bộ Sưu Tập Nổi Bật
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Collection Cards */}
              {[
                {
                  title: 'Áo Thun & Ba Lỗ',
                  description: 'Vải mát, nhanh khô, công nghệ AirDry™ thoảng khí',
                  href: '/products?collection=ao-thun',
                  icon: '👕',
                },
                {
                  title: 'Áo Polo & Sơ Mi',
                  description: 'Khí chất trưởng thành, thoải mái mặc đi làm',
                  href: '/products?collection=ao-polo',
                  icon: '👔',
                },
                {
                  title: 'Quần & Kaki',
                  description: 'Bền bỉ, tôn dáng, công nghệ co giãn FlexFit™',
                  href: '/products?collection=quan',
                  icon: '👖',
                },
              ].map((collection) => (
                <Link key={collection.title} href={collection.href}>
                  <div className="group cursor-pointer">
                    <div className="bg-secondary rounded h-64 flex items-center justify-center text-6xl mb-4 group-hover:bg-muted transition-colors">
                      {collection.icon}
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {collection.title}
                    </h3>
                    <p className="text-muted-foreground text-sm font-light">
                      {collection.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why IKA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground">
                Tại Sao Chọn IKA
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Chất Lượng Cao', description: 'Vải công nghệ, thoát ẩm nhanh, mặc thoải mái' },
                { title: 'Giá Cạnh Tranh', description: 'Giá thành hợp lý, chất lượng tốt nhất' },
                { title: 'Công Nghệ Vải', description: 'AirDry™, ColorLock™, FlexFit™, EasyCare™' },
                { title: 'Hỗ Trợ Tốt', description: 'Tư vấn mua hàng, hỗ trợ sau bán tốt' },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent-foreground text-lg font-bold">✓</span>
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground mb-4">
              Nhận Thông Tin Mới
            </h2>
            <p className="text-muted-foreground mb-8 font-light">
              Đăng ký nhận bản tin của chúng tôi để nhận ưu đãi độc quyền và thông tin về bộ sưu tập mới.
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-foreground text-primary-foreground font-sans text-sm font-medium tracking-wide hover:opacity-90 transition-opacity rounded whitespace-nowrap"
              >
                Đăng Ký
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
