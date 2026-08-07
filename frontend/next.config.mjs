/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Giỏ hàng và yêu thích giờ nằm trong khu tài khoản, không còn trang riêng
  async redirects() {
    return [
      { source: '/cart', destination: '/dashboard/customer/cart', permanent: true },
      { source: '/wishlist', destination: '/dashboard/customer/wishlist', permanent: true },
      // Tạp chí chuyển từ /blog sang /tin-tuc. Bài viết cũ là dữ liệu tĩnh nay
      // đã gỡ, nên mọi /blog/<id> đều đưa về danh sách thay vì 404.
      { source: '/blog', destination: '/tin-tuc', permanent: true },
      { source: '/blog/:id', destination: '/tin-tuc', permanent: true },
    ]
  },
  // Ảnh admin tải lên nằm trên đĩa của backend. DB chỉ lưu đường dẫn tương đối
  // (/uploads/...) nên đổi host hay cổng đều không làm hỏng ảnh cũ — chỉ cần
  // sửa API_ORIGIN. Trong Docker đặt API_ORIGIN=http://backend:4000.
  async rewrites() {
    const origin = process.env.API_ORIGIN || 'http://localhost:4000'
    return [
      { source: '/uploads/:path*', destination: `${origin}/uploads/:path*` },
    ]
  },
}

export default nextConfig
