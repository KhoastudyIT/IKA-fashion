'use client'

// =============================================================
// Quản lý Flash Sale — mỗi dòng là MỘT sản phẩm với giá ưu đãi, số suất và
// khung giờ riêng.
//
// Bảng dài dần theo thời gian vì chương trình đã kết thúc vẫn phải giữ lại
// (order_items trỏ về để giải thích giá đơn cũ), nên mặc định chỉ hiện các
// suất đang chạy và lọc theo trạng thái.
// =============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  getAdminFlashSales, createFlashSale, updateFlashSale, toggleFlashSale, endFlashSale,
  isFlashSaleEditable, getProducts, flashStatus, FlashSale, FlashTone, ApiProduct,
} from '@/api'
import { useAdminRole } from '@/lib/permissions'
import { Zap, Plus, X, RefreshCw } from 'lucide-react'

import { useUI } from '@/components/context/UIDialogContext'
const FILTERS: { tone: FlashTone | 'all'; label: string }[] = [
  { tone: 'live', label: 'Đang chạy' },
  { tone: 'pending', label: 'Chưa bắt đầu' },
  { tone: 'soldout', label: 'Hết suất' },
  { tone: 'off', label: 'Tạm ngưng' },
  { tone: 'expired', label: 'Đã kết thúc' },
  { tone: 'all', label: 'Tất cả' },
]

const TONE_STYLE: Record<FlashTone, string> = {
  live: 'bg-green-100 text-green-800',
  pending: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-200 text-gray-600',
  soldout: 'bg-orange-100 text-orange-700',
  off: 'bg-red-100 text-red-700',
}

type FormState = {
  productId: string
  price: string
  discountPct: string
  stock: string
  startsAt: string
  endsAt: string
  active: boolean
}

/** <input type="datetime-local"> cần đúng dạng YYYY-MM-DDTHH:mm theo giờ máy. */
const toLocalInput = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

const vnd = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ'

/**
 * Mã chương trình dựng từ id trong DB — cùng một sản phẩm có thể chạy nhiều đợt
 * nối tiếp nhau, mã giúp phân biệt đợt này với các đợt trước khi tra soát đơn.
 */
const flashCode = (id: number) => `FS-${String(id).padStart(4, '0')}`

export default function AdminFlashSalesPage() {
  const { toast, confirm } = useUI()
  const { canWrite } = useAdminRole()
  const [sales, setSales] = useState<FlashSale[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FlashTone | 'all'>('live')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const [fs, prods] = await Promise.all([
        getAdminFlashSales(),
        getProducts({ limit: 100 }),
      ])
      setSales(fs)
      setProducts(prods.items)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách flash sale')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Đếm sẵn từng nhóm để hiện số trên tab lọc.
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sales.length }
    for (const fs of sales) {
      const t = flashStatus(fs).tone
      c[t] = (c[t] ?? 0) + 1
    }
    return c
  }, [sales])

  const visible = useMemo(
    () => (filter === 'all' ? sales : sales.filter((fs) => flashStatus(fs).tone === filter)),
    [sales, filter],
  )

  // ── Form ───────────────────────────────────────────────────
  const openCreate = () => {
    if (!products.length) {
      setError('Hãy thêm sản phẩm trước khi tạo flash sale')
      return
    }
    const p = products[0]
    setEditingId(null)
    setForm({
      productId: String(p.id),
      price: String(Math.round(p.price * 0.8)),
      discountPct: '20',
      stock: '50',
      startsAt: toLocalInput(new Date()),
      endsAt: toLocalInput(new Date(Date.now() + 24 * 3600 * 1000)),
      active: true,
    })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (fs: FlashSale) => {
    setEditingId(fs.id)
    setForm({
      productId: String(fs.productId),
      price: String(fs.price),
      discountPct: String(fs.discountPercent),
      stock: String(fs.stock),
      startsAt: toLocalInput(new Date(fs.startsAt)),
      endsAt: fs.endsAt ? toLocalInput(new Date(fs.endsAt)) : '',
      active: fs.active,
    })
    setFormError('')
    setShowForm(true)
  }

  /** Giá niêm yết của sản phẩm đang chọn trong form. */
  const selectedListPrice = form
    ? Number(products.find((p) => String(p.id) === form.productId)?.price ?? 0)
    : 0

  // Đổi sản phẩm hoặc đổi % thì tính lại giá; gõ thẳng giá thì tính lại %.
  const setProductId = (productId: string) => {
    const list = Number(products.find((p) => String(p.id) === productId)?.price ?? 0)
    const pct = Number(form?.discountPct || 0)
    setForm((f) => f && { ...f, productId, price: String(Math.round(list * (1 - pct / 100))) })
  }
  const setDiscountPct = (discountPct: string) => {
    const pct = Number(discountPct || 0)
    setForm((f) => f && {
      ...f, discountPct, price: String(Math.round(selectedListPrice * (1 - pct / 100))),
    })
  }
  const setPrice = (price: string) => {
    const p = Number(price || 0)
    const pct = selectedListPrice > 0 && p > 0 && p < selectedListPrice
      ? Math.round((1 - p / selectedListPrice) * 100)
      : 0
    setForm((f) => f && { ...f, price, discountPct: String(pct) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setFormError('')
    try {
      const body = {
        productId: Number(form.productId),
        price: Number(form.price),
        stock: Number(form.stock),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        active: form.active,
      }
      if (editingId) await updateFlashSale(editingId, body)
      else await createFlashSale(body)
      setShowForm(false)
      await load()
    } catch (err: any) {
      setFormError(err.message || 'Lưu flash sale thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (fs: FlashSale) => {
    if (fs.active && !(await confirm({
      title: `Tạm ngưng chương trình cho "${fs.name}"?`,
      message: 'Giá sản phẩm sẽ trở về giá niêm yết ngay lập tức.',
      confirmLabel: 'Tạm ngưng',
      danger: true,
    }))) return
    try {
      await toggleFlashSale(fs.id)
      await load()
    } catch (err: any) {
      toast(err.message || 'Không đổi được trạng thái', 'error')
    }
  }

  const handleEnd = async (fs: FlashSale) => {
    if (!(await confirm({
      title: `Kết thúc hẳn chương trình cho "${fs.name}"?`,
      message: 'Giá trở về niêm yết ngay và sau đó chương trình KHÔNG SỬA ĐƯỢC NỮA. '
        + 'Nếu chỉ muốn dừng tạm thì chọn "Tạm ngưng".',
      confirmLabel: 'Kết thúc hẳn',
      danger: true,
    }))) return
    try {
      await endFlashSale(fs.id)
      await load()
    } catch (err: any) {
      toast(err.message || 'Không kết thúc được chương trình', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
            <Zap className="w-7 h-7 text-[#D4AF37]" /> Flash Sale
          </h1>
          <p className="text-muted-foreground text-sm">
            {canWrite
              ? 'Mỗi chương trình áp cho một sản phẩm, có giá ưu đãi, số suất và khung giờ riêng.'
              : 'Xem các chương trình flash sale đang áp dụng cho từng sản phẩm.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          {canWrite && (
            <button
              onClick={openCreate}
              className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tạo Flash Sale
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Lọc theo trạng thái */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.tone}
            onClick={() => setFilter(f.tone)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              filter === f.tone
                ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                : 'bg-white text-[#2C2C2C] border-[#E5DFD8] hover:bg-[#F9F5F0]'
            }`}
          >
            {f.label} ({counts[f.tone] ?? 0})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Mã</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Sản Phẩm</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Giá Flash</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Suất</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Khung Giờ</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ngày Tạo Mã</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Trạng Thái</th>
                {canWrite && <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canWrite ? 8 : 7} className="text-center py-12 text-muted-foreground">Đang tải flash sale...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="text-center py-12 text-muted-foreground">
                    Không có chương trình nào ở trạng thái này.
                  </td>
                </tr>
              ) : (
                visible.map((fs) => {
                  const st = flashStatus(fs)
                  return (
                    <tr key={fs.id} className="border-b border-[#E5DFD8] last:border-none hover:bg-[#F9F5F0]/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-2.5 py-1 rounded font-mono font-bold text-xs tracking-wider border border-[#D4AF37]/30 whitespace-nowrap">
                          {flashCode(fs.id)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={fs.img} alt={fs.name} className="w-11 h-11 object-cover rounded border border-[#E5DFD8]" />
                          <div>
                            <p className="font-medium text-[#2C2C2C]">{fs.name}</p>
                            <p className="text-[0.6875rem] text-muted-foreground">Giá niêm yết {vnd(fs.productPrice)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-red-600">{vnd(fs.price)}</span>
                        {fs.discountPercent > 0 && (
                          <span className="ml-2 text-[0.625rem] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            -{fs.discountPercent}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-medium text-[#2C2C2C]">{fs.sold}</span>
                        <span className="text-muted-foreground"> / {fs.stock}</span>
                        <p className="text-[0.625rem] text-muted-foreground">còn {fs.remaining}</p>
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        <div>{new Date(fs.startsAt).toLocaleString('vi-VN')}</div>
                        <div>{fs.endsAt ? new Date(fs.endsAt).toLocaleString('vi-VN') : 'Không giới hạn'}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(fs.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${TONE_STYLE[st.tone]}`}>
                          {st.label}
                        </span>
                      </td>
                      {canWrite && (
                        <td className="py-4 px-6 text-right">
                          {/* Không có nút xóa: chương trình chỉ tạm ngưng hoặc
                              kết thúc, để giữ lịch sử giá của đơn đã mua.
                              Đã kết thúc thì đóng băng, không còn thao tác nào. */}
                          <div className="flex gap-3 justify-end items-center">
                            {isFlashSaleEditable(fs) ? (
                              <>
                                <button onClick={() => openEdit(fs)} className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer">
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleToggle(fs)}
                                  className={`text-xs font-semibold hover:underline cursor-pointer ${
                                    fs.active ? 'text-amber-600' : 'text-green-600'
                                  }`}
                                >
                                  {fs.active ? 'Tạm ngưng' : 'Bật lại'}
                                </button>
                                <button
                                  onClick={() => handleEnd(fs)}
                                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                                >
                                  Kết thúc
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Đã kết thúc</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && form && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-[#2C2C2C] flex items-center gap-2">
                {editingId ? 'Sửa Flash Sale' : 'Tạo Flash Sale'}
                {editingId && (
                  <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded font-mono font-bold text-xs tracking-wider border border-[#D4AF37]/30">
                    {flashCode(editingId)}
                  </span>
                )}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {formError && <p className="text-red-600 mb-4 text-sm">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Sản Phẩm *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {vnd(p.price)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">% Giảm</label>
                  <input
                    type="number" min="1" max="99"
                    value={form.discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Giá Flash *</label>
                  <input
                    required type="number" min="1"
                    value={form.price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground -mt-2">
                Giá niêm yết hiện tại: <strong className="text-[#2C2C2C]">{vnd(selectedListPrice)}</strong>.
                Giá flash phải thấp hơn con số này.
              </p>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Số Suất *</label>
                <input
                  required type="number" min="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                  Bán hết số suất này là chương trình tự dừng, giá quay về niêm yết.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Bắt Đầu *</label>
                  <input
                    required type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Kết Thúc</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">Bỏ trống = chạy tới khi tắt tay.</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#2C2C2C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-[#D4AF37]"
                />
                Bật chương trình ngay
              </label>
              <p className="text-[0.6875rem] text-muted-foreground -mt-2">
                Một sản phẩm chỉ được có một chương trình đang bật trong cùng khung giờ.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-[#E5DFD8] text-[#2C2C2C] font-semibold rounded hover:bg-[#F9F5F0] transition-colors cursor-pointer text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
