'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getProducts, getProductById, getCollections, createProduct, updateProduct, deleteProduct, setVariantStock,
  ApiProduct, Collection, ProductInput,
} from '@/api'
import ImageListField from '@/components/ImageListField'
import { useAdminRole } from '@/lib/permissions'
import AdminPagination from '@/components/ui/AdminPagination'

import { useUI } from '@/components/context/UIDialogContext'
const csvToArr = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean)

type FormState = {
  name: string; handle: string; collection: string; type: string
  price: string          // giá bán cuối — tự động tính khi có originalPrice + discount
  originalPrice: string  // giá gốc trước giảm (rỗng = không giảm)
  discount: string       // % giảm, 0-100
  img: string[]; stock: string; description: string; colors: string; sizes: string; features: string
}

const emptyForm: FormState = {
  name: '', handle: '', collection: 'ao-thun', type: '',
  price: '', originalPrice: '', discount: '0',
  img: [], stock: '0', description: '', colors: '', sizes: '', features: '',
}

export default function AdminProductsPage() {
  const { confirm } = useUI()
  const { canWrite } = useAdminRole()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  // Tồn kho từng size + màu của sản phẩm đang sửa, khóa "size|màu".
  // Rỗng = sản phẩm mới (chưa có biến thể) hoặc sản phẩm không khai size/màu.
  const [variantStock, setVariantStockForm] = useState<Record<string, number>>({})

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const ITEMS_PER_PAGE = 10

  // Read current page from URL search params
  const searchParams = useSearchParams()
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)

  const load = () => {
    setLoading(true)
    getProducts({ page: currentPage, limit: ITEMS_PER_PAGE, search: searchTerm || undefined, collection: selectedCollection || undefined })
      .then((res) => {
        const { items: data, pagination } = res
        setProducts(data ?? [])
        setTotalPages(pagination?.totalPages ?? 1)
        setTotal(pagination?.total ?? (data?.length || 0))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getCollections().then(res => setCollections(res.items || [])).catch(() => { })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedCollection])

  const openCreate = () => {
    setVariantStockForm({})
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
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      discount: String(p.discount ?? 0),
      img: p.images?.length ? p.images : (p.img ? [p.img] : []),
      stock: String(p.stock), description: p.description,
      colors: p.colors.join(', '), sizes: p.sizes.join(', '), features: p.features.join(', '),
    })
    // Danh sách sản phẩm không trả variantStock (chỉ endpoint chi tiết mới có),
    // nên phải gọi riêng để lấy tồn kho từng size.
    setVariantStockForm({})
    getProductById(p.id).then((full) => setVariantStockForm(full.variantStock ?? {})).catch(() => {})
    setError('')
    setShowForm(true)
  }

  // Có lưới biến thể khi ĐANG SỬA một sản phẩm đã khai cả size lẫn màu.
  // Tạo mới thì chưa có dòng biến thể nào trong CSDL để nhập.
  const coBienThe = editingId != null
    && csvToArr(form.sizes).length > 0
    && csvToArr(form.colors).length > 0

  const tongBienThe = Object.values(variantStock).reduce((a, b) => a + b, 0)

  // Tự động tính giá bán khi thay đổi giá gốc hoặc % giảm
  const recalcPrice = useCallback((op: string, dc: string, currentPrice: string) => {
    const opNum = parseFloat(op)
    const dcNum = parseFloat(dc)
    if (op !== '' && !isNaN(opNum) && opNum > 0 && !isNaN(dcNum) && dcNum > 0) {
      return String(Math.round(opNum * (1 - dcNum / 100)))
    }
    // Nếu bỏ originalPrice hoặc discount = 0, giữ nguyên price hiện tại
    return currentPrice
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const imgList = form.img.filter(Boolean)
    const discountNum = parseInt(form.discount, 10) || 0
    const originalPriceNum = form.originalPrice ? parseInt(form.originalPrice, 10) : undefined
    const payload: ProductInput = {
      name: form.name,
      handle: form.handle,
      collection: form.collection,
      type: form.type,
      price: parseInt(form.price, 10),
      original_price: originalPriceNum ?? null,
      discount: discountNum,
      img: imgList[0] || '/products/ao-thun-trang.png',
      images: imgList.length ? imgList : ['/products/ao-thun-trang.png'],
      stock: parseInt(form.stock, 10) || 0,
      description: form.description,
      colors: csvToArr(form.colors),
      sizes: csvToArr(form.sizes),
      features: csvToArr(form.features),
    }
    try {
      if (editingId) {
        await updateProduct(editingId, payload)
        // Lưu tồn kho từng biến thể SAU khi lưu sản phẩm: updateProduct có thể
        // vừa thêm/bớt size, màu nên danh sách biến thể phải chốt xong đã.
        // Chỉ gửi những ô đang thật sự tồn tại trong bảng biến thể.
        if (coBienThe && Object.keys(variantStock).length) {
          await setVariantStock(editingId, variantStock)
        }
      } else {
        await createProduct(payload)
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: ApiProduct) => {
    if (!(await confirm({ title: `Xóa sản phẩm "${p.name}"?`, danger: true }))) return
    try {
      await deleteProduct(p.id)
      load()
    } catch (err: any) {
      setError(err.message || 'Xóa thất bại')
    }
  }

  // Filter products client-side (search/collection are already sent to API,
  // but keep local filter as instant feedback while typing)
  const filtered = products

  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">
            {canWrite ? 'Quản Lý Sản Phẩm' : 'Sản Phẩm'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {canWrite
              ? 'Xem, thêm, sửa đổi, cập nhật số lượng tồn kho hoặc xóa sản phẩm thời trang.'
              : 'Xem danh sách sản phẩm thời trang, giá bán, ưu đãi và số lượng tồn kho.'}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            + Thêm Sản Phẩm
          </button>
        )}
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
            onChange={(e) => {
              setSelectedCollection(e.target.value)
            }}
            className="px-3 py-2 bg-white border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          >
            <option value="">Tất cả danh mục</option>
            {(collections || []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
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
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Giá Bán / Gốc</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ưu Đãi</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Danh Mục</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Tồn Kho</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Đã Bán</th>
                {canWrite && <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="text-center py-12 text-muted-foreground">Đang tải sản phẩm...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="text-center py-12 text-muted-foreground">Không tìm thấy sản phẩm nào khớp bộ lọc.</td>
                </tr>
              ) : (
                (filtered || []).map((product) => (
                  <tr key={product.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-6">
                      <img src={product.img} alt={product.name} className="w-12 h-12 object-cover rounded border border-[#E5DFD8]" />
                    </td>
                    <td className="py-4 px-6 text-[#2C2C2C] font-medium">{product.name}</td>
                    <td className="py-4 px-6">
                      <span className="text-[#2C2C2C] font-semibold">{product.price.toLocaleString('vi-VN')} đ</span>
                      {product.originalPrice && (
                        <span className="block text-xs text-muted-foreground line-through">
                          {product.originalPrice.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {product.discount > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          -{product.discount}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground capitalize">{product.collection}</td>
                    <td className="py-4 px-6">
                      {product.stock <= 5 ? (
                        <span className="text-red-600 font-medium">Chỉ còn {product.stock}</span>
                      ) : (
                        <span className="text-muted-foreground">{product.stock}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{product.sold}</td>
                    {canWrite && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => openEdit(product)} className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer">Sửa</button>
                          <button onClick={() => handleDelete(product)} className="text-red-500 hover:underline text-xs font-semibold cursor-pointer">Xóa</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#E5DFD8] bg-[#F9F5F0] px-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Tổng {total} sản phẩm
            </span>
            <AdminPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
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
              {/* ── Pricing section ───────────────────────────────────── */}
              <div className="rounded-lg border border-[#E5DFD8] bg-[#FDFAF6] p-4 space-y-3">
                <p className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide flex items-center gap-1.5">
                  <span>🏷️</span> Giá & Ưu Đãi
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Giá gốc (VND)">
                    <input
                      type="number" min="1"
                      value={form.originalPrice}
                      placeholder="VD: 500000"
                      onChange={(e) => {
                        const op = e.target.value
                        const newPrice = recalcPrice(op, form.discount, form.price)
                        setForm({ ...form, originalPrice: op, price: newPrice })
                      }}
                      className={inputCls}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Để trống nếu không áp dụng giảm giá.</p>
                  </Field>
                  <Field label="Giảm giá (%) — 0 đến 100">
                    <input
                      type="number" min="0" max="100"
                      value={form.discount}
                      placeholder="VD: 20"
                      onChange={(e) => {
                        const dc = e.target.value
                        const newPrice = recalcPrice(form.originalPrice, dc, form.price)
                        setForm({ ...form, discount: dc, price: newPrice })
                      }}
                      className={inputCls}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Nhập 0 hoặc để trống nếu không giảm.</p>
                  </Field>
                </div>

                {/* Live preview callout */}
                {parseInt(form.discount, 10) > 0 && form.originalPrice && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm">
                    <span className="text-amber-600 font-bold text-xs bg-amber-100 px-2 py-0.5 rounded-full">-{form.discount}%</span>
                    <span className="text-muted-foreground line-through text-xs">{parseInt(form.originalPrice, 10).toLocaleString('vi-VN')} đ</span>
                    <span className="font-bold text-[#2C2C2C]">→ {parseInt(form.price, 10).toLocaleString('vi-VN')} đ</span>
                    <span className="text-green-700 text-xs ml-auto">
                      Tiết kiệm {(parseInt(form.originalPrice, 10) - parseInt(form.price, 10)).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Giá bán cuối (VND) *">
                    <input
                      required type="number" min="1"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className={`${inputCls} ${parseInt(form.discount, 10) > 0 ? 'ring-1 ring-[#D4AF37] font-semibold' : ''}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {parseInt(form.discount, 10) > 0 ? '⚡ Tự động tính từ Giá gốc × (1 − %). Có thể chỉnh thủ công.' : 'Giá hiển thị cho khách hàng.'}
                    </p>
                  </Field>
                  <Field label={coBienThe ? 'Tổng tồn kho (tự tính)' : 'Số lượng tồn kho'}>
                    {coBienThe ? (
                      <>
                        <input
                          type="number" value={tongBienThe} readOnly disabled
                          className={`${inputCls} bg-[#F0EBE5] text-muted-foreground cursor-not-allowed`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Cộng từ bảng tồn kho theo size bên dưới.
                        </p>
                      </>
                    ) : (
                      <>
                        <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {editingId ? 'Sản phẩm chưa khai size/màu nên dùng một con số chung.'
                            : 'Sẽ được chia đều cho các size × màu sau khi tạo.'}
                        </p>
                      </>
                    )}
                  </Field>
                </div>
              </div>
              <ImageListField
                label="Ảnh sản phẩm"
                type="products"
                value={form.img}
                onChange={(img) => setForm({ ...form, img })}
                onUploadingChange={setUploading}
              />
              <Field label="Màu sắc (phân cách bằng dấu phẩy)">
                <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Đen, Trắng" className={inputCls} />
              </Field>
              <Field label="Kích cỡ (phân cách bằng dấu phẩy)">
                <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" className={inputCls} />
              </Field>
              {/* Tồn kho theo từng size + màu.
                  Chỉ hiện khi SỬA sản phẩm đã có biến thể: lúc tạo mới chưa có
                  dòng biến thể nào trong CSDL để mà nhập. */}
              {coBienThe && (
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    Tồn kho theo size và màu
                  </label>
                  <div className="border border-[#E5DFD8] rounded overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F9F5F0]">
                          <th className="text-left px-3 py-2 font-semibold text-[#2C2C2C] whitespace-nowrap">Màu \ Size</th>
                          {csvToArr(form.sizes).map((sz) => (
                            <th key={sz} className="px-3 py-2 font-semibold text-[#2C2C2C] whitespace-nowrap">{sz}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvToArr(form.colors).map((mau) => (
                          <tr key={mau} className="border-t border-[#E5DFD8]">
                            <td className="px-3 py-2 font-medium text-[#2C2C2C] whitespace-nowrap">{mau}</td>
                            {csvToArr(form.sizes).map((sz) => {
                              const key = `${sz}|${mau}`
                              const chuaCo = variantStock[key] === undefined
                              return (
                                <td key={key} className="px-2 py-1.5">
                                  <input
                                    type="number" min="0"
                                    value={variantStock[key] ?? 0}
                                    disabled={chuaCo}
                                    title={chuaCo ? 'Lưu sản phẩm trước để tạo biến thể này' : undefined}
                                    onChange={(e) => setVariantStockForm({
                                      ...variantStock,
                                      [key]: Math.max(0, parseInt(e.target.value, 10) || 0),
                                    })}
                                    className={`w-20 px-2 py-1.5 border border-[#E5DFD8] rounded text-sm text-center text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] ${chuaCo ? 'bg-[#F0EBE5] cursor-not-allowed' : 'bg-white'}`}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tổng: <strong className="text-[#2C2C2C]">{tongBienThe}</strong> sản phẩm.
                    Thêm size hoặc màu mới thì lưu một lần để tạo ô nhập, rồi nhập số vào.
                  </p>
                </div>
              )}

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
                <button type="submit" disabled={saving || uploading} className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded transition-colors disabled:opacity-50 cursor-pointer">
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
