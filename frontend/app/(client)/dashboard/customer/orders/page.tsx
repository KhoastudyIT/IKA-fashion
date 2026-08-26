'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/auth-client'
import {
  getMyOrders, Order, addToCart, openOrderInvoice,
  RETURN_STATUS_LABEL, RETURN_TYPE_LABEL, canCancelOrder, cancelMyOrder, canBuyAgain,
} from '@/api'
import { useShop } from '@/components/context/ShopContext'
import {
  Clock, CheckCircle2, Truck, PackageCheck, XCircle, Undo2,
  FileText, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Ban, X,
} from 'lucide-react'
import { useUI } from '@/components/context/UIDialogContext'
const PAGE_SIZE = 5
const ITEMS_PREVIEW = 3

type StatusMeta = {
  label: string
  badge: string
  accent: string
  dot: string
  chip: string
  icon: typeof Clock
}

const STATUS_META: Record<string, StatusMeta> = {
  pending: { label: 'Chờ xác nhận', badge: 'bg-amber-50 text-amber-700 border-amber-200', accent: 'border-l-amber-400', dot: 'bg-amber-500', chip: 'bg-amber-500 text-white border-amber-500', icon: Clock },
  confirmed: { label: 'Đã xác nhận', badge: 'bg-blue-50 text-blue-700 border-blue-200', accent: 'border-l-blue-400', dot: 'bg-blue-500', chip: 'bg-blue-600 text-white border-blue-600', icon: CheckCircle2 },
  shipped: { label: 'Đang giao', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: 'border-l-indigo-400', dot: 'bg-indigo-500', chip: 'bg-indigo-600 text-white border-indigo-600', icon: Truck },
  completed: { label: 'Hoàn thành', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: 'border-l-emerald-400', dot: 'bg-emerald-500', chip: 'bg-emerald-600 text-white border-emerald-600', icon: PackageCheck },
  cancelled: { label: 'Đã hủy', badge: 'bg-red-50 text-red-700 border-red-200', accent: 'border-l-red-400', dot: 'bg-red-500', chip: 'bg-red-600 text-white border-red-600', icon: XCircle },
  returned: { label: 'Đã trả hàng', badge: 'bg-orange-50 text-orange-700 border-orange-200', accent: 'border-l-orange-400', dot: 'bg-orange-500', chip: 'bg-orange-600 text-white border-orange-600', icon: Undo2 },
}

const FALLBACK_META: StatusMeta = {
  label: 'Không rõ',
  badge: 'bg-secondary text-muted-foreground border-border',
  accent: 'border-l-[#E5DFD8]',
  dot: 'bg-[#9A9A9A]',
  chip: 'bg-[#2C2C2C] text-white border-[#2C2C2C]',
  icon: Clock,
}

const RETURN_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const metaOf = (status: string) => STATUS_META[status] ?? { ...FALLBACK_META, label: status }

const FILTERS = ['all', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'returned'] as const
type Filter = (typeof FILTERS)[number]

export default function CustomerOrdersPage() {
  const { toast } = useUI()
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { refreshCounts } = useShop()
  const [buyingAgain, setBuyingAgain] = useState<string | null>(null)
  const [invoicingId, setInvoicingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Hủy đơn — mở hộp xác nhận trước, vì đã hủy là không quay lại được.
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const openCancel = (order: Order) => {
    setCancelTarget(order)
    setCancelReason('')
    setCancelError('')
  }

  const submitCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError('')
    try {
      const updated = await cancelMyOrder(cancelTarget.id, cancelReason.trim())
      // Thay đúng đơn vừa hủy bằng bản mới từ server, khỏi tải lại cả danh sách.
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setCancelTarget(null)
    } catch (err: any) {
      setCancelError(err.message || 'Hủy đơn hàng không thành công')
    } finally {
      setCancelling(false)
    }
  }

  /** Hóa đơn PDF của một đơn, mở ở tab mới để khách xem rồi in hoặc lưu. */
  const handleInvoice = async (orderId: string) => {
    setInvoicingId(orderId)
    try {
      await openOrderInvoice(orderId)
    } catch (error: any) {
      toast(error.message || 'Không mở được hóa đơn', 'error')
    } finally {
      setInvoicingId(null)
    }
  }

  const handleBuyAgain = async (order: Order) => {
    setBuyingAgain(order.id)
    try {
      for (const item of order.items) {
        await addToCart({
          productId: item.productId || (item as any).product_id,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        })
      }
      await refreshCounts()
      router.push('/dashboard/customer/cart')
    } catch (error: any) {
      console.error('Lỗi khi mua lại:', error)
      toast(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng', 'error')
      setBuyingAgain(null)
    }
  }

  const toggleItems = (orderId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.push('/auth/login')
      return
    }
    getMyOrders()
      .then(setOrders)
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [session, isPending, router])

  // Đếm theo trạng thái để hiện số ngay trên từng chip lọc.
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length }
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1
    return map
  }, [orders])

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // Đổi bộ lọc có thể làm trang hiện tại vượt quá số trang mới — kẹp lại cho an toàn.
  const currentPage = Math.min(page, totalPages)
  const pageOrders = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === currentPage) return
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">Lịch Sử Đơn Hàng</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {orders.length > 0
            ? `Bạn đã đặt ${orders.length} đơn hàng tại IKA Fashion.`
            : 'Các đơn bạn đặt sẽ được lưu lại tại đây.'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card rounded-lg border border-border text-center py-16">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-muted-foreground mb-5">Bạn chưa có đơn hàng nào</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
          >
            Khám Phá Sản Phẩm
          </Link>
        </div>
      ) : (
        <>
          {/* Bộ lọc trạng thái — mỗi chip mang đúng tông màu của trạng thái đó */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.filter((f) => f === 'all' || (counts[f] ?? 0) > 0).map((f) => {
              const active = filter === f
              const meta = f === 'all' ? null : metaOf(f)
              return (
                <button
                  key={f}
                  onClick={() => changeFilter(f)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${active
                      ? meta
                        ? meta.chip
                        : 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                      : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                    }`}
                >
                  {meta && (
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : meta.dot}`} />
                  )}
                  {meta ? meta.label : 'Tất cả'}
                  <span className={active ? 'opacity-80' : 'opacity-60'}>({counts[f] ?? 0})</span>
                </button>
              )
            })}
          </div>

          {pageOrders.length === 0 ? (
            <div className="bg-card rounded-lg border border-border text-center py-12">
              <p className="text-muted-foreground">Không có đơn hàng nào ở trạng thái này.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {pageOrders.map((order) => {
                const meta = metaOf(order.status)
                const StatusIcon = meta.icon
                const isOpen = expanded.has(order.id)
                const visibleItems = isOpen ? order.items : order.items.slice(0, ITEMS_PREVIEW)
                const hiddenCount = order.items.length - visibleItems.length
                const rq = order.returnRequest

                return (
                  <div
                    key={order.id}
                    className={`bg-card rounded-lg border border-border border-l-4 ${meta.accent} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
                  >
                    {/* Đầu thẻ: mã đơn, ngày đặt, trạng thái, tổng tiền */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-secondary/40 border-b border-border">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div>
                          <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide">Mã đơn</p>
                          <p className="text-foreground font-mono text-sm font-semibold">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide">Ngày đặt</p>
                          <p className="text-foreground text-sm">
                            {new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${meta.badge}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                        {rq && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${RETURN_BADGE[rq.status] ?? 'bg-secondary text-muted-foreground border-border'
                              }`}
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            {RETURN_TYPE_LABEL[rq.type]}: {RETURN_STATUS_LABEL[rq.status]}
                          </span>
                        )}
                        <div className="text-right">
                          <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide">Tổng tiền</p>
                          <p className="text-accent font-semibold">{order.totalPrice.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div className="px-5 py-4 divide-y divide-border">
                      {visibleItems.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                            {it.img ? (
                              <img src={it.img} alt={it.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">👕</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{it.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {it.color} / {it.size} · SL {it.quantity}
                            </p>
                          </div>
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {it.lineTotal.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}

                      {(hiddenCount > 0 || isOpen) && order.items.length > ITEMS_PREVIEW && (
                        <button
                          onClick={() => toggleItems(order.id)}
                          className="w-full flex items-center justify-center gap-1 pt-3 text-xs font-medium text-muted-foreground hover:text-[#D4AF37] transition-colors cursor-pointer"
                        >
                          {isOpen ? (
                            <>
                              Thu gọn <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Xem thêm {hiddenCount} sản phẩm <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Chân thẻ: địa chỉ giao và các thao tác */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border bg-secondary/20">
                      <p className="text-xs text-muted-foreground min-w-0 truncate">
                        Giao đến: {order.shippingAddress} · {order.phone}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleInvoice(order.id)}
                          disabled={invoicingId === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-medium text-muted-foreground hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {invoicingId === order.id ? 'Đang tạo...' : 'Hóa đơn'}
                        </button>
                        {/* Chỉ mời mua lại khi đơn đã khép lại (hoàn thành hoặc đã hủy) */}
                        {canBuyAgain(order) && (
                          <button
                            onClick={() => handleBuyAgain(order)}
                            disabled={buyingAgain === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-medium text-foreground hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {buyingAgain === order.id ? 'Đang thêm...' : 'Mua lại'}
                          </button>
                        )}
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => openCancel(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Hủy đơn
                          </button>
                        )}
                        <Link
                          href={`/dashboard/customer/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#2C2C2C] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Xem chi tiết →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Phân trang — chỉ hiện khi lịch sử dài hơn một trang */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
              <p className="text-xs text-muted-foreground">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} trong{' '}
                {filtered.length} đơn hàng
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Trang trước"
                    className="inline-flex items-center justify-center w-8 h-8 rounded border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {buildPageList(currentPage, totalPages).map((p, i) =>
                    p === null ? (
                      <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        aria-current={p === currentPage ? 'page' : undefined}
                        aria-label={`Trang ${p}`}
                        className={`w-8 h-8 rounded border text-xs font-medium transition-colors cursor-pointer ${p === currentPage
                            ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                            : 'bg-card text-foreground border-border hover:bg-secondary'
                          }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Trang sau"
                    className="inline-flex items-center justify-center w-8 h-8 rounded border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Hộp xác nhận hủy đơn */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div
            className="bg-card rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-foreground">Hủy đơn hàng</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Đơn #{cancelTarget.id.slice(0, 8).toUpperCase()} ·{' '}
                    {cancelTarget.totalPrice.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                aria-label="Đóng"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {cancelError && (
                <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {cancelError}
                </p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Đơn đã hủy thì không khôi phục lại được, bạn cần đặt lại từ đầu nếu đổi ý.
              </p>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lý do hủy <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/40 text-sm text-foreground outline-none focus:ring-1 focus:ring-[#D4AF37] resize-none"
              />
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={submitCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="px-6 py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60 transition-colors cursor-pointer"
              >
                Giữ đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Danh sách số trang, null là dấu "…" khi phải rút gọn. */
function buildPageList(current: number, total: number, maxVisible = 7): (number | null)[] {
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1)

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(2, current - half)
  let end = Math.min(total - 1, current + half)
  const windowSize = maxVisible - 2

  if (end - start + 1 < windowSize) {
    if (current < total / 2) end = Math.min(total - 1, start + windowSize - 1)
    else start = Math.max(2, end - windowSize + 1)
  }

  const result: (number | null)[] = [1]
  if (start > 2) result.push(null)
  for (let p = start; p <= end; p++) result.push(p)
  if (end < total - 1) result.push(null)
  result.push(total)
  return result
}
