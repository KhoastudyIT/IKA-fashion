import { redirect } from 'next/navigation'

// Mục Thống Kê đã gộp vào Bảng Điều Khiển. Giữ lại đường dẫn cũ để link đã lưu
// hoặc bookmark của admin không rơi vào trang 404.
export default function AnalyticsRedirectPage() {
  redirect('/dashboard/admin')
}
