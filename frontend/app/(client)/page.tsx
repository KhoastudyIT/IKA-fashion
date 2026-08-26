'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, Truck, ShieldCheck, RefreshCcw, Headphones, ArrowRight, Quote } from 'lucide-react'
import { getProducts, getNews, ApiProduct, Article } from '@/api'
import ProductCard from '@/components/ProductCard'

/* ───────── Banner Data ───────── */
const BANNERS = [
  {
    image: '/banners/banner-hero.jpeg',
    imageMobile: '/banners/banner-hero-mobile.jpeg',
    subtitle: 'Bộ Sưu Tập Mới 2026',
    title: 'Phong Cách\nĐẳng Cấp',
    description: 'Khám phá bộ sưu tập thời trang cao cấp với công nghệ vải tiên tiến, thiết kế tinh tế phù hợp với phong cách sống hiện đại.',
    cta: 'KHÁM PHÁ NGAY',
    href: '/products',
  },
  {
    image: '/banners/banner-summer.jpeg',
    subtitle: 'Summer Collection',
    title: 'Thoáng Mát\nSuốt Ngày Dài',
    description: 'Công nghệ AirDry™ thoát ẩm nhanh 3x, giữ bạn luôn thoải mái trong mọi hoạt động dưới nắng hè.',
    cta: 'XEM BỘ SƯU TẬP',
    href: '/products?collection=ao-thun',
  },
  {
    image: '/banners/banner-arrivals.jpeg',
    subtitle: 'Ưu Đãi Đặc Biệt',
    title: 'Giảm Đến 40%\nToàn Bộ Sản Phẩm',
    description: 'Cơ hội sở hữu thời trang chất lượng với giá ưu đãi. Áp dụng cho đơn hàng từ 500.000đ.',
    cta: 'MUA NGAY',
    href: '/khuyen-mai',
  },
]

/* ───────── Testimonials ───────── */
const TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Tuấn',
    role: 'Nhân viên văn phòng',
    content: 'Áo polo IKA mặc rất thoáng mát, đi làm cả ngày không hề bí. Chất vải co giãn tốt, form áo vừa vặn. Mình đã mua thêm 3 cái màu khác!',
    rating: 5,
    avatar: '👨‍💼',
  },
  {
    name: 'Trần Hoàng Nam',
    role: 'Doanh nhân',
    content: 'Quần âu IKA giữ phom rất tốt dù giặt nhiều lần. Công nghệ FlexFit™ co giãn nhẹ nên ngồi rất thoải mái. Giá thành cũng hợp lý so với chất lượng.',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    name: 'Phạm Đức Huy',
    role: 'Sinh viên',
    content: 'Áo thun trắng IKA là món đồ mình mặc nhiều nhất. Vải mềm mịn, nhanh khô sau khi giặt. Ship hàng nhanh, đóng gói cẩn thận nữa!',
    rating: 4,
    avatar: '🧑‍🎓',
  },
]

/* ───────── Instagram Gallery (dùng ảnh sản phẩm thật) ───────── */
const INSTAGRAM_IMAGES = [
  '/products/ao-polo-white.png',
  '/products/ao-thun-trang.png',
  '/products/quan-kaki.png',
  '/products/ao-polo-black.png',
  '/products/ao-thun-xanh.png',
  '/products/quan-xam.png',
]

/* ───────── Carousel Utilities ───────── */
const CAROUSEL_SCROLLBAR_CLASSES =
  '[&::-webkit-scrollbar]:h-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/15'

const CarouselArrow = ({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`absolute ${direction === 'left' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/30 backdrop-blur-md text-white hover:bg-black/50 rounded-full flex items-center justify-center md:hidden shadow-md`}
    aria-label={direction === 'left' ? 'Cuộn trái' : 'Cuộn phải'}
  >
    {direction === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
  </button>
)

export default function HomePage() {
  /* ── Banner Slider State ── */
  const [currentBanner, setCurrentBanner] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  /* ── Mobile Carousel Refs ── */
  const collectionsRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const newsRef = useRef<HTMLDivElement>(null)

  const scrollCollections = (dir: 'left' | 'right') => {
    if (collectionsRef.current) {
      collectionsRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
    }
  }

  const scrollReviews = (dir: 'left' | 'right') => {
    if (reviewsRef.current) {
      reviewsRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
    }
  }

  const scrollNews = (dir: 'left' | 'right') => {
    if (newsRef.current) {
      newsRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
    }
  }

  /* ── Featured Products ── */
  const [bestSellers, setBestSellers] = useState<ApiProduct[]>([])
  const [newArrivals, setNewArrivals] = useState<ApiProduct[]>([])

  /* ── Tin tức mới nhất ── */
  const [latestNews, setLatestNews] = useState<Article[]>([])

  const nextBanner = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentBanner((prev) => (prev + 1) % BANNERS.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [isTransitioning])

  const prevBanner = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentBanner((prev) => (prev - 1 + BANNERS.length) % BANNERS.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [isTransitioning])

  /* Auto-slide every 5s */
  useEffect(() => {
    const timer = setInterval(nextBanner, 5000)
    return () => clearInterval(timer)
  }, [nextBanner])

  /* Fetch products */
  useEffect(() => {
    getProducts({ sort: 'sold', limit: 4 })
      .then((res) => setBestSellers(res.items))
      .catch(() => { })

    getProducts({ sort: 'newest', limit: 4 })
      .then((res) => setNewArrivals(res.items))
      .catch(() => { })

    getNews({ limit: 3 })
      .then((res) => setLatestNews(res.items))
      .catch(() => { })
  }, [])

  const banner = BANNERS[currentBanner]

  return (
    <main className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════
          1. HERO BANNER SLIDER
      ═══════════════════════════════════════════════ */}
      <section className="relative h-[85vh] min-h-[500px] overflow-hidden">
        {/* Background Images */}
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === currentBanner ? 1 : 0 }}
          >
            <picture>
              {b.imageMobile && (
                <source media="(max-width: 767px)" srcSet={b.imageMobile} />
              )}
              <img
                src={b.image}
                alt={b.title}
                className="w-full h-full object-cover object-top"
              />
            </picture>
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div
              className="max-w-xl transition-all duration-500"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
              }}
            >
              <p className="text-xs sm:text-sm font-sans tracking-[0.3em] text-amber-300 uppercase mb-4">
                {banner.subtitle}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-semibold text-white leading-tight whitespace-pre-line mb-6">
                {banner.title}
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-8 leading-relaxed font-light max-w-md">
                {banner.description}
              </p>
              <Link
                href={banner.href}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-accent-foreground font-sans text-sm font-semibold tracking-wide hover:bg-amber-400 transition-all duration-300 rounded shadow-lg hover:shadow-xl"
              >
                {banner.cta}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevBanner}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all"
          aria-label="Banner trước"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextBanner}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all"
          aria-label="Banner tiếp"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsTransitioning(true)
                setCurrentBanner(i)
                setTimeout(() => setIsTransitioning(false), 600)
              }}
              className={`h-2 rounded-full transition-all duration-300 ${i === currentBanner
                ? 'w-8 bg-accent'
                : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. SERVICE HIGHLIGHTS BAR
      ═══════════════════════════════════════════════ */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {[
              { icon: Truck, title: 'Giao Tiêu Chuẩn', desc: 'Miễn phí toàn quốc' },
              { icon: ShieldCheck, title: 'Cam Kết Chính Hãng', desc: 'Sản phẩm 100% authentic' },
              { icon: RefreshCcw, title: 'Đổi Trả 7 Ngày', desc: 'Miễn phí, không lý do' },
              { icon: Headphones, title: 'Hỗ Trợ 24/7', desc: 'Hotline: 0123 456 789' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 py-6 px-6">
                <item.icon size={28} className="text-accent flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. FEATURED COLLECTIONS
      ═══════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
              Bộ Sưu Tập
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
              Khám Phá Danh Mục Sản Phẩm
            </h2>
          </div>

          <div className="relative group">
            <CarouselArrow direction="left" onClick={() => scrollCollections('left')} />
            <div
              ref={collectionsRef}
              className={`flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-6 md:pb-0 ${CAROUSEL_SCROLLBAR_CLASSES} -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0`}
            >
              {[
                {
                  title: 'Áo Thun',
                  description: 'Vải mát, nhanh khô, công nghệ AirDry™ thoáng khí',
                  href: '/products?collection=ao-thun',
                  image: '/products/ao-thun-trang.png',
                  count: 'Từ 199.000đ',
                },
                {
                  title: 'Áo Polo & Sơ Mi',
                  description: 'Khí chất trưởng thành, thoải mái mặc đi làm',
                  href: '/products?collection=ao-polo',
                  image: '/products/ao-polo-white.png',
                  count: 'Từ 349.000đ',
                },
                {
                  title: 'Quần & Kaki',
                  description: 'Bền bỉ, tôn dáng, công nghệ co giãn FlexFit™',
                  href: '/products?collection=quan',
                  image: '/products/quan-kaki.png',
                  count: 'Từ 399.000đ',
                },
              ].map((collection) => (
                <Link key={collection.title} href={collection.href} className="w-[80vw] max-w-[300px] snap-center shrink-0 flex-none md:w-auto md:max-w-none">
                  <div className="group cursor-pointer relative overflow-hidden rounded-lg">
                    <div className="aspect-[3/4] bg-secondary overflow-hidden">
                      <img
                        src={collection.image}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <span className="text-xs tracking-widest text-accent font-medium uppercase">
                        {collection.count}
                      </span>
                      <h3 className="text-2xl font-heading font-semibold mt-1 mb-2 group-hover:text-accent transition-colors">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-white/70 font-light">
                        {collection.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        Xem ngay <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <CarouselArrow direction="right" onClick={() => scrollCollections('right')} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. BEST SELLERS (from API)
      ═══════════════════════════════════════════════ */}
      {bestSellers.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
                  Bán Chạy Nhất
                </p>
                <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
                  Sản Phẩm Được Yêu Thích
                </h2>
              </div>
              <Link
                href="/products?sort=sold"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} badge="HOT" />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products?sort=sold"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                Xem tất cả sản phẩm <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          5. PROMO BANNER (full-width)
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left: Image */}
          <div className="relative h-80 md:h-auto">
            <img
              src="/banners/banner-promo.jpeg"
              alt="Khuyến mãi"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Right: Content */}
          <div className="flex items-center justify-center bg-foreground text-primary-foreground py-16 px-8 lg:px-16">
            <div className="max-w-md text-center md:text-left">
              <p className="text-xs tracking-[0.3em] text-accent uppercase mb-4">
                Ưu Đãi Có Hạn
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-semibold mb-4 leading-tight">
                Mua 2 Giảm Thêm 10%
              </h2>
              <p className="text-primary-foreground/70 mb-8 font-light leading-relaxed">
                Áp dụng cho tất cả sản phẩm Polo & Sơ Mi. Cơ hội tuyệt vời để làm mới tủ đồ công sở của bạn với mức giá không thể tốt hơn.
              </p>
              <Link
                href="/khuyen-mai"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-accent-foreground font-sans text-sm font-semibold tracking-wide hover:bg-amber-400 transition-all rounded"
              >
                XEM NGAY <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. NEW ARRIVALS (from API)
      ═══════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
                  Hàng Mới Về
                </p>
                <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
                  Sản Phẩm Mới Nhất
                </h2>
              </div>
              <Link
                href="/products?sort=newest"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} badge="MỚI" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          7. WHY IKA - BRAND VALUES
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-foreground text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
              Giá Trị Cốt Lõi
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
              Tại Sao Chọn IKA Fashion
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              {
                icon: '🧪',
                title: 'Công Nghệ Vải',
                description: 'AirDry™ thoát ẩm 3x, ColorLock™ giữ màu 50 lần giặt, FlexFit™ co giãn 4 chiều, EasyCare™ kháng nhăn.',
              },
              {
                icon: '✂️',
                title: 'Thiết Kế Tinh Tế',
                description: 'Form dáng chuẩn Châu Á, đường may tỉ mỉ, chi tiết tối giản — phong cách vượt thời gian.',
              },
              {
                icon: '💰',
                title: 'Giá Trị Xứng Đáng',
                description: 'Chất lượng cao cấp, mức giá bình dân. Cam kết giá tốt nhất thị trường cho cùng phân khúc.',
              },
              {
                icon: '🌿',
                title: 'Thân Thiện Môi Trường',
                description: 'Bao bì tái chế, quy trình sản xuất tiết kiệm nước. Thời trang đẹp bắt đầu từ ý thức sống xanh.',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-5 text-xl md:text-2xl group-hover:bg-accent/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-sm md:text-lg font-heading font-semibold mb-2 md:mb-3">
                  {feature.title}
                </h3>
                <p className="text-primary-foreground/60 text-[0.6875rem] md:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. CUSTOMER TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
              Đánh Giá
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
              Khách Hàng Nói Gì
            </h2>
          </div>

          <div className="relative group">
            <CarouselArrow direction="left" onClick={() => scrollReviews('left')} />
            <div
              ref={reviewsRef}
              className={`flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 ${CAROUSEL_SCROLLBAR_CLASSES} -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0`}
            >
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="relative bg-card border border-border rounded-xl p-6 md:p-8 hover:shadow-lg transition-shadow w-[80vw] max-w-[300px] snap-center shrink-0 flex-none md:w-auto md:max-w-none"
                >
                  <Quote size={32} className="text-accent/20 absolute top-6 right-6" />
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < t.rating ? 'text-accent fill-accent' : 'text-border'}
                      />
                    ))}
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-xl">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <CarouselArrow direction="right" onClick={() => scrollReviews('right')} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. BLOG PREVIEW — ẩn hẳn khi chưa có bài viết nào
      ═══════════════════════════════════════════════ */}
      {latestNews.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
                  Tạp Chí
                </p>
                <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
                  Tin Tức & Cảm Hứng
                </h2>
              </div>
              <Link
                href="/tin-tuc"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>

            <div className="relative group">
              <CarouselArrow direction="left" onClick={() => scrollNews('left')} />
              <div
                ref={newsRef}
                className={`flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 ${CAROUSEL_SCROLLBAR_CLASSES} -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0`}
              >
                {latestNews.map((post) => (
                  <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="w-[80vw] max-w-[300px] snap-center shrink-0 flex-none md:w-auto md:max-w-none">
                    <article className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                      <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-secondary">
                        {post.img && (
                          <img
                            src={post.img}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[0.625rem] tracking-widest text-accent font-semibold uppercase">
                            {post.category?.name ?? 'TIN TỨC'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {post.publishDate ? post.publishDate.split('-').reverse().join('/') : ''}
                          </span>
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground font-light line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              <CarouselArrow direction="right" onClick={() => scrollNews('right')} />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          10. INSTAGRAM / LOOKBOOK GALLERY
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
              @IKA.Fashion
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
              Lookbook & Phong Cách
            </h2>
            <p className="text-muted-foreground mt-3 text-sm font-light">
              Cảm hứng phối đồ từ cộng đồng IKA Fashion
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {INSTAGRAM_IMAGES.map((src, i) => (
              <Link key={i} href="/products" className="group relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={src}
                  alt={`Lookbook ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                    +
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          11. NEWSLETTER
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-foreground to-neutral-800">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-sans tracking-[0.3em] text-accent uppercase mb-3">
            Bản Tin
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-white mb-4">
            Nhận Ưu Đãi Độc Quyền
          </h2>
          <p className="text-white/60 mb-8 font-light leading-relaxed">
            Đăng ký nhận bản tin để không bỏ lỡ các chương trình khuyến mãi, bộ sưu tập mới và mẹo phối đồ từ IKA Fashion.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent backdrop-blur-sm"
              required
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-accent text-accent-foreground font-sans text-sm font-semibold tracking-wide hover:bg-amber-400 transition-all rounded-lg whitespace-nowrap"
            >
              Đăng Ký
            </button>
          </form>
          <p className="text-white/30 text-xs mt-4">
            Chúng tôi cam kết không gửi spam. Bạn có thể hủy đăng ký bất cứ lúc nào.
          </p>
        </div>
      </section>
    </main>
  )
}
