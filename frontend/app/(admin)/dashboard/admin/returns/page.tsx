'use client'

// =============================================================
// Xử lý yêu cầu trả hàng / đổi mới.
//
// Luồng: khách gửi (chờ duyệt) → admin duyệt hoặc từ chối → khi nhận được hàng
// gửi về thì bấm hoàn tất. Chỉ bước hoàn tất của loại "trả hàng" mới hoàn kho,
// hoàn suất flash sale và đánh dấu đơn là đã hoàn tiền.
// =============================================================

import { useEffect, useState } from 'react'
import {
  getAdminReturns, updateReturnStatus,
  RETURN_TYPE_LABEL, RETURN_STATUS_LABEL,
  OrderReturn, ReturnStatus,
} from '@/api'
import AdminPagination from '@/components/ui/AdminPagination'
import { useSearchParams } from 'next/navigation'
import { Undo2, RefreshCw, X } from 'lucide-react'

const PAGE_SIZE = 15

const FILTERS: { value: ReturnStatus | ''; label: string }[] = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'completed', label: 'Đã xử lý xong' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'cancelled', label: 'Khách đã hủy' },
  { value: '', label: 'Tất cả' },
]

const STATUS_STYLE: Record<ReturnStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
}

/** Bước tiếp theo hợp lệ — khớp với NEXT_STATUSES ở backend. */
const NEXT: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['completed', 'rejected'],
  rejected: [],
  completed: [],
  // Khách tự rút — admin không mở lại được, khách phải gửi yêu cầu mới.
  cancelled: [],
}

const ACTION_LABEL: Record<ReturnStatus, string> = {
  approved: 'Duyệt',
  rejected: 'Từ chối',
  completed: 'Hoàn tất',
  pending: 'Chờ duyệt',
  cancelled: 'Khách đã hủy',
}

const vnd = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ'

export default function AdminReturnsPage() {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  const [items, setItems] = useState<OrderReturn[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ReturnStatus | ''>('pending')

  // Hộp thoại xác nhận thao tác
  const [acting, setActing] = useState<{ item: OrderReturn; next: ReturnStatus } | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [actError, setActError] = useState('')

  const load = async (page: number, status: ReturnStatus | '') => {
    try {
      setLoading(true)
      const res = await getAdminReturns({
        page, limit: PAGE_SIZE, ...(status ? { status } : {}),
      })
      setItems(res.items)
      setTotalPages(res.pagination?.totalPages ?? 1)
      setTotal(res.pagination?.total ?? res.items.length)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(currentPage, filter) }, [currentPage, filter])

  const openAction = (item: OrderReturn, next: ReturnStatus) => {
    setActing({ item, next })
    setNote(item.adminNote ?? '')
    setActError('')
  }

  const submitAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acting) return
    setSaving(true)
    setActError('')
    try {
      await updateReturnStatus(acting.item.id, {
        status: acting.next,
        adminNote: note.trim() || undefined,
      })
      setActing(null)
      await load(currentPage, filter)
    } catch (err: any) {
      setActError(err.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
            <Undo2 className="w-7 h-7 text-[#D4AF37]" /> Trả / Đổi Hàng
          </h1>
          <p className="text-muted-foreground text-sm">
            Xét duyệt yêu cầu trả hàng và đổi mới của khách. Hoàn tất một yêu cầu trả hàng
            sẽ tự hoàn kho và đánh dấu đơn đã hoàn tiền.
          </p>
        </div>
        <button
          onClick={() => load(currentPage, filter)}
          className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
          title="Tải lại danh sách"
        >
          <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              filter === f.value
                ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                : 'bg-white text-[#2C2C2C] border-[#E5DFD8] hover:bg-[#F9F5F0]'
            }`}
          >
            {f.label}
            {filter === f.value ? ` (${total})` : ''}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Đơn Hàng</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Khách Hàng</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Loại</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Lý Do</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ngày Gửi</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Trạng Thái</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Đang tải yêu cầu...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Không có yêu cầu nào ở trạng thái này.</td></tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-b border-[#E5DFD8] last:border-none hover:bg-[#F9F5F0]/30 transition-colors align-top">
                    <td className="py-4 px-6">
                      <p className="font-medium text-[#2C2C2C]">#{r.orderId.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{vnd(r.orderTotal ?? 0)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-[#2C2C2C]">{r.customerName}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{r.customerPhone}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        r.type === 'return' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {RETURN_TYPE_LABEL[r.type]}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-[280px]">
                      <p className="text-[#2C2C2C] text-xs leading-relaxed">{r.reason}</p>
                      {r.images?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {r.images.map((src) => (
                            <a key={src} href={src} target="_blank" rel="noopener noreferrer" title="Xem ảnh gốc">
                              <img
                                src={src}
                                alt="Ảnh khách gửi"
                                className="w-11 h-11 object-cover rounded border border-[#E5DFD8] hover:ring-2 hover:ring-[#D4AF37] transition-all"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      {r.adminNote && (
                        <p className="text-[0.6875rem] text-muted-foreground mt-1.5 italic">Ghi chú: {r.adminNote}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLE[r.status]}`}>
                        {RETURN_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-3 justify-end items-center">
                        {NEXT[r.status].length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Đã chốt</span>
                        ) : (
                          NEXT[r.status].map((next) => (
                            <button
                              key={next}
                              onClick={() => openAction(r, next)}
                              className={`text-xs font-semibold hover:underline cursor-pointer ${
                                next === 'rejected' ? 'text-red-600'
                                  : next === 'completed' ? 'text-green-600' : 'text-[#D4AF37]'
                              }`}
                            >
                              {ACTION_LABEL[next]}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5DFD8] flex justify-end">
            <AdminPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Hộp thoại xác nhận */}
      {acting && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setActing(null)}>
          {/* Bố cục 3 tầng: tiêu đề và hàng nút đứng yên, chỉ phần giữa cuộn —
              lý do của khách có thể dài, không nên đẩy nút Xác Nhận ra khỏi màn hình. */}
          <form
            onSubmit={submitAction}
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-8 py-5 border-b border-[#E5DFD8] shrink-0">
              <div>
                <h2 className="text-2xl font-heading font-semibold text-[#2C2C2C]">
                  {ACTION_LABEL[acting.next]} yêu cầu
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {RETURN_TYPE_LABEL[acting.item.type]} · đơn #{acting.item.orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button type="button" onClick={() => setActing(null)} className="p-2 hover:bg-[#F9F5F0] rounded-full cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Mã đơn', value: `#${acting.item.orderId.slice(0, 8).toUpperCase()}` },
                  { label: 'Giá trị đơn', value: vnd(acting.item.orderTotal ?? 0) },
                  { label: 'Khách hàng', value: acting.item.customerName ?? '—' },
                ].map((f) => (
                  <div key={f.label} className="bg-[#F9F5F0] border border-[#E5DFD8] rounded-lg px-4 py-3">
                    <p className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                    <p className="text-sm font-semibold text-[#2C2C2C] break-words">{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#F9F5F0] border border-[#E5DFD8] rounded-lg px-4 py-3">
                <p className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Lý do khách nêu</p>
                <p className="text-sm text-[#2C2C2C] leading-relaxed whitespace-pre-wrap">{acting.item.reason}</p>
              </div>

              {/* Ảnh khách gửi kèm — đối chiếu với lý do trước khi quyết định */}
              {acting.item.images?.length > 0 ? (
                <div>
                  <p className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Ảnh khách gửi ({acting.item.images.length}) — bấm để xem cỡ lớn
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {acting.item.images.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt="Ảnh khách gửi"
                          className="w-32 h-32 object-cover rounded-lg border border-[#E5DFD8] hover:ring-2 hover:ring-[#D4AF37] transition-all"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Khách không đính kèm ảnh nào.</p>
              )}

              {acting.next === 'completed' && acting.item.type === 'return' && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 leading-relaxed">
                  Hoàn tất sẽ trả hàng về kho, hoàn lại suất flash sale (nếu có) và đánh dấu đơn
                  là đã trả hàng / đã hoàn tiền. Chỉ bấm khi đã nhận được hàng gửi về.
                </p>
              )}
              {acting.next === 'completed' && acting.item.type === 'exchange' && (
                <p className="text-sm text-muted-foreground bg-[#F9F5F0] border border-[#E5DFD8] rounded-lg px-4 py-3 leading-relaxed">
                  Đổi mới không thay đổi tồn kho (một sản phẩm nhận về, một sản phẩm gửi đi)
                  và đơn vẫn giữ trạng thái hoàn thành.
                </p>
              )}

              {actError && (
                <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">{actError}</p>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
                  Phản hồi cho khách {acting.next === 'rejected' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  required={acting.next === 'rejected'}
                  maxLength={500}
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={acting.next === 'rejected'
                    ? 'Nêu rõ lý do từ chối để khách hiểu...'
                    : 'Ghi chú thêm (không bắt buộc)'}
                  className="w-full px-4 py-3 bg-[#F9F5F0] border border-[#E5DFD8] rounded-lg text-sm text-[#2C2C2C] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] resize-y"
                />
                <div className="flex justify-between mt-1.5 text-[0.6875rem] text-muted-foreground">
                  <span>Nội dung này hiện trong trang chi tiết đơn của khách.</span>
                  <span>{note.length}/500</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-8 py-5 border-t border-[#E5DFD8] bg-[#FFFDFA] shrink-0">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-5 py-3 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                {saving ? 'Đang lưu...' : `Xác Nhận ${ACTION_LABEL[acting.next]}`}
              </button>
              <button
                type="button"
                onClick={() => setActing(null)}
                className="px-6 py-3 border border-[#E5DFD8] text-[#2C2C2C] font-semibold rounded-lg hover:bg-[#F9F5F0] transition-colors cursor-pointer text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
