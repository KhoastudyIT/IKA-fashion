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
    ]
  },
}

export default nextConfig
