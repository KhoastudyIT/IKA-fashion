'use client'

// Hàng đợi yêu cầu từ trang "Liên Hệ Với Chúng Tôi".
// Khác trang Tin Nhắn: bên đó là hộp thoại hai chiều của khách ĐÃ đăng nhập,
// còn đây là yêu cầu một chiều, phần lớn đến từ khách vãng lai.

import { useCallback, useEffect, useState } from 'react'
import { Search, Trash2, Mail, Phone, RefreshCw } from 'lucide-react'
import {
  getContacts, getContactStats, updateContact, deleteContact,
  ContactRequest, ContactStatus, CONTACT_STATUS_LABEL,
} from '@/api'

type StatusFilter = ContactStatus | 'all'

const STATUS_STYLE: Record<ContactStatus, string> = {
  new:        'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  resolved:   'bg-green-100 text-green-700',
}

const emptyStats = { total: 0, new: 0, processing: 0, resolved: 0 }

export default function AdminContactsPage() {
  const [items, setItems] = useState<ContactRequest[]>([])
  const [stats, setStats] = useState(emptyStats)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, s] = await Promise.all([
        getContacts({
          page,
          limit: 20,
          status: status === 'all' ? undefined : status,
          search: search.trim() || undefined,
        }),
        getContactStats(),
      ])
      setItems(list.items)
      setTotalPages(list.meta?.totalPages ?? 1)
      setStats(s)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách liên hệ')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => { load() }, [load])

  // Đổi bộ lọc thì phải quay về trang 1, nếu không sẽ rơi vào trang trống
  // khi kết quả mới ít hơn trang đang đứng.
  const changeStatus = (next: StatusFilter) => { setStatus(next); setPage(1) }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  const setStatusOf = async (c: ContactRequest, next: ContactStatus) => {
    setBusyId(c.id)
    try {
      const updated = await updateContact(c.id, { status: next })
      setItems((prev) => prev.map((x) => (x.id === c.id ? updated : x)))
      setStats(await getContactStats())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const saveNote = async (c: ContactRequest) => {
    setBusyId(c.id)
    try {
      const updated = await updateContact(c.id, { adminNote: noteDraft })
      setItems((prev) => prev.map((x) => (x.id === c.id ? updated : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu ghi chú thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (c: ContactRequest) => {
    if (!window.confirm(`Xóa yêu cầu liên hệ của "${c.name}"? Thao tác này không hoàn tác được.`)) return
    setBusyId(c.id)
    try {
      await deleteContact(c.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const toggleExpand = (c: ContactRequest) => {
    if (expandedId === c.id) {
      setExpandedId(null)
    } else {
      setExpandedId(c.id)
      setNoteDraft(c.adminNote)
    }
  }

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',        label: 'Tất cả',     count: stats.total },
    { key: 'new',        label: 'Mới',        count: stats.new },
    { key: 'processing', label: 'Đang xử lý', count: stats.processing },
    { key: 'resolved',   label: 'Đã xử lý',   count: stats.resolved },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Yêu Cầu Liên Hệ</h1>
        <p className="text-muted-foreground text-sm">
          Tin nhắn gửi từ trang Liên Hệ. Khách không cần đăng nhập vẫn gửi được nên hãy kiểm tra thường xuyên.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>
      )}

      {/* Bộ lọc trạng thái + tìm kiếm */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => changeStatus(t.key)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                status === t.key
                  ? 'bg-[#2C2C2C] text-white'
                  : 'bg-white border border-[#E5DFD8] text-[#2C2C2C] hover:bg-[#F9F5F0]'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, email, SĐT, chủ đề..."
              className="pl-9 pr-3 py-2 bg-white border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#2C2C2C] text-white rounded text-sm hover:bg-[#D4AF37] transition-colors"
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={load}
            title="Tải lại"
            className="px-3 py-2 border border-[#E5DFD8] rounded hover:bg-[#F9F5F0] transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-[#2C2C2C]" />
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Đang tải...</p>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E5DFD8] rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {search || status !== 'all' ? 'Không có yêu cầu nào khớp bộ lọc.' : 'Chưa có yêu cầu liên hệ nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="bg-white border border-[#E5DFD8] rounded-lg overflow-hidden">
              <div
                onClick={() => toggleExpand(c)}
                className="p-4 cursor-pointer hover:bg-[#F9F5F0] transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#2C2C2C]">{c.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status]}`}>
                        {CONTACT_STATUS_LABEL[c.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.subject}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                      {c.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </span>
                      )}
                      <span>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    {expandedId !== c.id && (
                      <p className="mt-2 text-sm text-[#2C2C2C] line-clamp-1">{c.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.status}
                      disabled={busyId === c.id}
                      onChange={(e) => setStatusOf(c, e.target.value as ContactStatus)}
                      className="px-2 py-1.5 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-xs text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-50"
                    >
                      {(Object.keys(CONTACT_STATUS_LABEL) as ContactStatus[]).map((s) => (
                        <option key={s} value={s}>{CONTACT_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={busyId === c.id}
                      title="Xóa"
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {expandedId === c.id && (
                <div className="px-4 pb-4 border-t border-[#F9F5F0] pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nội dung</p>
                    <p className="text-sm text-[#2C2C2C] whitespace-pre-wrap">{c.message}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Ghi chú nội bộ
                    </p>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Đã gọi lúc nào, khách phản hồi ra sao..."
                      className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => saveNote(c)}
                        disabled={busyId === c.id || noteDraft === c.adminNote}
                        className="px-4 py-1.5 bg-[#2C2C2C] text-white rounded text-xs hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busyId === c.id ? 'Đang lưu...' : 'Lưu ghi chú'}
                      </button>
                      <a
                        href={`mailto:${c.email}?subject=${encodeURIComponent(`Phản hồi: ${c.subject}`)}`}
                        className="text-xs text-[#2C2C2C] underline hover:opacity-80"
                      >
                        Trả lời qua email
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[#E5DFD8] rounded text-sm disabled:opacity-40 hover:bg-[#F9F5F0] transition-colors"
          >
            Trước
          </button>
          <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-[#E5DFD8] rounded text-sm disabled:opacity-40 hover:bg-[#F9F5F0] transition-colors"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
