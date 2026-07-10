'use client'

import { useEffect, useState } from 'react'
import {
  getProducts, getCollections, createProduct, updateProduct, deleteProduct,
  ApiProduct, Collection, ProductInput,
} from '@/api'

const csvToArr = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean)

type FormState = {
  name: string; handle: string; collection: string; type: string; price: string
  img: string; stock: string; description: string; colors: string; sizes: string; features: string
}

const emptyForm: FormState = {
  name: '', handle: '', collection: 'ao-thun', type: '', price: '',
  img: '', stock: '0', description: '', colors: '', sizes: '', features: '',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const ITEMS_PER_PAGE = 8

  const load = () => {
    setLoading(true)
    getProducts({ limit: 100 })
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getCollections().then(setCollections).catch(() => { })
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (p: ApiProduct) => {
    setEditingId(p.id)
    setForm({
      name: p.name, handle: p.handle, collection: p.collection, type: p.type,
      price: String(p.price),
      img: p.images ? p.images.join(', ') : p.img,
      stock: String(p.stock), description: p.description,
      colors: p.colors.join(', '), sizes: p.sizes.join(', '), features: p.features.join(', '),
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const imgList = csvToArr(form.img)
    const payload: ProductInput = {
      name: form.name,
      handle: form.handle,
      collection: form.collection,
      type: form.type,
      price: parseInt(form.price, 10),
      img: imgList[0] || '/products/ao-thun-trang.png',
      images: imgList.length ? imgList : ['/products/ao-thun-trang.png'],
      stock: parseInt(form.stock, 10) || 0,
      description: form.description,
      colors: csvToArr(form.colors),
      sizes: csvToArr(form.sizes),
      features: csvToArr(form.features),
    }
    try {
      if (editingId) await updateProduct(editingId, payload)
      else await createProduct(payload)
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: ApiProduct) => {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return
    try {
      await deleteProduct(p.id)
      setProducts((prev) => prev.filter((x) => x.id !== p.id))
    } catch (err: any) {
      setError(err.message || 'Xóa thất bại')
    }
  }

  // Filter products
  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCollection = selectedCollection ? p.collection === selectedCollection : true
    return matchesSearch && matchesCollection
  })

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCollection])

  // Paginated chunk
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Quản Lý Sản Phẩm</h1>
          <p className="text-muted-foreground text-sm">Xem, thêm, sửa đổi, cập nhật số lượng tồn kho hoặc xóa sản phẩm thời trang.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap cursor-pointer"
        >
          + Thêm Sản Phẩm
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E5DFD8] flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        />

        <div className="flex gap-4">
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          >
            <option value="">Tất cả danh mục</option>
            {collections.map((col) => (
              <option key={col.slug} value={col.slug}>
                {col.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main product table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Hình Ảnh</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Tên Sản Phẩm</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Giá Bán</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Danh Mục</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Tồn Kho</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Đã Bán</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">Đang tải sản phẩm...</td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">Không tìm thấy sản phẩm nào khớp bộ lọc.</td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-6">
                      <img src={product.img} alt={product.name} className="w-12 h-12 object-cover rounded border border-[#E5DFD8]" />
                    </td>
                    <td className="py-4 px-6 text-[#2C2C2C] font-medium">{product.name}</td>
                    <td className="py-4 px-6 text-[#2C2C2C] font-semibold">{product.price.toLocaleString()} đ</td>
                    <td className="py-4 px-6 text-muted-foreground capitalize">{product.collection}</td>
                    <td className="py-4 px-6">
                      {product.stock <= 5 ? (
                        <span className="text-red-600 font-medium">Chỉ còn {product.stock}</span>
                      ) : (
                        <span className="text-muted-foreground">{product.stock}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{product.sold}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => openEdit(product)} className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer">Sửa</button>
                        <button onClick={() => handleDelete(product)} className="text-red-500 hover:underline text-xs font-semibold cursor-pointer">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="bg-[#F9F5F0] border-t border-[#E5DFD8] px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} trên tổng số {filtered.length} sản phẩm
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-[#E5DFD8] text-xs font-medium rounded hover:bg-[#F9F5F0] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Trang Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 flex items-center justify-center text-xs font-medium rounded transition-colors cursor-pointer ${currentPage === p
                      ? 'bg-[#2C2C2C] text-white'
                      : 'bg-white border border-[#E5DFD8] text-[#2C2C2C] hover:bg-[#F9F5F0]'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-[#E5DFD8] text-xs font-medium rounded hover:bg-[#F9F5F0] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Trang Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick summaries cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#F9F5F0] rounded-lg p-5 border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tổng sản phẩm</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{products.length}</p>
        </div>
        <div className="bg-[#F9F5F0] rounded-lg p-5 border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Giá Trung Bình</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{avgPrice.toLocaleString()} đ</p>
        </div>
        <div className="bg-[#F9F5F0] rounded-lg p-5 border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Số lượng danh mục</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{collections.length}</p>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-semibold text-[#2C2C2C] mb-6">
              {editingId ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
            </h2>
            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Tên sản phẩm *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Handle * (vd: ao-thun-do)">
                <input required value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Danh mục *">
                  <select value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} className={inputCls}>
                    {collections.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Loại sản phẩm *">
                  <input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Áo Thun, Quần..." className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Giá (VND) *">
                  <input required type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Số lượng tồn kho">
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="Danh sách ảnh (URL - phân tách bằng dấu phẩy) *">
                <textarea required value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} placeholder="/products/trang-1.png, /products/trang-2.png" rows={2} className={inputCls} />
              </Field>
              <Field label="Màu sắc (phân cách bằng dấu phẩy)">
                <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Đen, Trắng" className={inputCls} />
              </Field>
              <Field label="Kích cỡ (phân cách bằng dấu phẩy)">
                <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" className={inputCls} />
              </Field>
              <Field label="Đặc điểm (phân cách bằng dấu phẩy)">
                <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Vải Premium, Thoáng Khí" className={inputCls} />
              </Field>
              <Field label="Mô tả sản phẩm">
                <div className="border border-[#E5DFD8] rounded overflow-hidden bg-[#F9F5F0]">
                  <div className="flex gap-1 bg-white border-b border-[#E5DFD8] p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('product-description') as HTMLTextAreaElement
                        if (!textarea) return
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const text = textarea.value
                        const selected = text.substring(start, end)
                        const replacement = `<strong>${selected}</strong>`
                        setForm({ ...form, description: text.substring(0, start) + replacement + text.substring(end) })
                      }}
                      className="px-2.5 py-1 text-xs font-bold border border-[#E5DFD8] bg-[#F9F5F0] hover:bg-[#D4AF37]/10 rounded cursor-pointer"
                      title="Chữ đậm"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('product-description') as HTMLTextAreaElement
                        if (!textarea) return
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const text = textarea.value
                        const selected = text.substring(start, end)
                        const replacement = `<em>${selected}</em>`
                        setForm({ ...form, description: text.substring(0, start) + replacement + text.substring(end) })
                      }}
                      className="px-2.5 py-1 text-xs italic border border-[#E5DFD8] bg-[#F9F5F0] hover:bg-[#D4AF37]/10 rounded cursor-pointer"
                      title="Chữ nghiêng"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('product-description') as HTMLTextAreaElement
                        if (!textarea) return
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const text = textarea.value
                        const selected = text.substring(start, end)
                        const replacement = `<li>${selected}</li>`
                        setForm({ ...form, description: text.substring(0, start) + replacement + text.substring(end) })
                      }}
                      className="px-2.5 py-1 text-xs border border-[#E5DFD8] bg-[#F9F5F0] hover:bg-[#D4AF37]/10 rounded cursor-pointer"
                      title="Gạch đầu dòng"
                    >
                      • Danh sách
                    </button>
                  </div>
                  <textarea
                    id="product-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Viết mô tả sản phẩm (bôi đen chữ và chọn công cụ định dạng)..."
                    className="w-full px-3 py-2 bg-transparent border-none text-sm text-[#2C2C2C] focus:outline-none"
                  />
                </div>
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded transition-colors disabled:opacity-50 cursor-pointer">
                  {saving ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-[#E5DFD8] text-[#2C2C2C] font-medium rounded hover:bg-[#F9F5F0] transition-colors cursor-pointer">
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

const inputCls = 'w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#2C2C2C] mb-1">{label}</label>
      {children}
    </div>
  )
}
