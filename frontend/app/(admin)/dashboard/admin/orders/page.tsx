'use client'

import { useEffect, useState } from 'react'
import { getAdminOrders, updateOrderStatus, Order } from '@/api'
import { Receipt, Search, Eye, RefreshCw, X } from 'lucide-react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal xem chi tiết
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await getAdminOrders()
      setOrders(res)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleUpdateStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      setUpdatingId(orderId)
      const updated = await updateOrderStatus(orderId, { status, paymentStatus })
      // Cập nhật lại danh sách đơn hàng
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      // Cập nhật lại đơn hàng đang chọn xem chi tiết
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated)
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật đơn hàng')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ xử lý</span>
      case 'confirmed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Đã xác nhận</span>
      case 'shipped':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang giao</span>
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã hoàn thành</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Đã hủy</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-800">Đã thanh toán</span>
      case 'unpaid':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">Chưa thanh toán</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">{status}</span>
    }
  }

  // Lọc danh sách đơn hàng
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true
    const matchesSearch =
      o.phone.includes(searchTerm) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.shippingAddress.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Thống kê nhanh đơn hàng
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    revenue: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalPrice, 0),
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Quản Lý Đơn Hàng</h1>
          <p className="text-muted-foreground text-sm">Theo dõi trạng thái giao nhận, thanh toán, xử lý và xem chi tiết đơn hàng của khách hàng.</p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
          title="Tải lại đơn hàng"
        >
          <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tổng đơn hàng</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Đơn chưa xử lý</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C] text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Đơn hoàn thành</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C] text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Doanh Thu (Không hủy)</p>
          <p className="text-2xl font-heading font-semibold text-[#D4AF37]">{stats.revenue.toLocaleString()} đ</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E5DFD8] flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn, SĐT hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipped">Đang giao</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Mã Đơn</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Số Điện Thoại</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Địa Chỉ Giao Hàng</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ngày Đặt</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Tổng Tiền</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Trạng Thái</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">Đang tải đơn hàng...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng nào.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-[#2C2C2C]" title={order.id}>
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6 text-[#2C2C2C]">{order.phone}</td>
                    <td className="py-4 px-6 text-muted-foreground max-w-[200px] truncate" title={order.shippingAddress}>
                      {order.shippingAddress}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-6 text-[#2C2C2C] font-semibold">
                      {order.totalPrice.toLocaleString()} đ
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] text-xs font-semibold rounded hover:bg-[#2C2C2C] hover:text-white transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E5DFD8]">
              <div>
                <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">
                  Chi Tiết Đơn Hàng
                </h2>
                <p className="text-xs text-muted-foreground mt-1">ID: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-[#F9F5F0] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F9F5F0] p-4 rounded-lg border border-[#E5DFD8]">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Thông tin giao nhận</h3>
                  <p className="text-sm text-[#2C2C2C] font-semibold">SĐT: {selectedOrder.phone}</p>
                  <p className="text-sm text-muted-foreground mt-1">Địa chỉ: {selectedOrder.shippingAddress}</p>
                  {selectedOrder.notes && (
                    <p className="text-xs italic text-amber-800 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                      Ghi chú: {selectedOrder.notes}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Trạng thái hiện tại</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Thanh toán:</span>
                      {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Đặt ngày:</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">Danh Sách Mặt Hàng</h3>
                <div className="border border-[#E5DFD8] rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#F9F5F0] text-muted-foreground">
                      <tr>
                        <th className="py-2 px-4 font-medium">Sản phẩm</th>
                        <th className="py-2 px-4 font-medium text-center">Thuộc tính</th>
                        <th className="py-2 px-4 font-medium text-center">SL</th>
                        <th className="py-2 px-4 font-medium text-right">Đơn giá</th>
                        <th className="py-2 px-4 font-medium text-right">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#E5DFD8] last:border-none">
                          <td className="py-3 px-4 text-[#2C2C2C] font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                            {item.color} / {item.size}
                          </td>
                          <td className="py-3 px-4 text-center text-[#2C2C2C]">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {item.price.toLocaleString()} đ
                          </td>
                          <td className="py-3 px-4 text-right text-[#2C2C2C] font-semibold">
                            {item.lineTotal.toLocaleString()} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-[#F9F5F0] p-4 flex justify-between items-center border-t border-[#E5DFD8]">
                    <span className="text-sm font-semibold text-[#2C2C2C]">Tổng Thanh Toán:</span>
                    <span className="text-lg font-heading font-semibold text-[#D4AF37]">
                      {selectedOrder.totalPrice.toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="border-t border-[#E5DFD8] pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-[#2C2C2C]">Thao Tác Quản Trị</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.status === 'pending' && (
                    <button
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                      className="px-4 py-2 bg-[#2C2C2C] hover:bg-[#D4AF37] text-white text-xs font-semibold rounded shadow transition-colors cursor-pointer"
                    >
                      Duyệt Đơn
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                      className="px-4 py-2 bg-[#2C2C2C] hover:bg-[#D4AF37] text-white text-xs font-semibold rounded shadow transition-colors cursor-pointer"
                    >
                      Bàn Giao Vận Chuyển
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed', 'paid')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow transition-colors cursor-pointer"
                    >
                      Xác Nhận Đã Giao & Đã Trả Tiền
                    </button>
                  )}
                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow transition-colors cursor-pointer"
                    >
                      Hủy Đơn Hàng
                    </button>
                  )}

                  {/* Payment toggle controls */}
                  {selectedOrder.paymentStatus === 'unpaid' && selectedOrder.status !== 'cancelled' && (
                    <button
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'paid')}
                      className="px-4 py-2 border border-[#E5DFD8] text-xs font-semibold text-[#2C2C2C] rounded hover:bg-[#F9F5F0] transition-colors cursor-pointer"
                    >
                      Đánh dấu Đã Thanh Toán
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
