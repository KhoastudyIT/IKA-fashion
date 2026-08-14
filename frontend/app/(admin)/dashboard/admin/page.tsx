'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getAdminOrders, getStatsReport, downloadStatsExcel,
  Order, StatsReport,
} from '@/api'
import {
  ShoppingBag,
  Receipt,
  Users,
  DollarSign,
  ArrowRight,
  BarChart2,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
} from 'lucide-react'

// Bảng Điều Khiển gộp luôn phần Thống Kê: một trang duy nhất cho cả số liệu
// tổng quan lẫn báo cáo theo kỳ, thay vì hai mục rời như trước.

/** 'YYYY-MM-DD' theo giờ máy — dùng toISOString sẽ lệch ngày do quy về UTC. */
function isoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Nhãn 'DD/MM' cho trục ngang của biểu đồ. */
function dayLabel(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

const vnd = (n: number) => n.toLocaleString('vi-VN')

const CHART_WIDTH = 500
const CHART_HEIGHT = 160

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('7')   // 7 / 15 / 30 ngày
  const [report, setReport] = useState<StatsReport | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  // Khoảng ngày của kỳ báo cáo, tính cả ngày hôm nay.
  const numDays = parseInt(timeRange, 10)
  const to = isoDate(new Date())
  const from = isoDate(new Date(Date.now() - (numDays - 1) * 86_400_000))

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [rp, ordersRes] = await Promise.all([
        getStatsReport({ from, to }),
        // Danh sách "gần đây" lấy riêng để không bị bó trong kỳ báo cáo đang chọn.
        getAdminOrders({ limit: 5 }),
      ])
      setReport(rp)
      setRecentOrders(ordersRes.items ?? [])
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu bảng điều khiển')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExport = async () => {
    try {
      setExporting(true)
      await downloadStatsExcel({ from, to })
    } catch (err: any) {
      setError(err.message || 'Không tải được file Excel')
    } finally {
      setExporting(false)
    }
  }

  const summary = report?.summary
  const revenueByDay = report?.revenueByDay ?? []
  const topProducts = report?.topProducts.slice(0, 5) ?? []
  const lowStock = report?.lowStock.slice(0, 5) ?? []

  const cancelRate = summary && summary.orders > 0
    ? Math.round((summary.cancelledOrders / summary.orders) * 100)
    : 0

  // Trục dọc lấy mốc tối thiểu 1 triệu để cột ngày ế không dựng thành đỉnh giả.
  const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1_000_000)
  const points = revenueByDay
    .map((d, i) => {
      const x = revenueByDay.length > 1 ? (i / (revenueByDay.length - 1)) * CHART_WIDTH : 0
      const y = CHART_HEIGHT - (d.revenue / maxRevenue) * CHART_HEIGHT
      return `${x},${y}`
    })
    .join(' ')

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
      case 'returned':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Đã trả hàng</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Title + thanh công cụ */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-2">Bảng Điều Khiển</h1>
          <p className="text-muted-foreground text-sm">
            Tổng quan cửa hàng và báo cáo bán hàng của IKA Fashion — số liệu tính trên toàn bộ đơn trong kỳ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          >
            <option value="7">7 ngày qua</option>
            <option value="15">15 ngày qua</option>
            <option value="30">30 ngày qua</option>
          </select>

          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-4 py-1.5 bg-[#2C2C2C] text-white rounded text-sm hover:bg-[#3D3D3D] disabled:opacity-60 transition-colors cursor-pointer flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] hover:bg-[#E5DFD8] transition-colors cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            In Báo Cáo
          </button>

          <button
            onClick={loadData}
            className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
            title="Tải lại số liệu"
          >
            <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Tổng quan toàn thời gian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4 print:break-inside-avoid print:shadow-none">
          <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Sản Phẩm</p>
            <p className="text-3xl font-heading font-semibold text-[#2C2C2C]">
              {loading || !summary ? '...' : summary.totalProducts}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4 print:break-inside-avoid print:shadow-none">
          <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Đơn Hàng</p>
            <p className="text-3xl font-heading font-semibold text-[#2C2C2C]">
              {loading || !summary ? '...' : summary.totalOrders}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4 print:break-inside-avoid print:shadow-none">
          <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Khách Hàng</p>
            <p className="text-3xl font-heading font-semibold text-[#2C2C2C]">
              {loading || !summary ? '...' : summary.totalCustomers}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex items-center gap-4 print:break-inside-avoid print:shadow-none">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Doanh Thu</p>
            <p className="text-2xl font-heading font-semibold text-green-600">
              {loading || !summary ? '...' : `${vnd(summary.totalRevenue)} đ`}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Không tính đơn hủy và đơn đã trả</p>
          </div>
        </div>
      </div>

      {/* ── Báo cáo theo kỳ ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">Báo Cáo &amp; Thống Kê</h2>
        <span className="text-xs text-muted-foreground">
          {from.split('-').reverse().join('/')} – {to.split('-').reverse().join('/')}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Doanh thu trong kỳ</p>
          <p className="text-2xl font-heading font-semibold text-green-600">
            {loading || !summary ? '...' : `${vnd(summary.revenue)} đ`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Trung bình {summary ? vnd(summary.avgOrderValue) : 0} đ / đơn
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Sản phẩm đã bán</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">
            {loading || !summary ? '...' : `${summary.itemsSold} món`}
          </p>
          <p className="text-[10px] text-[#D4AF37] font-semibold mt-1">
            {summary ? summary.newCustomers : 0} khách hàng mới trong kỳ
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Đơn hoàn thành</p>
          <p className="text-2xl font-heading font-semibold text-blue-600">
            {loading || !summary ? '...' : `${summary.completedOrders} đơn`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Trên {summary ? summary.orders : 0} đơn đặt trong kỳ
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tỷ lệ hủy đơn</p>
          <p className="text-2xl font-heading font-semibold text-red-600">
            {loading || !summary ? '...' : `${cancelRate}%`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {summary ? summary.cancelledOrders : 0} đơn bị hủy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 lg:col-span-2 space-y-6 print:break-inside-avoid print:shadow-none">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-heading font-semibold text-[#2C2C2C]">Xu Hướng Doanh Thu</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo ngày ({timeRange} ngày qua)</span>
            </div>
          </div>

          <div className="relative pt-4">
            <div className="absolute left-0 top-0 text-[10px] text-muted-foreground">{vnd(maxRevenue)} đ</div>
            <div className="absolute left-0 bottom-6 text-[10px] text-muted-foreground">0 đ</div>

            <div className="w-full pl-12 pr-4">
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full overflow-visible">
                {/* Lưới ngang */}
                <line x1="0" y1="0" x2={CHART_WIDTH} y2="0" stroke="#E5DFD8" strokeDasharray="4 4" />
                <line x1="0" y1={CHART_HEIGHT / 2} x2={CHART_WIDTH} y2={CHART_HEIGHT / 2} stroke="#E5DFD8" strokeDasharray="4 4" />
                <line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="#E5DFD8" />

                {revenueByDay.length > 1 && (
                  <>
                    <path
                      d={`M0,${CHART_HEIGHT} L${points} L${CHART_WIDTH},${CHART_HEIGHT} Z`}
                      fill="url(#chart-gradient)"
                      opacity="0.1"
                    />
                    <path d={`M${points}`} fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />
                    {revenueByDay.map((d, i) => {
                      const x = (i / (revenueByDay.length - 1)) * CHART_WIDTH
                      const y = CHART_HEIGHT - (d.revenue / maxRevenue) * CHART_HEIGHT
                      return (
                        <g key={d.date}>
                          <circle cx={x} cy={y} r="4" className="fill-[#2C2C2C] stroke-[#D4AF37] stroke-2" />
                          <title>{`${dayLabel(d.date)}: ${vnd(d.revenue)} đ · ${d.orders} đơn`}</title>
                        </g>
                      )
                    })}
                  </>
                )}

                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Nhãn trục ngang — thưa bớt để không chen chúc */}
              <div className="flex justify-between mt-3 text-[10px] text-muted-foreground font-medium">
                {revenueByDay.map((d, idx) => {
                  const showLabel =
                    numDays === 7 ||
                    (numDays === 15 && idx % 2 === 0) ||
                    (numDays === 30 && idx % 5 === 0) ||
                    idx === 0 ||
                    idx === revenueByDay.length - 1
                  return (
                    <span key={d.date} style={{ visibility: showLabel ? 'visible' : 'hidden' }}>
                      {dayLabel(d.date)}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sản phẩm bán chạy */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 space-y-6 print:break-inside-avoid print:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold text-[#2C2C2C]">Bán Chạy Nhất</h3>
            <BarChart2 className="w-5 h-5 text-[#D4AF37]" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Đang thống kê sản phẩm...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Chưa có đơn hàng nào trong kỳ.</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={prod.name} className="flex items-center gap-3 py-2 border-b border-[#F9F5F0] last:border-none">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-[#F9F5F0] border border-[#E5DFD8] flex items-center justify-center text-xs font-semibold text-[#2C2C2C]">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2C2C] truncate" title={prod.name}>{prod.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {prod.collection} · Đã bán <span className="font-semibold text-[#2C2C2C]">{prod.sold}</span> món
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-[#D4AF37] whitespace-nowrap">{vnd(prod.revenue)} đ</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Đơn hàng gần đây */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 lg:col-span-2 print:break-inside-avoid print:shadow-none">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-heading font-semibold text-[#2C2C2C]">Đơn Hàng Gần Đây</h3>
            <Link
              href="/dashboard/admin/orders"
              className="text-[#D4AF37] hover:underline text-sm font-medium flex items-center gap-1 transition-all print:hidden"
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
                      <td className="py-4 px-4">
                        <p className="text-[#2C2C2C]">{order.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">{order.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-4 text-[#2C2C2C] font-medium">{vnd(order.totalPrice)} đ</td>
                      <td className="py-4 px-4 text-center">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cảnh báo tồn kho — thay cho khối "hoạt động" trước đây vốn là chữ tĩnh */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 flex flex-col justify-between print:break-inside-avoid print:shadow-none">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-[#2C2C2C]">Sắp Hết Hàng</h3>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Đang kiểm tra kho...</p>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Mọi sản phẩm đều còn đủ hàng.</p>
            ) : (
              <div className="space-y-3">
                {lowStock.map((p) => (
                  <div key={p.handle} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2C2C2C] font-medium truncate" title={p.name}>{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.collection}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 whitespace-nowrap">còn {p.stock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/dashboard/admin/products"
            className="mt-6 pt-6 border-t border-[#E5DFD8] text-sm font-medium text-[#D4AF37] hover:underline flex items-center gap-1 print:hidden"
          >
            Quản lý sản phẩm <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
