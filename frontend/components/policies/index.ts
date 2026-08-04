import type { ComponentType } from 'react'

import DoiTra from './chinh-sach-doi-tra'
import GiaoHang from './chinh-sach-giao-hang'
import Faq from './faq'
import HuongDanSize from './huong-dan-size'
import BaoMat from './chinh-sach-bao-mat'
import DieuKhoan from './dieu-khoan'

export type PolicySlug =
  | 'chinh-sach-doi-tra'
  | 'chinh-sach-giao-hang'
  | 'faq'
  | 'huong-dan-size'
  | 'chinh-sach-bao-mat'
  | 'dieu-khoan'

export type Policy = {
  slug: PolicySlug
  title: string
  desc: string
  Content: ComponentType
}

// Nguồn duy nhất cho cả trang công khai lẫn khu tài khoản: sửa nội dung một
// chỗ là cả hai nơi cùng đổi, không phải chép đôi.
export const POLICIES: Policy[] = [
  {
    slug: 'chinh-sach-doi-tra',
    title: 'Chính Sách Đổi Trả',
    desc: 'IKA Fashion cam kết mang đến trải nghiệm mua sắm an tâm. Nếu sản phẩm không phù hợp, bạn hoàn toàn có thể đổi trả dễ dàng.',
    Content: DoiTra,
  },
  {
    slug: 'chinh-sach-giao-hang',
    title: 'Chính Sách Giao Hàng',
    desc: 'Giao hàng nhanh chóng, an toàn trên toàn quốc. Miễn phí vận chuyển cho đơn từ 500.000đ.',
    Content: GiaoHang,
  },
  {
    slug: 'huong-dan-size',
    title: 'Hướng Dẫn Chọn Size',
    desc: 'Chọn đúng size ngay từ lần đầu với bảng size chi tiết và hướng dẫn đo cơ thể chuẩn xác.',
    Content: HuongDanSize,
  },
  {
    slug: 'faq',
    title: 'Câu Hỏi Thường Gặp',
    desc: 'Tìm câu trả lời nhanh cho mọi thắc mắc về sản phẩm, đơn hàng và dịch vụ của IKA Fashion.',
    Content: Faq,
  },
  {
    slug: 'chinh-sach-bao-mat',
    title: 'Chính Sách Bảo Mật',
    desc: 'IKA Fashion cam kết bảo vệ thông tin cá nhân của khách hàng theo tiêu chuẩn cao nhất.',
    Content: BaoMat,
  },
  {
    slug: 'dieu-khoan',
    title: 'Điều Khoản Sử Dụng',
    desc: 'Các quy định và điều khoản áp dụng khi bạn sử dụng website và dịch vụ của IKA Fashion.',
    Content: DieuKhoan,
  },
]

export function getPolicy(slug: string) {
  return POLICIES.find(p => p.slug === slug)
}
