'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getAdminNews, getAdminArticle, createArticle, updateArticle, updateArticleStatus,
  deleteArticle, getNewsCategories, Article, NewsCategory,
} from '@/api'
import { Plus, X, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import ImageField from '@/components/ImageField'
import ContentEditor from '@/components/ContentEditor'

type FormState = {
  title: string
  slug: string
  img: string
  excerpt: string
  content: string
  author: string
  categoryId: string        // '' = không thuộc danh mục nào
  status: 'draft' | 'published'
  date: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): FormState => ({
  title: '',
  slug: '',
  img: '',
  excerpt: '',
  content: '',
  author: '',
  categoryId: '',
  status: 'draft',
  date: todayIso(),
})

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
}
const STATUS_LABEL: Record<string, string> = {
  published: 'Đã đăng',
  draft: 'Nháp',
}

const LIMIT = 10

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Bộ lọc
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'draft' | 'published'>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getAdminNews({
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        limit: LIMIT,
      })
      setArticles(res.items)
      setTotalPages(res.meta?.totalPages ?? 1)
      setTotal(res.meta?.total ?? res.items.length)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, page])

  useEffect(() => { loadArticles() }, [loadArticles])

  useEffect(() => {
    getNewsCategories().then(setCategories).catch(() => {})
  }, [])

  // Đổi bộ lọc thì quay về trang 1, không thì đang ở trang 5 mà kết quả chỉ có 2 trang
  const applyFilter = (fn: () => void) => { fn(); setPage(1) }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormError('')
    setShowForm(true)
  }

  // Danh sách không trả về `content` nên phải lấy bản đầy đủ khi sửa
  const openEdit = async (article: Article) => {
    setEditingId(article.id)
    setFormError('')
    setShowForm(true)
    setForm({
      title: article.title,
      slug: article.slug,
      img: article.img,
      excerpt: article.excerpt,
      content: '',
      author: article.author,
      categoryId: article.category ? String(article.category.id) : '',
      status: article.status,
      date: article.publishDate || todayIso(),
    })
    try {
      const full = await getAdminArticle(article.id)
      setForm(prev => ({ ...prev, content: full.content ?? '' }))
    } catch (err: any) {
      setFormError(err.message || 'Không tải được nội dung bài viết')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      img: form.img,
      excerpt: form.excerpt,
      content: form.content,
      author: form.author,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      status: form.status,
      date: form.date,
    }
    try {
      if (editingId) {
        await updateArticle(editingId, payload)
      } else {
        await createArticle(payload)
      }
      setShowForm(false)
      loadArticles()
    } catch (err: any) {
      setFormError(err.message || 'Lưu bài viết thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (article: Article) => {
    const next = article.status === 'published' ? 'draft' : 'published'
    try {
      const updated = await updateArticleStatus(article.id, next)
      setArticles(prev => prev.map(a => (a.id === article.id ? { ...a, status: updated.status } : a)))
    } catch (err: any) {
      alert(err.message || 'Đổi trạng thái thất bại')
    }
  }

  const handleDelete = async (article: Article) => {
    if (!confirm(`Xóa bài viết "${article.title}"? Thao tác này không hoàn tác được.`)) return
    try {
      await deleteArticle(article.id)
      loadArticles()
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Quản Lý Tin Tức</h1>
          <p className="text-muted-foreground text-sm">
            Soạn và đăng bài viết về xu hướng, phối đồ, bảo quản và tin cửa hàng.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Viết Bài Mới
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Bộ lọc */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-4 flex flex-wrap gap-3 items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); applyFilter(() => setSearch(searchInput.trim())) }}
          className="relative flex-1 min-w-[220px]"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc tóm tắt..."
            className="w-full pl-9 pr-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => applyFilter(() => setStatusFilter(e.target.value as any))}
          className="px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
        >
          <option value="">Mọi trạng thái</option>
          <option value="published">Đã đăng</option>
          <option value="draft">Nháp</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => applyFilter(() => setCategoryFilter(e.target.value))}
          className="px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
        >
          <option value="">Mọi danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ảnh</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Tiêu Đề</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Danh Mục</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ngày Đăng</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Trạng Thái</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Đang tải bài viết...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Không có bài viết nào.</td></tr>
              ) : (
                articles.map(article => (
                  <tr key={article.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-6">
                      {article.img ? (
                        <img src={article.img} alt={article.title} className="w-16 h-10 object-cover rounded border border-[#E5DFD8]" />
                      ) : (
                        <div className="w-16 h-10 rounded border border-[#E5DFD8] bg-[#F9F5F0]" />
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-sm">
                      <p className="text-[#2C2C2C] font-semibold truncate">{article.title}</p>
                      <p className="text-muted-foreground font-mono text-xs truncate">/{article.slug}</p>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{article.category?.name ?? '—'}</td>
                    <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">
                      {article.publishDate ? article.publishDate.split('-').reverse().join('/') : '—'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[11px] font-medium px-2 py-1 rounded border ${STATUS_STYLE[article.status]}`}>
                        {STATUS_LABEL[article.status]}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-3 justify-end whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(article)}
                          className="text-[#2C2C2C] hover:underline text-xs font-semibold cursor-pointer"
                        >
                          {article.status === 'published' ? 'Ẩn' : 'Đăng'}
                        </button>
                        <button
                          onClick={() => openEdit(article)}
                          className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(article)}
                          className="text-red-500 hover:underline text-xs font-semibold cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5DFD8] text-sm">
            <span className="text-muted-foreground">Tổng {total} bài viết</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-[#E5DFD8] disabled:opacity-40 hover:bg-[#F9F5F0] cursor-pointer disabled:cursor-not-allowed"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[#2C2C2C]">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded border border-[#E5DFD8] disabled:opacity-40 hover:bg-[#F9F5F0] cursor-pointer disabled:cursor-not-allowed"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[92vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">
                {editingId ? 'Sửa Bài Viết' : 'Viết Bài Mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {formError && <p className="text-red-600 mb-4 text-sm">{formError}</p>}

            <form onSubmit={handleSubmit}>
              {/* Màn rộng: thông tin bài bên trái, khung soạn nội dung bên phải */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Tiêu Đề *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value
                      // Gợi ý slug khi tạo mới; khi sửa thì giữ nguyên để không phá URL đã công khai
                      setForm({ ...form, title, slug: editingId ? form.slug : toSlug(title) })
                    }}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Slug (đường dẫn)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="bo-trong-de-tu-sinh-tu-tieu-de"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Danh Mục</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                    >
                      <option value="">— Không có —</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Trạng Thái</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
                      className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                    >
                      <option value="draft">Nháp</option>
                      <option value="published">Đã đăng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Ngày Đăng</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Tác Giả</label>
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    placeholder="IKA Fashion"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <ImageField
                  label="Ảnh Bìa"
                  type="news"
                  value={form.img}
                  onChange={(img) => setForm({ ...form, img })}
                  onUploadingChange={setUploading}
                />

                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Tóm Tắt</label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    rows={2}
                    maxLength={500}
                    placeholder="Vài dòng mô tả ngắn hiển thị ở danh sách bài viết"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] resize-y"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Nội Dung *</label>
                <ContentEditor
                  value={form.content}
                  onChange={(content) => setForm({ ...form, content })}
                  imageType="news"
                  rows={22}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Thẻ HTML sẽ bị loại bỏ khi lưu. Cách nhau một dòng trống để tách đoạn.
                </p>
              </div>
              </div>

              <div className="flex gap-3 pt-5 mt-5 border-t border-[#E5DFD8]">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-8 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Đang tải ảnh...' : saving ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Tạo Bài Viết'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-[#E5DFD8] text-[#2C2C2C] font-medium rounded hover:bg-[#F9F5F0] transition-colors cursor-pointer"
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
