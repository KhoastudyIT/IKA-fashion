'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { getAdminOrders, updateOrderStatus, openOrderInvoice, AdminOrderSummary, Order } from '@/api'
import { Receipt, Search, Eye, RefreshCw, X, Printer } from 'lucide-react'
import AdminPagination from '@/components/ui/AdminPagination'

import { useUI } from '@/components/context/UIDialogContext'
export default function AdminOrdersPage() {
  const { toast } = useUI()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  // Thống kê do backend tính trên toàn bộ đơn khớp bộ lọc.
  const [stats, setStats] = useState<AdminOrderSummary>({ total: 0, pending: 0, completed: 0, revenue: 0 })

  // Từ khóa đã "chốt" để gọi API — tách khỏi ô nhập để không bắn request mỗi lần gõ.
  const [appliedSearch, setAppliedSearch] = useState('')

  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const currentPage  = Math.max(1, Number(searchParams.get('page')) || 1)

  /** Đổi bộ lọc thì phải quay về trang 1, không thì đang ở trang 3 sẽ ra danh sách rỗng. */
  const resetToFirstPage = () => {
    if (currentPage !== 1) router.replace(pathname)
  }

  // Modal xem chi tiết
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  /** Mở hóa đơn PDF do backend dựng, ở tab mới để admin xem rồi in hoặc lưu. */
  const handleInvoice = async (orderId: string) => {
    try {
      setInvoiceId(orderId)
      await openOrderInvoice(orderId, { admin: true })
    } catch (err: any) {
      setError(err.message || 'Không mở được hóa đơn')
    } finally {
      setInvoiceId(null)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await getAdminOrders({
        status: statusFilter || undefined,
        search: appliedSearch || undefined,
        page: currentPage,
        limit: 15,
      })
      const { items: data, pagination, summary } = res
      setOrders(data ?? [])
      setTotalPages(pagination?.totalPages ?? 1)
      setStats(summary)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, appliedSearch])

  // Chờ 400ms sau khi ngừng gõ mới gọi API, tránh mỗi ký tự một request.
  useEffect(() => {
    const id = setTimeout(() => {
      const term = searchTerm.trim()
      if (term === appliedSearch) return
      setAppliedSearch(term)
      resetToFirstPage()
    }, 400)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

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
      toast(err.message || 'Lỗi cập nhật đơn hàng', 'error')
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
      case 'returned':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Đã trả hàng</span>
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
      case 'refunded':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800">Đã hoàn tiền</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">{status}</span>
    }
  }

  // Tìm kiếm chạy ở server nên `orders` đã là kết quả cuối — trước đây lọc phía
  // client chỉ soi được 15 đơn của trang đang xem, đơn nằm ở trang sau không bao
  // giờ tra ra.
  const filteredOrders = orders

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
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Doanh Thu (đơn hoàn thành)</p>
          <p className="text-2xl font-heading font-semibold text-[#D4AF37]">{stats.revenue.toLocaleString()} đ</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E5DFD8] flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, SĐT, email hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); resetToFirstPage() }}
          className="px-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipped">Đang giao</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="returned">Đã trả hàng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Orders Table + Pagination */}
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
                    <td className="py-4 px-6">
                      <p className="text-[#2C2C2C] font-medium">{order.customerName}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{order.phone}</p>
                    </td>
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
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleInvoice(order.id)}
                          disabled={invoiceId === order.id}
                          className="px-3 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] text-xs font-semibold rounded hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          title="Xuất hóa đơn PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {invoiceId === order.id ? 'Đang tạo...' : 'Hóa đơn'}
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] text-xs font-semibold rounded hover:bg-[#2C2C2C] hover:text-white transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="border-t border-[#E5DFD8] bg-[#F9F5F0] px-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tổng {stats.total} đơn hàng</span>
            <AdminPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          {/* Bố cục 3 tầng: tiêu đề và hàng thao tác đứng yên, chỉ phần giữa cuộn —
              đơn nhiều mặt hàng không đẩy nút quản trị ra khỏi màn hình. */}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-8 py-5 border-b border-[#E5DFD8] shrink-0">
              <div>
                <h2 className="text-2xl font-heading font-semibold text-[#2C2C2C]">
                  Chi Tiết Đơn Hàng
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()} · {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedOrder.status)}
                {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                <button
                  onClick={() => handleInvoice(selectedOrder.id)}
                  disabled={invoiceId === selectedOrder.id}
                  className="px-3 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] text-xs font-semibold rounded hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {invoiceId === selectedOrder.id ? 'Đang tạo...' : 'Xuất hóa đơn'}
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-[#F9F5F0] rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6 overflow-y-auto">
              {/* Customer Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#F9F5F0] p-5 rounded-lg border border-[#E5DFD8]">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Thông tin giao nhận</h3>
                  <p className="text-base text-[#2C2C2C] font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-x-3 gap-y-2 mt-4 text-sm">
                    <span className="text-muted-foreground">Điện thoại</span>
                    <span className="text-[#2C2C2C] font-medium">{selectedOrder.phone}</span>
                    <span className="text-muted-foreground">Địa chỉ</span>
                    <span className="text-[#2C2C2C] leading-relaxed">{selectedOrder.shippingAddress}</span>
                  </div>
                  {selectedOrder.notes && (
                    <p className="text-sm italic text-amber-800 mt-4 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200 leading-relaxed">
                      Ghi chú: {selectedOrder.notes}
                    </p>
                  )}
                </div>
                <div className="bg-[#F9F5F0] p-5 rounded-lg border border-[#E5DFD8]">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Thanh toán</h3>
                  <div className="space-y-3 text-sm">
                    {/* totalPrice = tiền hàng − giảm giá + phí ship, nên muốn ra
                        tạm tính phải cộng lại phần giảm và gỡ phí ship ra. */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tạm tính</span>
                      <span className="text-[#2C2C2C]">
                        {(selectedOrder.totalPrice + selectedOrder.discount - selectedOrder.shippingFee).toLocaleString()} đ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phí vận chuyển</span>
                      <span className={selectedOrder.shippingFee > 0 ? 'text-[#2C2C2C]' : 'text-green-600'}>
                        {selectedOrder.shippingFee > 0
                          ? `${selectedOrder.shippingFee.toLocaleString()} đ`
                          : 'Miễn phí'}
                      </span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Giảm giá{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}
                        </span>
                        <span className="text-green-600">−{selectedOrder.discount.toLocaleString()} đ</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-[#E5DFD8]">
                      <span className="font-semibold text-[#2C2C2C]">Tổng cộng</span>
                      <span className="text-xl font-heading font-semibold text-[#D4AF37]">
                        {selectedOrder.totalPrice.toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-base font-semibold text-[#2C2C2C] mb-3">
                  Danh Sách Mặt Hàng ({selectedOrder.items.length})
                </h3>
                <div className="border border-[#E5DFD8] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#F9F5F0] text-muted-foreground">
                        <tr>
                          <th className="py-3 px-5 font-medium">Sản phẩm</th>
                          <th className="py-3 px-5 font-medium text-center">Thuộc tính</th>
                          <th className="py-3 px-5 font-medium text-center">SL</th>
                          <th className="py-3 px-5 font-medium text-right">Đơn giá</th>
                          <th className="py-3 px-5 font-medium text-right">Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#E5DFD8] last:border-none">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                {item.img && (
                                  <img src={item.img} alt={item.name} className="w-12 h-12 object-cover rounded border border-[#E5DFD8] shrink-0" />
                                )}
                                <span className="text-[#2C2C2C] font-medium">{item.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-center text-xs text-muted-foreground whitespace-nowrap">
                              {item.color} / {item.size}
                            </td>
                            <td className="py-4 px-5 text-center text-[#2C2C2C]">{item.quantity}</td>
                            <td className="py-4 px-5 text-right text-muted-foreground whitespace-nowrap">
                              {item.price.toLocaleString()} đ
                            </td>
                            <td className="py-4 px-5 text-right text-[#2C2C2C] font-semibold whitespace-nowrap">
                              {item.lineTotal.toLocaleString()} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="px-8 py-5 border-t border-[#E5DFD8] bg-[#FFFDFA] shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-[#2C2C2C] mr-1">Thao tác:</span>
                {selectedOrder.status === 'pending' && (
                  <button
                    disabled={updatingId !== null}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                    className="px-5 py-2.5 bg-[#2C2C2C] hover:bg-[#D4AF37] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Duyệt Đơn
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    disabled={updatingId !== null}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    className="px-5 py-2.5 bg-[#2C2C2C] hover:bg-[#D4AF37] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Bàn Giao Vận Chuyển
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    disabled={updatingId !== null}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed', 'paid')}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Xác Nhận Đã Giao &amp; Đã Trả Tiền
                  </button>
                )}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'returned' && (
                  <button
                    disabled={updatingId !== null}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Hủy Đơn Hàng
                  </button>
                )}

                {/* Payment toggle controls */}
                {selectedOrder.paymentStatus === 'unpaid' && selectedOrder.status !== 'cancelled' && (
                  <button
                    disabled={updatingId !== null}
                    onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'paid')}
                    className="px-5 py-2.5 border border-[#E5DFD8] text-sm font-semibold text-[#2C2C2C] rounded-lg hover:bg-[#F9F5F0] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Đánh dấu Đã Thanh Toán
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="ml-auto px-5 py-2.5 border border-[#E5DFD8] text-sm font-semibold text-[#2C2C2C] rounded-lg hover:bg-[#F9F5F0] transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
