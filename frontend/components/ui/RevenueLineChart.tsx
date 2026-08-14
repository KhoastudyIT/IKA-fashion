'use client'

import { useRef, useState } from 'react'

export interface RevenuePoint {
  /** 'YYYY-MM-DD' */
  date: string
  orders: number
  revenue: number
}

// Bảng màu của khu quản trị.
const GOLD = '#D4AF37'
const INK = '#2C2C2C'
const MUTED = '#7A7A7A'
const LINE = '#E5DFD8'

/** Rút gọn tiền cho nhãn trục dọc: 12.500.000 → "12,5tr" */
function shortVnd(n: number) {
  const v = Number(n) || 0
  if (v >= 1e9) return `${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace('.', ',')} tỷ`
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',')}tr`
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`
  return String(v)
}

/** 'YYYY-MM-DD' → 'DD/MM' (cắt chuỗi, không qua Date để khỏi lệch múi giờ). */
function dm(iso: string) {
  const p = String(iso).split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}` : iso
}

// Hệ toạ độ viewBox. Tỉ lệ W:H quyết định biểu đồ dẹt hay cao; bề ngang hiển thị
// do thẻ chứa quyết định vì svg đặt width 100%.
const W = 760
const H = 260
// right phải đủ rộng cho nửa bề ngang nhãn ngày cuối (canh giữa), nếu không chữ
// tràn khỏi viewBox và bị xén mất chữ số tháng.
const PAD = { top: 16, right: 26, bottom: 30, left: 58 }
const iw = W - PAD.left - PAD.right
const ih = H - PAD.top - PAD.bottom

const GRID_LINES = 4
const TENSION = 0.75
const TIP_W = 150
const TIP_H = 42

/**
 * Biểu đồ đường doanh thu theo ngày.
 *
 * Vẽ bằng SVG thuần thay vì kéo thêm thư viện biểu đồ: chỉ cần một đường cong,
 * vùng tô dưới đường và vài nhãn trục nên không đáng để thêm phụ thuộc.
 * Chấm dữ liệu và hộp thông tin chỉ hiện khi rê chuột, nhờ đó đường biểu diễn
 * lúc bình thường sạch sẽ.
 */
export default function RevenueLineChart({ data }: { data: RevenuePoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const vals = data.map((d) => Number(d.revenue) || 0)
  const rawMax = Math.max(...vals, 1)
  // Làm tròn trần lên số đẹp để các đường lưới không ra số lẻ.
  const step = Math.pow(10, Math.floor(Math.log10(rawMax)))
  const max = Math.ceil(rawMax / step) * step

  const x = (i: number) => PAD.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = (v: number) => PAD.top + ih - (v / max) * ih

  const pts = data.map((d, i) => [x(i), y(Number(d.revenue) || 0)] as const)

  /**
   * Nối các điểm bằng đường cong trơn.
   *
   * Dùng Catmull-Rom quy đổi sang Bézier bậc ba: điểm điều khiển của mỗi đoạn
   * lấy theo độ dốc giữa điểm trước và điểm sau, nhờ đó đường đi mượt qua đúng
   * mọi điểm dữ liệu. Toạ độ y của điểm điều khiển bị kẹp trong vùng vẽ để chỗ
   * dốc mạnh đường không vọt ra ngoài trục.
   */
  const clampY = (v: number) => Math.max(PAD.top, Math.min(PAD.top + ih, v))
  const curve = (() => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] ?? p2
      const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * TENSION
      const c1y = clampY(p1[1] + ((p2[1] - p0[1]) / 6) * TENSION)
      const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * TENSION
      const c2y = clampY(p2[1] - ((p3[1] - p1[1]) / 6) * TENSION)
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    }
    return d
  })()

  const baseY = PAD.top + ih
  const areaPath = curve
    ? `${curve} L${pts[pts.length - 1][0].toFixed(1)},${baseY} L${pts[0][0].toFixed(1)},${baseY} Z`
    : ''

  // Nhãn trục ngang: tối đa 8 mốc. Đếm NGƯỢC từ ngày cuối để mốc cuối luôn được
  // ghi mà vẫn cách đều mốc trước — đi xuôi rồi ép thêm ngày cuối sẽ đè chữ.
  const tickEvery = Math.max(1, Math.ceil(data.length / 8))
  const ticks: number[] = []
  for (let i = data.length - 1; i >= 0; i -= tickEvery) ticks.unshift(i)

  /** Đổi toạ độ chuột sang hệ viewBox rồi tìm điểm dữ liệu gần nhất. */
  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || data.length === 0) return
    const vx = ((e.clientX - rect.left) / rect.width) * W
    const ratio = (vx - PAD.left) / (iw || 1)
    const i = Math.round(ratio * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const hp = hover != null ? pts[hover] : null

  // Hộp thông tin: lật sang trái khi điểm nằm gần mép phải để không bị cắt.
  const tipLeft = hp ? hp[0] + TIP_W + 14 > W : false
  const tipX = hp ? (tipLeft ? hp[0] - TIP_W - 12 : hp[0] + 12) : 0
  const tipY = hp ? Math.max(PAD.top, Math.min(hp[1] - TIP_H / 2, PAD.top + ih - TIP_H)) : 0

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">Chưa có dữ liệu doanh thu.</p>
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.30" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Lưới ngang và nhãn trục dọc */}
      {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
        const v = (max / GRID_LINES) * i
        const gy = y(v)
        return (
          <g key={i}>
            <line
              x1={PAD.left} y1={gy} x2={PAD.left + iw} y2={gy}
              stroke={LINE} strokeWidth="1" strokeDasharray={i === 0 ? '0' : '3 4'}
            />
            <text x={PAD.left - 9} y={gy + 3.8} textAnchor="end" fontSize="11.5" fill={MUTED}>
              {shortVnd(v)}
            </text>
          </g>
        )
      })}

      {/* Vùng tô dưới đường + đường doanh thu dạng cong */}
      <path d={areaPath} fill="url(#revenueFill)" />
      <path d={curve} fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

      {/* Chấm và thông tin chỉ hiện khi rê chuột */}
      {hp && hover != null && (
        <g pointerEvents="none">
          <line
            x1={hp[0]} y1={PAD.top} x2={hp[0]} y2={PAD.top + ih}
            stroke={GOLD} strokeWidth="1" strokeDasharray="3 3" opacity="0.6"
          />
          <circle cx={hp[0]} cy={hp[1]} r="5.5" fill="#FFFFFF" stroke={GOLD} strokeWidth="2.6" />

          <rect x={tipX} y={tipY} width={TIP_W} height={TIP_H} rx="7" fill={INK} opacity="0.95" />
          <text x={tipX + 11} y={tipY + 17} fontSize="11.5" fill="#D8D2CA">
            {dm(data[hover].date)} · {data[hover].orders ?? 0} đơn
          </text>
          <text x={tipX + 11} y={tipY + 33} fontSize="13" fontWeight="700" fill="#FFFFFF">
            {(Number(data[hover].revenue) || 0).toLocaleString('vi-VN')} đ
          </text>
        </g>
      )}

      {/* Nhãn trục ngang */}
      {ticks.map((i) => (
        <text
          key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11.5"
          fill={hover === i ? INK : MUTED}
          fontWeight={hover === i ? 700 : 400}
        >
          {dm(data[i].date)}
        </text>
      ))}
    </svg>
  )
}
