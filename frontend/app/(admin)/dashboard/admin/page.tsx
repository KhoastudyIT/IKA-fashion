'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getAdminOrders, getStatsReport, downloadStatsExcel,
  Order, StatsReport,
} from '@/api'
import RevenueLineChart from '@/components/ui/RevenueLineChart'
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

// Trang Tổng Quan gộp luôn phần Thống Kê: một trang duy nhất cho cả số liệu
// tổng quan lẫn báo cáo theo kỳ, thay vì hai mục rời như trước.

/** 'YYYY-MM-DD' theo giờ máy — dùng toISOString sẽ lệch ngày do quy về UTC. */
function isoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' để hiện cho người đọc. */
function dmy(iso: string) {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso
}

/** Số ngày của kỳ, tính cả hai đầu mút. */
function daysBetween(from: string, to: string) {
  const ms = new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()
  return Math.floor(ms / 86_400_000) + 1
}

const vnd = (n: number) => n.toLocaleString('vi-VN')

/** Mốc thời gian đặt sẵn — bấm một cái là xong, khỏi phải chọn từng ngày. */
const QUICK_RANGES = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
]

const DEFAULT_DAYS = 30

export default function AdminDashboard() {
  const today = isoDate(new Date())
  const defaultFrom = isoDate(new Date(Date.now() - (DEFAULT_DAYS - 1) * 86_400_000))

  // Hai ô ngày là giá trị đang gõ; `range` mới là kỳ đã áp dụng và đang hiển
  // thị. Tách ra để mỗi lần đổi ngày không bắn một request.
  const [fromInput, setFromInput] = useState(defaultFrom)
  const [toInput, setToInput] = useState(today)
  const [range, setRange] = useState({ from: defaultFrom, to: today })

  const [report, setReport] = useState<StatsReport | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const numDays = daysBetween(range.from, range.to)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [rp, ordersRes] = await Promise.all([
        getStatsReport(range),
        // Danh sách "gần đây" lấy riêng để không bị bó trong kỳ báo cáo đang chọn.
        getAdminOrders({ limit: 5 }),
      ])
      setReport(rp)
      setRecentOrders(ordersRes.items ?? [])
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu tổng quan')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    loadData()
  }, [loadData])

  const applyRange = () => {
    if (fromInput > toInput) {
      setError('Ngày bắt đầu phải trước ngày kết thúc')
      return
    }
    setRange({ from: fromInput, to: toInput })
  }

  /** Bấm nhanh 7 / 30 / 90 ngày — đặt lại hai ô ngày rồi áp dụng luôn. */
  const applyQuickRange = (days: number) => {
    const from = isoDate(new Date(Date.now() - (days - 1) * 86_400_000))
    setFromInput(from)
    setToInput(today)
    setRange({ from, to: today })
  }

  const handleExport = async () => {
    if (range.from > range.to) return
    try {
      setExporting(true)
      await downloadStatsExcel(range)
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
      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-2">Tổng Quan</h1>
          <p className="text-muted-foreground text-sm">
            Tổng quan cửa hàng và báo cáo bán hàng của IKA Fashion. Doanh thu tính trên đơn đã hoàn thành;
            đơn chưa giao xong nằm ở mục “Tiền chờ thu”.
          </p>
        </div>
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          Kỳ báo cáo: {dmy(range.from)} – {dmy(range.to)} ({numDays} ngày)
        </span>
      </div>

      {/* Chọn kỳ báo cáo — áp cho cả trang lẫn tệp Excel */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E5DFD8] print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromInput}
              max={toInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Đến ngày
            </label>
            <input
              type="date"
              value={toInput}
              min={fromInput}
              max={today}
              onChange={(e) => setToInput(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <button
            onClick={applyRange}
            disabled={loading}
            className="px-4 py-1.5 bg-[#D4AF37] text-[#2C2C2C] font-semibold rounded text-sm hover:bg-[#c39f2c] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? 'Đang tải...' : 'Áp dụng'}
          </button>

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

          <div className="flex items-center gap-2 ml-auto">
            {QUICK_RANGES.map((r) => {
              const active = numDays === r.days && range.to === today
              return (
                <button
                  key={r.days}
                  onClick={() => applyQuickRange(r.days)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'border-[#D4AF37] text-[#2C2C2C] bg-[#D4AF37]/10'
                      : 'border-[#E5DFD8] text-muted-foreground hover:bg-[#F9F5F0]'
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
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
            <p className="text-[0.625rem] text-muted-foreground mt-1">Chỉ tính đơn đã hoàn thành</p>
          </div>
        </div>
      </div>

      {/* ── Báo cáo theo kỳ ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">Báo Cáo &amp; Thống Kê</h2>
        <span className="text-xs text-muted-foreground">{dmy(range.from)} – {dmy(range.to)}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Doanh thu trong kỳ</p>
          <p className="text-2xl font-heading font-semibold text-green-600">
            {loading || !summary ? '...' : `${vnd(summary.revenue)} đ`}
          </p>
          <p className="text-[0.625rem] text-muted-foreground mt-1">
            {summary ? summary.completedOrders : 0} đơn hoàn thành · TB {summary ? vnd(summary.avgOrderValue) : 0} đ/đơn
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tiền chờ thu</p>
          <p className="text-2xl font-heading font-semibold text-[#D4AF37]">
            {loading || !summary ? '...' : `${vnd(summary.pendingRevenue)} đ`}
          </p>
          <p className="text-[0.625rem] text-muted-foreground mt-1">
            {summary ? summary.pendingOrders : 0} đơn chưa giao xong, chưa tính vào doanh thu
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Sản phẩm đã bán</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">
            {loading || !summary ? '...' : `${summary.itemsSold} món`}
          </p>
          <p className="text-[0.625rem] text-[#D4AF37] font-semibold mt-1">
            {summary ? summary.newCustomers : 0} khách hàng mới trong kỳ
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8] print:break-inside-avoid print:shadow-none">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tỷ lệ hủy đơn</p>
          <p className="text-2xl font-heading font-semibold text-red-600">
            {loading || !summary ? '...' : `${cancelRate}%`}
          </p>
          <p className="text-[0.625rem] text-muted-foreground mt-1">
            {summary ? summary.cancelledOrders : 0} đơn hủy · {summary ? summary.returnedOrders : 0} đơn trả hàng
            {' '}trên {summary ? summary.orders : 0} đơn đặt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 lg:col-span-2 space-y-4 print:break-inside-avoid print:shadow-none">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-heading font-semibold text-[#2C2C2C]">Xu Hướng Doanh Thu</h3>
            <span className="text-xs text-muted-foreground">
              Đơn đã hoàn thành · rê chuột để xem chi tiết từng ngày
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-16">Đang dựng biểu đồ...</p>
          ) : (
            <RevenueLineChart data={revenueByDay} />
          )}
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
                        <p className="text-[0.6875rem] text-muted-foreground">{order.phone}</p>
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
