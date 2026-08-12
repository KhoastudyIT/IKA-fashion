'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProducts, getAdminOrders, getAdminCustomers, Order } from '@/api'
import {
  ShoppingBag,
  Receipt,
  Users,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        const [prodRes, ordersRes, custRes] = await Promise.all([
          getProducts({ limit: 100 }),
          getAdminOrders(),
          getAdminCustomers(),
        ])

        const totalProducts = prodRes.items.length
        const orders = ordersRes.items ?? []
        const totalOrders = ordersRes.pagination?.total ?? orders.length
        const totalCustomers = custRes.pagination?.total ?? custRes.items.length
        // Chỉ tính doanh thu từ các đơn hàng không bị hủy (status !== 'cancelled')
        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.totalPrice, 0)

        setStats({
          products: totalProducts,
          orders: totalOrders,
          customers: totalCustomers,
          revenue: totalRevenue,
        })

        // Lấy tối đa 5 đơn hàng gần đây nhất
        setRecentOrders(orders.slice(0, 5))
      } catch (err: any) {
        setError(err.message || 'Lỗi tải dữ liệu bảng điều khiển')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ xử lý</span>
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Đã xác nhận</span>
      case 'shipped':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang giao</span>
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã hoàn thành</span>
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Đã hủy</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-2">Bảng Tổng Quan</h1>
        <p className="text-muted-foreground text-sm">Theo dõi tiến độ bán hàng, doanh thu và các chỉ số kinh doanh chính của IKA Fashion.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4">
          <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Sản Phẩm</p>
            <p className="text-3xl font-heading font-semibold text-[#2C2C2C]">
              {loading ? '...' : stats.products}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4">
          <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Đơn Hàng</p>
            <p className="text-3xl font-heading font-semibold text-[#2C2C2C]">
              {loading ? '...' : stats.orders}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4">
          <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Khách Hàng</p>
            <p className="text-3xl font-heading font-semibold text-[#2C2C2C]">
              {loading ? '...' : stats.customers}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Doanh Thu</p>
            <p className="text-2xl font-heading font-semibold text-green-600">
              {loading ? '...' : `${stats.revenue.toLocaleString()} đ`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-semibold text-[#2C2C2C]">Đơn Hàng Gần Đây</h2>
            <Link
              href="/dashboard/admin/orders"
              className="text-[#D4AF37] hover:underline text-sm font-medium flex items-center gap-1 transition-all"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-[#E5DFD8] bg-[#F9F5F0] text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium">Mã Đơn</th>
                  <th className="py-3 px-4 font-medium">Khách Hàng</th>
                  <th className="py-3 px-4 font-medium">Ngày Đặt</th>
                  <th className="py-3 px-4 font-medium">Tổng Tiền</th>
                  <th className="py-3 px-4 font-medium text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải đơn hàng...</td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có đơn hàng nào được đặt.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/50 transition-colors">
                      <td className="py-4 px-4 font-medium text-[#2C2C2C] max-w-[120px] truncate" title={order.id}>
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-4 text-[#2C2C2C]">{order.phone}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-4 text-[#2C2C2C] font-medium">
                        {order.totalPrice.toLocaleString()} đ
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Activities card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-heading font-semibold text-[#2C2C2C] mb-4">Hoạt Động Gần Đây</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-[#2C2C2C] font-medium">Cập nhật sản phẩm</p>
                  <p className="text-xs text-muted-foreground">Thay đổi danh mục sản phẩm thời trang áo thun.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-[#2C2C2C] font-medium">Hệ thống hoạt động</p>
                  <p className="text-xs text-muted-foreground">Đồng bộ cơ sở dữ liệu Express API thành công.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-[#2C2C2C] font-medium">Thống kê tự động</p>
                  <p className="text-xs text-muted-foreground">Báo cáo doanh số cập nhật theo thời gian thực.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E5DFD8] bg-[#F9F5F0]/50 p-4 rounded-lg flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#D4AF37] shrink-0" />
            <div>
              <p className="text-xs text-[#7A7A7A] uppercase font-bold tracking-wider">Mẹo Quản Trị UX</p>
              <p className="text-xs text-[#2C2C2C] mt-1">Cập nhật trạng thái giao hàng sớm để nâng cao độ hài lòng của khách hàng.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
