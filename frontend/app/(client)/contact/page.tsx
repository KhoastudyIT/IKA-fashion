'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, Globe, ChevronDown } from 'lucide-react'
import { useSession } from '@/auth-client'
import { createContact, isMapEmbed, mapEmbedFromAddress } from '@/api'
import { useSettings } from '@/components/context/SettingsContext'

const FAQ_ITEMS = [
  {
    q: 'Tôi có thể đổi trả sản phẩm trong bao lâu?',
    a: 'IKA hỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ ngày nhận hàng. Sản phẩm cần giữ nguyên tem, nhãn mác và chưa qua sử dụng.',
  },
  {
    q: 'Thời gian giao hàng mất bao lâu?',
    a: 'Tùy hình thức bạn chọn: giao tiêu chuẩn 3–5 ngày làm việc (miễn phí), giao nhanh 1–2 ngày (30.000đ), giao hỏa tốc nhận trong ngày (60.000đ, chỉ TP. Hồ Chí Minh).',
  },
  {
    q: 'Làm sao để chọn đúng size?',
    a: 'Bạn có thể tham khảo bảng hướng dẫn chọn size trên trang sản phẩm. Nếu còn phân vân, hãy liên hệ hotline để được tư vấn trực tiếp.',
  },
  {
    q: 'IKA có cửa hàng offline không?',
    a: 'Hiện tại IKA chủ yếu bán hàng online. Chúng tôi đang xây dựng kế hoạch mở showroom tại Hà Nội và TP.HCM trong thời gian tới.',
  },
]

export default function ContactPage() {
  const { data: session } = useSession()
  const { settings } = useSettings()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  // Đã đăng nhập thì điền sẵn — khách không phải gõ lại thứ hệ thống đã biết.
  useEffect(() => {
    if (!session?.user) return
    setFormData((prev) => ({
      ...prev,
      name:  prev.name  || session.user.name  || '',
      email: prev.email || session.user.email || '',
      phone: prev.phone || session.user.phone || '',
    }))
  }, [session])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Endpoint công khai: khách chưa đăng nhập cũng gửi được. Trước đây form
      // chỉ gửi khi có session nhưng vẫn báo thành công, nên tin của khách vãng
      // lai biến mất không dấu vết.
      await createContact(formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 7000)
    } catch (err) {
      // Hiện đúng lý do từ backend (email sai, gửi quá nhanh, nội dung quá ngắn...)
      setError(err instanceof Error ? err.message : 'Không thể gửi tin nhắn. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <img
          src="/banners/banner-contact.jpeg"
          alt="Liên hệ IKA Fashion"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-4">Liên Hệ</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-semibold leading-tight mb-6 text-white">
              Chúng Tôi Luôn<br />
              <span className="text-accent drop-shadow-md">Sẵn Sàng Hỗ Trợ</span>
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed max-w-xl font-light">
              Có câu hỏi về sản phẩm, đơn hàng hay cần tư vấn phối đồ? Đội ngũ IKA luôn sẵn lòng giúp đỡ bạn.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ THÔNG TIN LIÊN HỆ CARDS ═══════════ */}
      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8 mb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Phone,
                title: 'Hotline',
                line1: settings.hotline,
                line2: 'Miễn phí cuộc gọi',
              },
              {
                icon: Mail,
                title: 'Email',
                line1: settings.email,
                line2: 'Phản hồi trong 24h',
              },
              {
                icon: MapPin,
                title: 'Showroom',
                line1: settings.address,
                line2: 'Ghé thăm trực tiếp',
              },
              {
                icon: Clock,
                title: 'Giờ làm việc',
                line1: settings.workingHours,
                line2: 'Ngoài giờ vui lòng nhắn tin',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border rounded-xl p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon size={22} className="text-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                  <p className="text-foreground text-sm">{item.line1}</p>
                  <p className="text-muted-foreground text-xs">{item.line2}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FORM + MAP ═══════════ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form — 3 cột */}
            <div className="lg:col-span-3">
              <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">Gửi Tin Nhắn</p>
              <h2 className="text-3xl font-heading font-semibold text-foreground mb-2">
                Liên Hệ Với Chúng Tôi
              </h2>
              <p className="text-muted-foreground text-sm mb-8 font-light">
                Điền thông tin bên dưới và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
              </p>

              {submitted ? (
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={28} className="text-accent" />
                  </div>
                  <p className="text-accent font-heading font-semibold text-lg mb-2">Cảm ơn đã liên hệ!</p>
                  <p className="text-muted-foreground text-sm">
                    Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 24 giờ.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Họ và tên <span className="text-accent">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email <span className="text-accent">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Số điện thoại <span className="text-muted-foreground font-normal">(không bắt buộc)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0912345678"
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Để lại số nếu bạn muốn được gọi lại nhanh hơn.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Chủ đề <span className="text-accent">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    >
                      <option value="">— Chọn chủ đề —</option>
                      <option value="Tư vấn sản phẩm">Tư vấn sản phẩm</option>
                      <option value="Hỏi về đơn hàng">Hỏi về đơn hàng</option>
                      <option value="Đổi trả / Bảo hành">Đổi trả / Bảo hành</option>
                      <option value="Hợp tác kinh doanh">Hợp tác kinh doanh</option>
                      <option value="Góp ý / Phản hồi">Góp ý / Phản hồi</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Nội dung <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-10 py-3.5 bg-foreground text-primary-foreground font-sans text-sm font-semibold tracking-wide rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gửi Tin Nhắn
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar — 2 cột */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bản đồ — lấy từ Cài Đặt Hệ Thống. Trước đây hardcode một điểm ở
                  Hoàn Kiếm, Hà Nội trong khi địa chỉ cấu hình lại ở TP.HCM.
                  Chưa nhập mã nhúng thì dựng tạm từ chính địa chỉ cửa hàng. */}
              <div className="rounded-xl overflow-hidden border border-border aspect-[4/3]">
                <iframe
                  src={isMapEmbed(settings.mapUrl) ? settings.mapUrl : mapEmbedFromAddress(settings.address)}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Bản đồ IKA Fashion"
                />
              </div>

              {/* Social & Support */}
              <div className="bg-secondary rounded-xl p-6">
                <h3 className="font-heading font-semibold text-foreground mb-4">Kết Nối Với IKA</h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center">
                      <Globe size={18} className="text-foreground" />
                    </div>
                    Facebook: @IKAFashionVN
                  </a>
                  <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center">
                      <MessageSquare size={18} className="text-foreground" />
                    </div>
                    Zalo: 0123 456 789
                  </a>
                  <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center">
                      <Mail size={18} className="text-foreground" />
                    </div>
                    hello@ikafashion.com
                  </a>
                </div>
              </div>

              {/* Response time */}
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-1">Thời gian phản hồi</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Chúng tôi cam kết phản hồi trong vòng <strong className="text-foreground">24 giờ</strong> làm việc. Các yêu cầu khẩn cấp vui lòng gọi Hotline để được hỗ trợ ngay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">Hỏi Đáp</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-muted-foreground mt-3 text-sm font-light">
              Tìm câu trả lời nhanh cho những thắc mắc phổ biến nhất
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-heading font-semibold text-foreground text-sm pr-4">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? '200px' : '0' }}
                >
                  <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground mb-4">
              Không tìm thấy câu trả lời?
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              Xem tất cả câu hỏi →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
