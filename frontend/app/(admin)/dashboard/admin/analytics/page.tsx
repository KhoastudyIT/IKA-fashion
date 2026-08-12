'use client'

import { useEffect, useState } from 'react'
import { getAdminOrders, Order } from '@/api'
import { TrendingUp, RefreshCw, BarChart2, Calendar, ShoppingBag } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('7') // 7 ngày, 30 ngày

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getAdminOrders()
      const { items: data, pagination } = res
      setOrders(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 1. Phân tích khoảng thời gian
  const numDays = parseInt(timeRange, 10)
  const dates = Array.from({ length: numDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toLocaleDateString('vi-VN').slice(0, 5) // Lấy dạng "DD/MM"
  }).reverse()

  const datesFull = Array.from({ length: numDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0] // Dạng "YYYY-MM-DD"
  }).reverse()

  // 2. Tính doanh số theo ngày
  const dailyData = datesFull.map((date, idx) => {
    const filtered = orders.filter(
      (o) => o.createdAt.startsWith(date) && o.status !== 'cancelled'
    )
    const revenue = filtered.reduce((sum, o) => sum + o.totalPrice, 0)
    const count = filtered.length
    return {
      label: dates[idx],
      revenue,
      count,
    }
  })

  // 3. Tính toán các chỉ số chính
  const completedOrders = orders.filter((o) => o.status === 'completed')
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const itemsSold = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0), 0)

  // 4. Tìm sản phẩm bán chạy nhất
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; img: string | null }> = {}
  orders
    .filter((o) => o.status !== 'cancelled')
    .forEach((o) => {
      o.items.forEach((item) => {
        const id = String(item.productId)
        if (!productSalesMap[id]) {
          productSalesMap[id] = { name: item.name, quantity: 0, revenue: 0, img: item.img }
        }
        productSalesMap[id].quantity += item.quantity
        productSalesMap[id].revenue += item.lineTotal
      })
    })

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // 5. Logic vẽ biểu đồ SVG
  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1000000)
  const chartHeight = 160
  const chartWidth = 500

  // Tạo các điểm cho đường dẫn SVG
  const points = dailyData
    .map((d, i) => {
      const x = (i / (dailyData.length - 1)) * chartWidth
      const y = chartHeight - (d.revenue / maxRevenue) * chartHeight
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Báo Cáo & Thống Kê</h1>
          <p className="text-muted-foreground text-sm">Phân tích hiệu suất bán hàng, doanh thu thực tế, sản phẩm bán chạy và tăng trưởng.</p>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={loadData}
            className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
            title="Tải lại báo cáo"
          >
            <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-heading font-semibold text-green-600">{totalRevenue.toLocaleString()} đ</p>
          <p className="text-[10px] text-muted-foreground mt-1">Không tính các đơn bị hủy</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Sản phẩm đã bán</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{itemsSold} món</p>
          <p className="text-[10px] text-[#D4AF37] font-semibold mt-1">Đã đóng gói thành công</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Đơn hoàn thành</p>
          <p className="text-2xl font-heading font-semibold text-blue-600">{completedOrders.length} đơn</p>
          <p className="text-[10px] text-muted-foreground mt-1">Đã giao hàng và thu tiền</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tỷ lệ hủy đơn</p>
          <p className="text-2xl font-heading font-semibold text-red-600">
            {orders.length ? Math.round((orders.filter((o) => o.status === 'cancelled').length / orders.length) * 100) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Trên tổng đơn hàng đặt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Premium Chart Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-heading font-semibold text-[#2C2C2C]">Xu Hướng Doanh Thu</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo ngày ({timeRange} ngày qua)</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative pt-4">
            <div className="absolute left-0 top-0 text-[10px] text-muted-foreground">
              {maxRevenue.toLocaleString()} đ
            </div>
            <div className="absolute left-0 bottom-6 text-[10px] text-muted-foreground">0 đ</div>

            <div className="w-full pl-12 pr-4">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#E5DFD8" strokeDasharray="4 4" />
                <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#E5DFD8" strokeDasharray="4 4" />
                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#E5DFD8" />

                {/* The line path */}
                {dailyData.length > 1 && (
                  <>
                    {/* Shadow Area below line */}
                    <path
                      d={`M0,${chartHeight} L${points} L${chartWidth},${chartHeight} Z`}
                      fill="url(#chart-gradient)"
                      opacity="0.1"
                    />
                    {/* Line path */}
                    <path
                      d={`M${points}`}
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Data Points */}
                    {dailyData.map((d, i) => {
                      const x = (i / (dailyData.length - 1)) * chartWidth
                      const y = chartHeight - (d.revenue / maxRevenue) * chartHeight
                      return (
                        <g key={i} className="group/dot cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            className="fill-[#2C2C2C] stroke-[#D4AF37] stroke-2 hover:r-6 transition-all"
                          />
                          <title>{`${d.label}: ${d.revenue.toLocaleString()} đ`}</title>
                        </g>
                      )
                    })}
                  </>
                )}

                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between mt-3 text-[10px] text-muted-foreground font-medium">
                {dailyData.map((d, idx) => {
                  // Chỉ hiển thị nhãn cách khoảng để không bị chen chúc
                  const showLabel =
                    numDays === 7 ||
                    (numDays === 15 && idx % 2 === 0) ||
                    (numDays === 30 && idx % 5 === 0) ||
                    idx === 0 ||
                    idx === dailyData.length - 1
                  return (
                    <span key={idx} style={{ visibility: showLabel ? 'visible' : 'hidden' }}>
                      {d.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Top Products Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-[#2C2C2C]">Bán Chạy Nhất</h2>
            <BarChart2 className="w-5 h-5 text-[#D4AF37]" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Đang thống kê sản phẩm...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Chưa có đơn hàng thành công.</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-[#F9F5F0] last:border-none">
                  {prod.img ? (
                    <img src={prod.img} alt={prod.name} className="w-10 h-10 object-cover rounded border border-[#E5DFD8]" />
                  ) : (
                    <div className="w-10 h-10 bg-[#F9F5F0] rounded flex items-center justify-center text-muted-foreground border border-[#E5DFD8]">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2C2C] truncate" title={prod.name}>
                      {prod.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Đã bán: <span className="font-semibold text-[#2C2C2C]">{prod.quantity}</span> món
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-[#D4AF37] whitespace-nowrap">
                    {prod.revenue.toLocaleString()} đ
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
