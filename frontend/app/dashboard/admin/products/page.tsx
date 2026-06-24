'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/auth-client'
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
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [products, setProducts] = useState<ApiProduct[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Chỉ admin mới được vào
  useEffect(() => {
    if (isPending) return
    if (!session) { router.push('/auth/login'); return }
    if (session.user.role !== 'admin') { router.push('/dashboard/customer'); return }
  }, [session, isPending, router])

  const load = () => {
    setLoading(true)
    getProducts({ limit: 100 })
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (session?.user.role === 'admin') {
      load()
      getCollections().then(setCollections).catch(() => {})
    }
  }, [session])

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
      price: String(p.price), img: p.img, stock: String(p.stock), description: p.description,
      colors: p.colors.join(', '), sizes: p.sizes.join(', '), features: p.features.join(', '),
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload: ProductInput = {
      name: form.name,
      handle: form.handle,
      collection: form.collection,
      type: form.type,
      price: parseInt(form.price, 10),
      img: form.img || undefined,
      images: form.img ? [form.img] : undefined,
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

  if (isPending || (session && session.user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }
  if (!session) return null

  const filtered = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length)
    : 0

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 bg-card border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Quản Lý Sản Phẩm</h1>
          <Link href="/dashboard/admin" className="text-accent hover:underline">← Quay Lại</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

        <div className="flex justify-between items-center mb-6 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button onClick={openCreate} className="px-6 py-2 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity whitespace-nowrap">
            + Thêm Sản Phẩm
          </button>
        </div>

        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Hình Ảnh</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Tên</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Giá</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Danh Mục</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Kho</th>
                  <th className="text-left py-4 px-6 font-medium text-foreground">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Đang tải...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Không có sản phẩm</td></tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-secondary transition-colors">
                      <td className="py-4 px-6">
                        <img src={product.img} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      </td>
                      <td className="py-4 px-6 text-foreground">{product.name}</td>
                      <td className="py-4 px-6 text-foreground font-medium">{product.price.toLocaleString()} đ</td>
                      <td className="py-4 px-6 text-muted-foreground">{product.collection}</td>
                      <td className="py-4 px-6 text-muted-foreground">{product.stock}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(product)} className="text-accent hover:underline text-xs font-medium">Sửa</button>
                          <button onClick={() => handleDelete(product)} className="text-destructive hover:underline text-xs font-medium">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6">
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tổng Sản Phẩm</p>
            <p className="text-3xl font-heading font-semibold text-foreground">{products.length}</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Giá Trung Bình</p>
            <p className="text-3xl font-heading font-semibold text-foreground">{avgPrice.toLocaleString()} đ</p>
          </div>
          <div className="bg-secondary rounded-lg p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Danh Mục</p>
            <p className="text-3xl font-heading font-semibold text-foreground">{collections.length}</p>
          </div>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-semibold text-foreground mb-6">
              {editingId ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
            </h2>
            {error && <p className="text-destructive mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Tên *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
              <Field label="Handle * (vd: ao-thun-do)"><input required value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Danh mục *">
                  <select value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} className={inputCls}>
                    {(collections.length ? collections : [{ slug: 'ao-thun', name: 'Áo Thun' }, { slug: 'ao-polo', name: 'Áo Polo' }, { slug: 'quan', name: 'Quần' }] as any).map((c: any) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Loại * (vd: Áo Thun)"><input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Giá (VND) *"><input required type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} /></Field>
                <Field label="Tồn kho"><input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} /></Field>
              </div>
              <Field label="Ảnh (đường dẫn)"><input value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} placeholder="/products/ten-anh.png" className={inputCls} /></Field>
              <Field label="Màu sắc (phân cách bằng dấu phẩy)"><input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Đen, Trắng" className={inputCls} /></Field>
              <Field label="Kích cỡ (phân cách bằng dấu phẩy)"><input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" className={inputCls} /></Field>
              <Field label="Đặc điểm (phân cách bằng dấu phẩy)"><input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Vải Premium, Thoáng Khí" className={inputCls} /></Field>
              <Field label="Mô tả"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} /></Field>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-foreground font-medium rounded hover:bg-secondary transition-colors">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

const inputCls = 'w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {children}
    </div>
  )
}
