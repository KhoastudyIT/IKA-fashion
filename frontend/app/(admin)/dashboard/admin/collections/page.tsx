'use client'

import { useEffect, useState } from 'react'
import { getCollections, createCollection, updateCollection, deleteCollection, Collection } from '@/api'
import { FolderKanban, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react'

type FormState = {
  name: string
  slug: string
  img: string
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  img: '',
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadCollections = async () => {
    try {
      setLoading(true)
      const res = await getCollections()
      setCollections(res)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollections()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (c: Collection) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      slug: c.slug,
      img: c.img,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const updated = await updateCollection(editingId, form)
        setCollections((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
      } else {
        const created = await createCollection(form)
        setCollections((prev) => [...prev, created])
      }
      setShowForm(false)
      loadCollections()
    } catch (err: any) {
      setError(err.message || 'Lưu danh mục thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Collection) => {
    if (!confirm(`Xóa danh mục "${c.name}"? Thao tác này có thể ảnh hưởng đến sản phẩm hiển thị.`)) return
    try {
      await deleteCollection(c.id)
      setCollections((prev) => prev.filter((x) => x.id !== c.id))
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Quản Lý Danh Mục</h1>
          <p className="text-muted-foreground text-sm">Quản lý các danh mục sản phẩm thời trang (Collections) hiển thị trên hệ thống menu bán hàng.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Collections Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ảnh Bìa</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Tên Danh Mục</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Slug</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Số Sản Phẩm</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">Đang tải danh mục...</td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">Không có danh mục nào. Hãy tạo danh mục mới.</td>
                </tr>
              ) : (
                collections.map((col) => (
                  <tr key={col.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-6">
                      <img src={col.img || '/products/ao-thun-trang.png'} alt={col.name} className="w-16 h-10 object-cover rounded border border-[#E5DFD8]" />
                    </td>
                    <td className="py-4 px-6 text-[#2C2C2C] font-semibold">{col.name}</td>
                    <td className="py-4 px-6 text-muted-foreground code font-mono text-xs">{col.slug}</td>
                    <td className="py-4 px-6 text-center text-[#2C2C2C] font-medium">{col.productCount ?? 0}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => openEdit(col)}
                          className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                        {col.slug !== 'ao-thun' && col.slug !== 'ao-polo' && col.slug !== 'quan' ? (
                          <button
                            onClick={() => handleDelete(col)}
                            className="text-red-500 hover:underline text-xs font-semibold cursor-pointer"
                          >
                            Xóa
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Mặc định</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">
                {editingId ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Tên Danh Mục *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    // Tự động gợi ý slug nếu đang tạo mới
                    const slug = editingId
                      ? form.slug
                      : name
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[đĐ]/g, 'd')
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                    setForm({ ...form, name, slug })
                  }}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Slug (đường dẫn rút gọn) *</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Đường dẫn ảnh bìa danh mục *</label>
                <input
                  required
                  value={form.img}
                  onChange={(e) => setForm({ ...form, img: e.target.value })}
                  placeholder="/products/ten-anh.png"
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Tạo Mới'}
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
