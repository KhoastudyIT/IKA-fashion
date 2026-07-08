'use client'

import { useEffect, useState } from 'react'
import { Star, Check, EyeOff, MessageSquare, Trash2, X, AlertCircle } from 'lucide-react'

type Review = {
  id: string
  userName: string
  productName: string
  rating: number
  comment: string
  createdAt: string
  approved: boolean
  reply: string | null
}

const initialReviews: Review[] = [
  { id: '1', userName: 'Trần Thị Mai', productName: 'Áo Thun Trắng Premium', rating: 5, comment: 'Chất vải siêu mát luôn, rất đáng tiền nha mọi người!', createdAt: '2026-06-20', approved: true, reply: 'Cảm ơn bạn đã tin tưởng ủng hộ IKA Fashion!' },
  { id: '2', userName: 'Nguyễn Văn Hùng', productName: 'Quần Đen Slim Fit', rating: 4, comment: 'Quần vừa vặn, co giãn tốt, tuy nhiên giao hàng hơi lâu chút.', createdAt: '2026-06-18', approved: true, reply: null },
  { id: '3', userName: 'Khách hàng ẩn danh', productName: 'Áo Polo Xanh Navy', rating: 2, comment: 'Màu sắc ngoài đời hơi tối so với ảnh, chất liệu cũng hơi dày.', createdAt: '2026-06-15', approved: true, reply: null },
  { id: '4', userName: 'Hoàng Minh', productName: 'Áo Thun Đen Premium', rating: 5, comment: 'Giao hàng nhanh, áo thun đen mặc tôn dáng cực kì.', createdAt: '2026-06-14', approved: false, reply: null },
]

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all')

  // Reply Modal
  const [replyReview, setReplyReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('ika_reviews')
      if (raw) {
        try {
          setReviews(JSON.parse(raw))
        } catch {
          setReviews(initialReviews)
        }
      } else {
        setReviews(initialReviews)
        localStorage.setItem('ika_reviews', JSON.stringify(initialReviews))
      }
      setLoading(false)
    }
  }, [])

  const saveToStorage = (newReviews: Review[]) => {
    setReviews(newReviews)
    localStorage.setItem('ika_reviews', JSON.stringify(newReviews))
  }

  const handleToggleApprove = (id: string) => {
    const next = reviews.map((r) => (r.id === id ? { ...r, approved: !r.approved } : r))
    saveToStorage(next)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa đánh giá này?')) return
    const next = reviews.filter((r) => r.id !== id)
    saveToStorage(next)
  }

  const openReply = (r: Review) => {
    setReplyReview(r)
    setReplyText(r.reply || '')
  }

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyReview) return
    const next = reviews.map((r) => (r.id === replyReview.id ? { ...r, reply: replyText || null } : r))
    saveToStorage(next)
    setReplyReview(null)
  }

  // Filter reviews
  const filtered = reviews.filter((r) => {
    if (activeTab === 'pending') return !r.approved
    if (activeTab === 'approved') return r.approved
    return true
  })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Kiểm Duyệt Đánh Giá</h1>
        <p className="text-muted-foreground text-sm">Xem và kiểm duyệt các bình luận, phản hồi, xếp hạng sao của khách hàng gửi về các sản phẩm.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5DFD8]">
        {(['all', 'pending', 'approved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-muted-foreground hover:text-[#2C2C2C]'
            }`}
          >
            {tab === 'all' ? 'Tất cả' : tab === 'pending' ? 'Chưa duyệt' : 'Đã duyệt'}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Đang tải đánh giá...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Không có đánh giá nào.</p>
        ) : (
          filtered.map((rev) => (
            <div key={rev.id} className="bg-white rounded-lg p-6 shadow-sm border border-[#E5DFD8] flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="space-y-3 flex-1">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-sm text-[#2C2C2C]">{rev.userName}</span>
                  <span className="text-xs text-muted-foreground">đã đánh giá</span>
                  <span className="font-semibold text-xs text-[#D4AF37] uppercase">{rev.productName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-sm text-[#2C2C2C] leading-relaxed bg-[#F9F5F0]/30 p-3 rounded border border-[#E5DFD8]/40">
                  {rev.comment}
                </p>

                {/* Reply */}
                {rev.reply && (
                  <div className="ml-4 pl-4 border-l-2 border-[#D4AF37] bg-yellow-50/30 p-3 rounded">
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                      Phản hồi từ Admin
                    </span>
                    <p className="text-xs text-[#2C2C2C]">{rev.reply}</p>
                  </div>
                )}
              </div>

              {/* Actions side */}
              <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto items-end pt-3 md:pt-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleApprove(rev.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all border cursor-pointer ${
                      rev.approved
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                    title={rev.approved ? 'Ẩn đánh giá' : 'Hiển thị đánh giá'}
                  >
                    {rev.approved ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Ẩn
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openReply(rev)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1 hover:bg-blue-100 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> {rev.reply ? 'Sửa Phản Hồi' : 'Phản Hồi'}
                  </button>

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 rounded transition-all cursor-pointer"
                    title="Xóa đánh giá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {replyReview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setReplyReview(null)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-heading font-semibold text-[#2C2C2C]">
                Phản Hồi Đánh Giá
              </h2>
              <button onClick={() => setReplyReview(null)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-[#F9F5F0] p-3 rounded mb-4 text-xs text-muted-foreground border border-[#E5DFD8]">
              <p><strong>Khách hàng:</strong> {replyReview.userName}</p>
              <p className="mt-1"><strong>Nội dung:</strong> "{replyReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Nội dung phản hồi của Admin</label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi gửi tới khách hàng..."
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded transition-colors cursor-pointer text-sm"
                >
                  Lưu Phản Hồi
                </button>
                <button
                  type="button"
                  onClick={() => setReplyReview(null)}
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
