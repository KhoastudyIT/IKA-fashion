'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/auth-client'
import {
  getMyOrders, createReturnRequest, canRequestReturn, uploadImage, validateImageFile,
  RETURN_WINDOW_DAYS, RETURN_TYPE_LABEL, RETURN_STATUS_LABEL,
  Order, ReturnType, addToCart, openOrderInvoice,
  canCancelOrder, cancelMyOrder, canCancelReturn, cancelMyReturn, canBuyAgain,
} from '@/api'
import { useShop } from '@/components/context/ShopContext'
import { ArrowLeft, Package, MapPin, Phone, Clock, RotateCcw, Undo2, X, ImagePlus, Ban } from 'lucide-react'

// Khớp với ràng buộc ở backend (return.schema.js).
const MIN_RETURN_IMAGES = 2
const MAX_RETURN_IMAGES = 5

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:   { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', step: 0 },
  confirmed: { label: 'Đã xác nhận',  color: '#1e40af', bg: '#dbeafe', step: 1 },
  shipped:   { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', step: 2 },
  completed: { label: 'Đã giao',      color: '#065f46', bg: '#d1fae5', step: 3 },
  cancelled: { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2', step: -1 },
  returned:  { label: 'Đã trả hàng',  color: '#9a3412', bg: '#ffedd5', step: -1 },
}

/** Màu badge theo trạng thái yêu cầu trả/đổi. */
const RETURN_TONE: Record<string, { color: string; bg: string }> = {
  pending:   { color: '#92400e', bg: '#fef3c7' },
  approved:  { color: '#1e40af', bg: '#dbeafe' },
  rejected:  { color: '#991b1b', bg: '#fee2e2' },
  completed: { color: '#065f46', bg: '#d1fae5' },
  cancelled: { color: '#57534e', bg: '#e7e5e4' },
}

const TIMELINE = [
  { key: 'pending',   label: 'Đặt hàng',     icon: '🛒', sub: 'Đơn hàng đã được tạo' },
  { key: 'confirmed', label: 'Xác nhận',      icon: '✅', sub: 'Shop đã xác nhận đơn' },
  { key: 'shipped',   label: 'Đang giao',     icon: '🚚', sub: 'Đang trên đường giao' },
  { key: 'completed', label: 'Đã nhận hàng',  icon: '🎉', sub: 'Giao hàng thành công' },
]

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { refreshCounts } = useShop()
  const [buyingAgain, setBuyingAgain] = useState(false)
  const [invoicing, setInvoicing] = useState(false)

  /** Hóa đơn PDF do backend dựng — mở tab mới để khách xem, in hoặc lưu lại. */
  const handleInvoice = async () => {
    if (!order) return
    setInvoicing(true)
    try {
      await openOrderInvoice(order.id)
    } catch (error: any) {
      alert(error.message || 'Không mở được hóa đơn')
    } finally {
      setInvoicing(false)
    }
  }

  const handleBuyAgain = async () => {
    if (!order) return
    setBuyingAgain(true)
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
      alert(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng')
      setBuyingAgain(false)
    }
  }

  // Hủy đơn — hỏi lại trước khi gọi API vì đã hủy là không quay lại được.
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const handleCancelOrder = async () => {
    if (!order) return
    setCancelling(true)
    setCancelError('')
    try {
      const updated = await cancelMyOrder(order.id, cancelReason.trim())
      setOrder(updated)
      setShowCancel(false)
      setCancelReason('')
    } catch (err: any) {
      setCancelError(err.message || 'Hủy đơn hàng không thành công')
    } finally {
      setCancelling(false)
    }
  }

  // Rút lại yêu cầu trả / đổi — xác nhận ngay tại chỗ, không cần hộp thoại riêng.
  const [confirmDropReturn, setConfirmDropReturn] = useState(false)
  const [droppingReturn, setDroppingReturn] = useState(false)
  const [dropReturnError, setDropReturnError] = useState('')

  const handleCancelReturn = async () => {
    if (!order?.returnRequest) return
    setDroppingReturn(true)
    setDropReturnError('')
    try {
      await cancelMyReturn(order.returnRequest.id)
      setConfirmDropReturn(false)
      await loadOrder()
    } catch (err: any) {
      setDropReturnError(err.message || 'Hủy yêu cầu không thành công')
    } finally {
      setDroppingReturn(false)
    }
  }

  // Yêu cầu trả / đổi
  const [showReturn, setShowReturn] = useState(false)
  const [returnType, setReturnType] = useState<ReturnType>('return')
  const [reason, setReason] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [returnError, setReturnError] = useState('')

  const handlePickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // cho phép chọn lại đúng file vừa xóa
    if (!files.length) return

    const room = MAX_RETURN_IMAGES - images.length
    if (files.length > room) {
      setReturnError(`Chỉ đính kèm được tối đa ${MAX_RETURN_IMAGES} ảnh`)
      return
    }
    setUploading(true)
    setReturnError('')
    try {
      const urls: string[] = []
      for (const file of files) {
        const invalid = validateImageFile(file)
        if (invalid) throw new Error(invalid)
        urls.push(await uploadImage(file, 'returns'))
      }
      setImages((prev) => [...prev, ...urls])
    } catch (err: any) {
      setReturnError(err.message || 'Tải ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  const loadOrder = () =>
    getMyOrders()
      .then((orders) => setOrder(orders.find(o => o.id === params.id) ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => {
    if (isPending) return
    if (!session) { router.push('/auth/login'); return }
    loadOrder()
  }, [session, isPending, router, params.id])

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    // Kiểm tra tại chỗ: <input type="file"> không có thuộc tính "số lượng tối
    // thiểu" nên trình duyệt không tự chặn giúp được.
    if (images.length < MIN_RETURN_IMAGES) {
      setReturnError(`Vui lòng đính kèm ít nhất ${MIN_RETURN_IMAGES} ảnh sản phẩm`)
      return
    }
    setSending(true)
    setReturnError('')
    try {
      await createReturnRequest({ orderId: order.id, type: returnType, reason: reason.trim(), images })
      setShowReturn(false)
      setReason('')
      setImages([])
      await loadOrder()
    } catch (err: any) {
      setReturnError(err.message || 'Gửi yêu cầu thất bại')
    } finally {
      setSending(false)
    }
  }

  if (isPending || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5DFD8', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>Đang tải...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#2C2C2C', marginBottom: '8px' }}>Không tìm thấy đơn hàng</h1>
          <Link href="/dashboard/customer/orders" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    )
  }

  const status = STATUS_MAP[order.status] ?? { label: order.status, color: '#2C2C2C', bg: '#F9F5F0', step: 0 }
  const isCancelled = order.status === 'cancelled' || order.status === 'returned'
  const rq = order.returnRequest
  const canRequest = canRequestReturn(order)
  // Hết hạn = đơn đã giao xong, chưa từng gửi yêu cầu, mà nút vẫn không bật.
  const windowClosed = order.status === 'completed' && !rq && !canRequest

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/dashboard/customer/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A7A7A', textDecoration: 'none', fontSize: '0.875rem' }} className="print:hidden">
          <ArrowLeft size={16} /> Đơn hàng của tôi
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleInvoice}
            disabled={invoicing}
            className="print:hidden px-3 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] text-sm rounded hover:bg-[#E5DFD8] disabled:opacity-60 transition-colors cursor-pointer"
            style={{ color: '#2C2C2C', fontWeight: 600 }}
          >
            📄 {invoicing ? 'Đang tạo...' : 'Xuất Hóa Đơn'}
          </button>
          {canCancelOrder(order) && (
            <button
              onClick={() => { setCancelError(''); setShowCancel(true) }}
              className="print:hidden px-3 py-1.5 border border-red-200 text-sm rounded hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              style={{ color: '#dc2626', fontWeight: 600 }}
            >
              <Ban size={14} /> Hủy Đơn
            </button>
          )}
          <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <div>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.75rem', color: '#7A7A7A', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mã đơn hàng</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#9A9A9A', marginTop: '6px' }}>
            <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="print:hidden" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #E5DFD8', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '24px' }}>
              Trạng thái đơn hàng
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {TIMELINE.map((t, i) => {
                const done = i <= status.step
                const active = i === status.step
                return (
                  <div key={t.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Connector line */}
                    {i < TIMELINE.length - 1 && (
                      <div style={{
                        position: 'absolute', top: '18px', left: '50%', width: '100%', height: '3px',
                        background: i < status.step ? '#D4AF37' : '#E5DFD8', zIndex: 0, transition: 'background 0.4s',
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', zIndex: 1,
                      background: done ? '#D4AF37' : '#FFFFFF',
                      border: `3px solid ${done ? '#D4AF37' : '#E5DFD8'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', boxShadow: active ? '0 0 0 6px rgba(212,175,55,0.15)' : 'none',
                      transition: 'all 0.4s',
                    }}>
                      {t.icon}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: active ? 700 : done ? 600 : 400, color: done ? '#2C2C2C' : '#9A9A9A', textAlign: 'center' }}>{t.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.625rem', color: '#9A9A9A', textAlign: 'center' }}>{t.sub}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem' }}>❌</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#991b1b' }}>Đơn hàng đã bị hủy</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#b91c1c' }}>
                {order.cancelReason
                  ? `Lý do: ${order.cancelReason}`
                  : 'Vui lòng liên hệ hỗ trợ nếu bạn có thắc mắc.'}
              </p>
            </div>
          </div>
        )}

        {order.status === 'returned' && (
          <div style={{ background: '#ffedd5', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem' }}>↩️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#9a3412' }}>Đơn hàng đã được trả</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#c2410c' }}>
                {order.paymentStatus === 'refunded'
                  ? 'Cửa hàng đã hoàn tiền cho đơn này.'
                  : 'Cửa hàng đã nhận lại hàng.'}
              </p>
            </div>
          </div>
        )}

        {/* Trạng thái yêu cầu trả / đổi */}
        {rq && (
          <div className="print:hidden" style={{
            background: '#FFFFFF', border: '1px solid #E5DFD8', borderRadius: '12px',
            padding: '20px', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Undo2 size={17} style={{ color: '#D4AF37' }} />
              <span style={{ fontWeight: 600, color: '#2C2C2C', fontSize: '0.875rem' }}>
                Yêu cầu {RETURN_TYPE_LABEL[rq.type].toLowerCase()}
              </span>
              <span style={{
                padding: '3px 12px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700,
                background: RETURN_TONE[rq.status].bg, color: RETURN_TONE[rq.status].color,
              }}>
                {RETURN_STATUS_LABEL[rq.status]}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9A9A9A', marginLeft: 'auto' }}>
                Gửi lúc {new Date(rq.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7A7A7A', lineHeight: 1.6 }}>
              <strong style={{ color: '#2C2C2C' }}>Lý do của bạn:</strong> {rq.reason}
            </p>
            {rq.images?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {rq.images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                    <img
                      src={src}
                      alt="Ảnh đính kèm"
                      style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E5DFD8' }}
                    />
                  </a>
                ))}
              </div>
            )}
            {rq.adminNote && (
              <p style={{ margin: '10px 0 0', fontSize: '0.8125rem', color: '#7A7A7A', lineHeight: 1.6, background: '#F9F5F0', padding: '10px 12px', borderRadius: '8px' }}>
                <strong style={{ color: '#2C2C2C' }}>Phản hồi từ cửa hàng:</strong> {rq.adminNote}
              </p>
            )}
            {rq.status === 'rejected' && (
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>
                Yêu cầu bị từ chối. Bạn có thể gửi lại nếu bổ sung được thông tin.
              </p>
            )}
            {rq.status === 'cancelled' && (
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#7A7A7A' }}>
                Bạn đã rút lại yêu cầu này. Nếu vẫn cần, hãy gửi yêu cầu mới khi đơn còn trong hạn đổi trả.
              </p>
            )}

            {/* Rút lại yêu cầu — chỉ khi cửa hàng chưa duyệt */}
            {canCancelReturn(rq) && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F0EBE5' }}>
                {dropReturnError && (
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#b91c1c' }}>{dropReturnError}</p>
                )}
                {confirmDropReturn ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#2C2C2C' }}>
                      Rút lại yêu cầu này? Bạn vẫn gửi lại được nếu đơn còn trong hạn.
                    </span>
                    <button
                      onClick={handleCancelReturn}
                      disabled={droppingReturn}
                      className="cursor-pointer"
                      style={{
                        padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#dc2626',
                        color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700,
                        opacity: droppingReturn ? 0.6 : 1,
                      }}
                    >
                      {droppingReturn ? 'Đang hủy...' : 'Rút yêu cầu'}
                    </button>
                    <button
                      onClick={() => setConfirmDropReturn(false)}
                      disabled={droppingReturn}
                      className="cursor-pointer"
                      style={{
                        padding: '7px 16px', borderRadius: '8px', border: '1px solid #E5DFD8',
                        background: 'transparent', color: '#2C2C2C', fontSize: '0.75rem', fontWeight: 600,
                      }}
                    >
                      Giữ lại
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDropReturnError(''); setConfirmDropReturn(true) }}
                    className="cursor-pointer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '8px', border: '1px solid #E5DFD8',
                      background: 'transparent', color: '#7A7A7A', fontSize: '0.75rem', fontWeight: 600,
                    }}
                  >
                    <X size={13} /> Hủy yêu cầu
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Nút gửi yêu cầu */}
        {canRequest && (
          <div className="print:hidden" style={{
            background: '#F9F5F0', border: '1px solid #E5DFD8', borderRadius: '12px',
            padding: '20px', marginBottom: '24px',
            display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#2C2C2C', fontSize: '0.875rem' }}>
                Sản phẩm chưa vừa ý?
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#7A7A7A' }}>
                Bạn được trả hàng hoặc đổi mới trong {RETURN_WINDOW_DAYS} ngày kể từ khi nhận hàng.
              </p>
            </div>
            <button
              onClick={() => { setReturnError(''); setShowReturn(true) }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', background: '#2C2C2C', color: '#FFFFFF',
                border: 'none', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Undo2 size={15} /> Yêu cầu trả / đổi hàng
            </button>
          </div>
        )}

        {windowClosed && (
          <div className="print:hidden" style={{ background: '#F9F5F0', border: '1px solid #E5DFD8', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7A7A7A' }}>
              Đã quá {RETURN_WINDOW_DAYS} ngày kể từ khi đơn hoàn thành nên không còn yêu cầu trả/đổi được.
              Liên hệ cửa hàng nếu bạn cần hỗ trợ thêm.
            </p>
          </div>
        )}

        <div className="print:block print:w-full print:max-w-none print:p-0" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Products */}
          <div className="print:shadow-none print:border-none print:bg-transparent print:p-0 print:w-full" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', border: '1px solid #E5DFD8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Package size={18} style={{ color: '#D4AF37' }} />
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
                Sản phẩm đã mua ({order.items.length})
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingBottom: '16px', borderBottom: i < order.items.length - 1 ? '1px solid #F0EBE5' : 'none' }}>
                  <div style={{ width: '64px', height: '64px', background: '#F9F5F0', borderRadius: '8px', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.img ? <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>👕</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#2C2C2C' }}>{item.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#7A7A7A' }}>
                      Màu: {item.color} &nbsp;·&nbsp; Size: {item.size} &nbsp;·&nbsp; Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#2C2C2C' }}>{item.lineTotal.toLocaleString('vi-VN')}đ</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: '#9A9A9A' }}>{item.price.toLocaleString('vi-VN')} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reorder CTA — chỉ mời mua lại khi đơn đã khép lại (hoàn thành hoặc đã hủy) */}
            {canBuyAgain(order) && (
              <button
                onClick={handleBuyAgain}
                disabled={buyingAgain}
                className="print:hidden"
                style={{
                  width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', border: '1.5px solid #2C2C2C', borderRadius: '8px', background: 'transparent',
                  fontSize: '0.8125rem', fontWeight: 600, color: '#2C2C2C', cursor: buyingAgain ? 'wait' : 'pointer', opacity: buyingAgain ? 0.7 : 1,
                }}
              >
                <RotateCcw size={15} /> {buyingAgain ? 'Đang thêm...' : 'Mua lại đơn hàng'}
              </button>
            )}
          </div>

          {/* Sidebar */}
          <div className="print:w-full" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Order summary */}
            <div className="print:shadow-none print:border-none print:bg-transparent print:p-0 print:w-full" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5DFD8' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9375rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '16px' }}>Tóm tắt đơn hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                {/* totalPrice = tiền hàng − giảm giá + phí ship, nên tạm tính phải
                    cộng lại phần giảm và gỡ phí ship ra. Trước đây dòng vận chuyển
                    in cứng "Miễn phí" nên đơn giao hỏa tốc vẫn hiện miễn phí dù
                    khách đã trả 60.000đ, và dòng giảm giá thì thiếu hẳn. */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A7A7A' }}>
                  <span>Tạm tính</span>
                  <span style={{ color: '#2C2C2C' }}>
                    {(order.totalPrice + order.discount - order.shippingFee).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A7A7A' }}>
                  <span>Vận chuyển</span>
                  <span style={{ color: order.shippingFee > 0 ? '#2C2C2C' : '#22c55e' }}>
                    {order.shippingFee > 0 ? `${order.shippingFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A7A7A' }}>
                    <span>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span style={{ color: '#22c55e' }}>−{order.discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5DFD8', paddingTop: '10px', fontWeight: 700, fontSize: '0.9375rem', color: '#2C2C2C' }}>
                  <span>Tổng cộng</span><span style={{ color: '#D4AF37' }}>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            <div className="print:shadow-none print:border-none print:bg-transparent print:p-0 print:w-full" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5DFD8' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9375rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '16px' }}>Thông tin giao hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem', color: '#2C2C2C' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={15} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.6 }}>{order.shippingAddress}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Phone size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
                  <a href={`tel:${order.phone}`} style={{ color: '#2C2C2C', textDecoration: 'none' }}>{order.phone}</a>
                </div>
                {order.notes && (
                  <div style={{ background: '#F9F5F0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.75rem', color: '#7A7A7A', lineHeight: 1.6 }}>
                    📝 {order.notes}
                  </div>
                )}
              </div>
            </div>

            <Link href="/dashboard/customer/orders" className="print:hidden" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: '#2C2C2C', color: '#FFFFFF',
              borderRadius: '8px', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <ArrowLeft size={15} /> Tất cả đơn hàng
            </Link>
          </div>
        </div>
      </div>

      {/* Hộp xác nhận hủy đơn */}
      {showCancel && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => !cancelling && setShowCancel(false)}
        >
          <div
            style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '22px 26px', borderBottom: '1px solid #E5DFD8' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ban size={19} />
              </span>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
                  Hủy đơn hàng
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#7A7A7A' }}>
                  Đơn #{order.id.slice(0, 8).toUpperCase()} · {order.totalPrice.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>

            <div style={{ padding: '22px 26px' }}>
              {cancelError && (
                <p style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8125rem', margin: '0 0 16px' }}>
                  {cancelError}
                </p>
              )}
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#7A7A7A', lineHeight: 1.6 }}>
                Đơn đã hủy thì không khôi phục lại được, bạn cần đặt lại từ đầu nếu đổi ý.
              </p>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '8px' }}>
                Lý do hủy <span style={{ fontWeight: 400, color: '#9A9A9A' }}>(không bắt buộc)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5DFD8',
                  background: '#F9F5F0', fontSize: '0.8125rem', color: '#2C2C2C', resize: 'none',
                  fontFamily: 'inherit', outline: 'none', lineHeight: 1.6,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', padding: '0 26px 22px' }}>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="cursor-pointer"
                style={{
                  flex: 1, padding: '13px', background: '#dc2626', color: '#FFFFFF', border: 'none',
                  borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 700, opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
              <button
                onClick={() => setShowCancel(false)}
                disabled={cancelling}
                className="cursor-pointer"
                style={{
                  padding: '13px 24px', background: 'transparent', color: '#2C2C2C',
                  border: '1px solid #E5DFD8', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 600,
                }}
              >
                Giữ đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gửi yêu cầu trả / đổi */}
      {showReturn && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setShowReturn(false)}
        >
          {/* Bố cục 3 tầng: tiêu đề và hàng nút đứng yên, chỉ phần giữa cuộn —
              khung ảnh đính kèm khá cao, không nên đẩy nút Gửi ra khỏi màn hình. */}
          <form
            onSubmit={handleSubmitReturn}
            style={{
              background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '760px',
              maxHeight: '92vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 32px', borderBottom: '1px solid #E5DFD8', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
                  Yêu Cầu Trả / Đổi Hàng
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#7A7A7A' }}>
                  Đơn #{order.id.slice(0, 8).toUpperCase()} · áp dụng cho toàn bộ đơn
                </p>
              </div>
              <button onClick={() => setShowReturn(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#7A7A7A' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 32px', overflowY: 'auto' }}>
              {returnError && (
                <p style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', fontSize: '0.8125rem', marginBottom: '20px' }}>
                  {returnError}
                </p>
              )}

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '10px' }}>
                Bạn muốn làm gì?
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {(['return', 'exchange'] as ReturnType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReturnType(t)}
                    style={{
                      flex: 1, padding: '18px 16px', borderRadius: '10px', cursor: 'pointer',
                      border: returnType === t ? '2px solid #D4AF37' : '1px solid #E5DFD8',
                      background: returnType === t ? '#FDF9F0' : '#FFFFFF',
                      textAlign: 'left',
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#2C2C2C' }}>
                      {RETURN_TYPE_LABEL[t]}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#7A7A7A', lineHeight: 1.5 }}>
                      {t === 'return' ? 'Gửi hàng về và nhận lại tiền' : 'Đổi sang sản phẩm cùng loại'}
                    </p>
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '10px' }}>
                Lý do *
              </label>
              <textarea
                required
                minLength={10}
                maxLength={500}
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vd: Áo bị lỗi đường may ở tay phải, em muốn đổi sang chiếc khác."
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E5DFD8',
                  background: '#F9F5F0', fontSize: '0.875rem', color: '#2C2C2C', resize: 'vertical',
                  fontFamily: 'inherit', outline: 'none', lineHeight: 1.6,
                }}
              />
              <p style={{ margin: '8px 0 24px', fontSize: '0.75rem', color: '#9A9A9A' }}>
                {reason.trim().length}/500 ký tự — mô tả càng rõ càng được xử lý nhanh (tối thiểu 10 ký tự).
              </p>

              {/* Ảnh đính kèm — cửa hàng đối chiếu với lý do trước khi duyệt */}
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '4px' }}>
                Ảnh sản phẩm * <span style={{ fontWeight: 400, color: '#9A9A9A' }}>(ít nhất {MIN_RETURN_IMAGES} ảnh)</span>
              </label>
              <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#9A9A9A', lineHeight: 1.6 }}>
                Cần ít nhất {MIN_RETURN_IMAGES} ảnh để cửa hàng đối chiếu — nên có một ảnh toàn bộ sản phẩm
                và một ảnh chụp cận chỗ lỗi. Tối đa {MAX_RETURN_IMAGES} ảnh, JPG/PNG/WEBP dưới 5MB.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {images.map((src) => (
                  <div key={src} style={{ position: 'relative' }}>
                    <img
                      src={src}
                      alt="Ảnh đính kèm"
                      style={{ width: '92px', height: '92px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #E5DFD8', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((u) => u !== src))}
                      aria-label="Xóa ảnh"
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px',
                        borderRadius: '50%', background: '#dc2626', color: '#fff', border: '2px solid #fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {images.length < MAX_RETURN_IMAGES && (
                  <label
                    style={{
                      width: '92px', height: '92px', borderRadius: '10px', border: '1.5px dashed #D4AF37',
                      background: '#FDF9F0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: '4px', cursor: uploading ? 'wait' : 'pointer',
                      color: '#D4AF37', opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    <ImagePlus size={20} />
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                      {uploading ? 'Đang tải...' : 'Thêm ảnh'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploading}
                      onChange={handlePickImages}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              <p style={{
                margin: 0, fontSize: '0.75rem', fontWeight: 600,
                color: images.length < MIN_RETURN_IMAGES ? '#b45309' : '#15803d',
              }}>
                {images.length < MIN_RETURN_IMAGES
                  ? `Đã chọn ${images.length}/${MAX_RETURN_IMAGES} ảnh — cần thêm ${MIN_RETURN_IMAGES - images.length} ảnh nữa`
                  : `Đã chọn ${images.length}/${MAX_RETURN_IMAGES} ảnh`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', padding: '20px 32px', borderTop: '1px solid #E5DFD8', background: '#FFFDFA', flexShrink: 0 }}>
              <button
                type="submit"
                disabled={sending || uploading || images.length < MIN_RETURN_IMAGES}
                style={{
                  flex: 1, padding: '15px', background: '#2C2C2C', color: '#FFFFFF', border: 'none',
                  borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700,
                  cursor: sending || uploading || images.length < MIN_RETURN_IMAGES ? 'not-allowed' : 'pointer',
                  opacity: sending || uploading || images.length < MIN_RETURN_IMAGES ? 0.5 : 1,
                }}
              >
                {sending ? 'Đang gửi...'
                  : uploading ? 'Đang tải ảnh...'
                  : images.length < MIN_RETURN_IMAGES ? `Cần thêm ${MIN_RETURN_IMAGES - images.length} ảnh`
                  : 'Gửi Yêu Cầu'}
              </button>
              <button
                type="button"
                onClick={() => setShowReturn(false)}
                style={{
                  padding: '15px 32px', background: 'transparent', color: '#2C2C2C',
                  border: '1px solid #E5DFD8', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
