import Link from 'next/link'
import { Award, Users, Lightbulb, Heart, Truck, ShieldCheck, RefreshCcw, Headphones } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=80"
          alt="Về IKA Fashion"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-4">Về Chúng Tôi</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-semibold leading-tight mb-6">
              IKA Fashion — <br />Thời Trang Cho<br />
              <span className="text-accent">Người Việt Hiện Đại</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-xl font-light">
              Chúng tôi tạo ra những bộ trang phục chất lượng cao, dễ phối, với mức giá bình dân — để mỗi ngày bước ra đường, bạn luôn tự tin nhất.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ CÂU CHUYỆN THƯƠNG HIỆU ═══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image collage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-xl overflow-hidden">
                  <img src="/products/ao-polo-white.png" alt="Polo IKA" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden">
                  <img src="/products/quan-kaki.png" alt="Quần Kaki IKA" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="pt-8 space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden">
                  <img src="/products/ao-thun-trang.png" alt="Áo thun IKA" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-xl overflow-hidden">
                  <img src="/products/ao-polo-black.png" alt="Polo đen IKA" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Story content */}
            <div>
              <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">Câu Chuyện</p>
              <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground mb-6">
                Khởi Nguồn Từ Đam Mê, Phát Triển Bằng Chất Lượng
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  IKA Fashion được thành lập bởi những người trẻ Việt Nam với một sứ mệnh đơn giản: tạo ra thời trang nam chất lượng cao cấp mà ai cũng có thể sở hữu.
                </p>
                <p>
                  Chúng tôi nhận thấy rằng thị trường thời trang Việt Nam luôn thiếu vắng một thương hiệu nội địa có thể cung cấp sản phẩm vừa đẹp, vừa bền, vừa thoải mái — mà không đòi hỏi mức giá đắt đỏ của các thương hiệu quốc tế.
                </p>
                <p>
                  Từ ngày đầu tiên, IKA tập trung vào <strong className="text-foreground">ba yếu tố cốt lõi</strong>: công nghệ vải tiên tiến, thiết kế tối giản phù hợp dáng người Châu Á, và mức giá cạnh tranh nhất thị trường. Mỗi sản phẩm đều trải qua quy trình kiểm soát chất lượng nghiêm ngặt trước khi đến tay khách hàng.
                </p>
              </div>

              {/* Số liệu ấn tượng */}
              <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-border">
                <div>
                  <p className="text-3xl font-heading font-semibold text-accent">50+</p>
                  <p className="text-sm text-muted-foreground mt-1">Sản phẩm đa dạng</p>
                </div>
                <div>
                  <p className="text-3xl font-heading font-semibold text-accent">10K+</p>
                  <p className="text-sm text-muted-foreground mt-1">Khách hàng hài lòng</p>
                </div>
                <div>
                  <p className="text-3xl font-heading font-semibold text-accent">4.8★</p>
                  <p className="text-sm text-muted-foreground mt-1">Đánh giá trung bình</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ GIÁ TRỊ CỐT LÕI ═══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">Giá Trị</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
              Những Giá Trị Chúng Tôi Theo Đuổi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: 'Chất Lượng Hàng Đầu',
                description: 'Mỗi sản phẩm được kiểm tra kỹ lưỡng từ sợi vải, đường may đến form dáng — đảm bảo tiêu chuẩn cao nhất.',
              },
              {
                icon: Lightbulb,
                title: 'Đổi Mới Liên Tục',
                description: 'Công nghệ AirDry™, ColorLock™, FlexFit™, EasyCare™ — liên tục nghiên cứu để mang đến trải nghiệm mặc tốt hơn.',
              },
              {
                icon: Users,
                title: 'Khách Hàng Là Trung Tâm',
                description: 'Lắng nghe phản hồi, cải tiến sản phẩm, hỗ trợ tận tâm — mọi quyết định đều hướng đến sự hài lòng của bạn.',
              },
              {
                icon: Heart,
                title: 'Thời Trang Bền Vững',
                description: 'Sản phẩm bền bỉ, bao bì tái chế, quy trình sản xuất xanh — vì một tương lai thời trang có trách nhiệm.',
              },
            ].map((value) => (
              <div key={value.title} className="bg-card rounded-xl p-8 hover:shadow-lg transition-shadow group">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <value.icon size={24} className="text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CÔNG NGHỆ VẢI ═══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">Công Nghệ</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
              Công Nghệ Vải Độc Quyền
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto font-light">
              IKA không ngừng nghiên cứu và phát triển các công nghệ vải mới, mang đến trải nghiệm mặc vượt trội cho khách hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'AirDry™',
                tagline: 'Thoát ẩm siêu nhanh',
                description: 'Cấu trúc sợi vải đặc biệt giúp mồ hôi bay hơi nhanh gấp 3 lần vải thông thường. Giữ bạn luôn khô thoáng trong mọi hoạt động.',
                color: 'from-blue-500/10 to-cyan-500/10',
              },
              {
                name: 'ColorLock™',
                tagline: 'Giữ màu bền đẹp',
                description: 'Công nghệ nhuộm xâm nhập sâu vào sợi vải, giữ màu sắc tươi mới qua 50+ lần giặt. Không phai, không bạc dù phơi nắng.',
                color: 'from-purple-500/10 to-pink-500/10',
              },
              {
                name: 'FlexFit™',
                tagline: 'Co giãn 4 chiều',
                description: 'Sợi co giãn đan xen trong cấu trúc vải giúp bạn tự do vận động mà vải không bị biến dạng. Giữ phom dáng bền bỉ.',
                color: 'from-green-500/10 to-emerald-500/10',
              },
              {
                name: 'EasyCare™',
                tagline: 'Kháng nhăn thông minh',
                description: 'Xử lý bề mặt vải giúp hạn chế nhăn đến 80%. Lấy ra khỏi máy giặt, phơi khô là mặc — không cần ủi, tiết kiệm thời gian.',
                color: 'from-amber-500/10 to-orange-500/10',
              },
            ].map((tech) => (
              <div
                key={tech.name}
                className={`bg-gradient-to-br ${tech.color} border border-border rounded-xl p-8 hover:shadow-md transition-shadow`}
              >
                <h3 className="text-2xl font-heading font-semibold text-foreground mb-1">
                  {tech.name}
                </h3>
                <p className="text-sm text-accent font-medium mb-4">{tech.tagline}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CAM KẾT DỊCH VỤ ═══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-foreground text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">Cam Kết</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
              Dịch Vụ & Chính Sách
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: 'Giao Hàng Nhanh', desc: 'Miễn phí ship toàn quốc cho đơn từ 500.000đ. Giao trong 2-5 ngày.' },
              { icon: ShieldCheck, title: 'Chính Hãng 100%', desc: 'Cam kết mọi sản phẩm đều chính hãng IKA. Hoàn tiền 200% nếu phát hiện hàng giả.' },
              { icon: RefreshCcw, title: 'Đổi Trả Dễ Dàng', desc: 'Đổi trả miễn phí trong 7 ngày. Không cần lý do, chỉ cần sản phẩm còn nguyên tem.' },
              { icon: Headphones, title: 'Hỗ Trợ Tận Tâm', desc: 'Đội ngũ CSKH sẵn sàng hỗ trợ qua chat, điện thoại và email.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <item.icon size={24} className="text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-primary-foreground/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground mb-4">
            Sẵn Sàng Khám Phá?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto font-light leading-relaxed">
            Hãy để IKA đồng hành cùng phong cách của bạn. Khám phá bộ sưu tập đa dạng hoặc liên hệ nếu bạn cần tư vấn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-3.5 bg-foreground text-primary-foreground font-sans text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity rounded"
            >
              XEM SẢN PHẨM
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3.5 border border-foreground text-foreground font-sans text-sm font-semibold tracking-wide hover:bg-foreground hover:text-primary-foreground transition-colors rounded"
            >
              LIÊN HỆ TƯ VẤN
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
