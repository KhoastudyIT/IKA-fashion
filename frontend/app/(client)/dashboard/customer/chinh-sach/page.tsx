'use client'

import Link from 'next/link'
import { RefreshCw, Truck, HelpCircle, Ruler, ShieldCheck, FileText, ArrowRight } from 'lucide-react'

const GROUPS = [
  {
    title: 'Chính sách mua hàng',
    caption: 'Những điều nên đọc trước và sau khi đặt hàng',
    items: [
      {
        href: '/dashboard/customer/chinh-sach/chinh-sach-doi-tra',
        icon: RefreshCw,
        title: 'Chính Sách Đổi Trả',
        desc: 'Đổi/trả trong 7 ngày, đổi size miễn phí khi còn hàng. Xử lý hoàn tiền 3–5 ngày làm việc.',
      },
      {
        href: '/dashboard/customer/chinh-sach/chinh-sach-giao-hang',
        icon: Truck,
        title: 'Chính Sách Giao Hàng',
        desc: 'Ba hình thức giao: tiêu chuẩn miễn phí, giao nhanh 30.000đ, hỏa tốc 60.000đ (chỉ TP.HCM).',
      },
    ],
  },
  {
    title: 'Hướng dẫn',
    caption: 'Giúp bạn chọn đúng ngay từ lần đầu',
    items: [
      {
        href: '/dashboard/customer/chinh-sach/huong-dan-size',
        icon: Ruler,
        title: 'Hướng Dẫn Chọn Size',
        desc: 'Bảng số đo chi tiết theo cân nặng và chiều cao cho áo thun, áo polo, áo vest và quần.',
      },
      {
        href: '/dashboard/customer/chinh-sach/faq',
        icon: HelpCircle,
        title: 'Câu Hỏi Thường Gặp',
        desc: 'Giải đáp nhanh về đặt hàng, thanh toán, vận chuyển và bảo quản sản phẩm.',
      },
    ],
  },
  {
    title: 'Pháp lý',
    caption: 'Cam kết của IKA Fashion với bạn',
    items: [
      {
        href: '/dashboard/customer/chinh-sach/chinh-sach-bao-mat',
        icon: ShieldCheck,
        title: 'Chính Sách Bảo Mật',
        desc: 'Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
      },
      {
        href: '/dashboard/customer/chinh-sach/dieu-khoan',
        icon: FileText,
        title: 'Điều Khoản Sử Dụng',
        desc: 'Quyền và nghĩa vụ khi bạn sử dụng website và dịch vụ của IKA Fashion.',
      },
    ],
  },
]

export default function CustomerPoliciesPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">Chính Sách</h1>
        <p className="text-muted-foreground mt-1">
          Toàn bộ chính sách và hướng dẫn của IKA Fashion, tập hợp ở một chỗ
        </p>
      </div>

      <div className="space-y-8">
        {GROUPS.map(group => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-lg font-heading font-semibold text-foreground">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{group.caption}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.items.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group bg-card border border-border rounded-lg p-5 flex gap-4 hover:border-accent transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      <span className="inline-flex items-center gap-1 text-sm text-accent font-medium mt-3">
                        Xem chi tiết
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 bg-secondary rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">Chưa tìm được câu trả lời?</p>
          <p className="text-sm text-muted-foreground">
            Nhắn cho trợ lý IKA, hoặc gõ &quot;gặp nhân viên&quot; để được hỗ trợ trực tiếp.
          </p>
        </div>
        <Link
          href="/dashboard/customer/messages"
          className="px-5 py-2.5 bg-foreground text-primary-foreground font-medium rounded text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          Nhắn tin hỗ trợ
        </Link>
      </div>
    </>
  )
}
