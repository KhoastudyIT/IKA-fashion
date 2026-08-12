'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Trash2, Zap, Settings, Search } from 'lucide-react'
import {
  getAdminFlashSales, createFlashSale, toggleFlashSale, deleteFlashSale,
  addProductToFlashSale, removeProductFromFlashSale,
  getProducts, type FlashSale, type ApiProduct
} from '@/api'

export default function AdminFlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', startTime: '', endTime: '' })
  const [saving, setSaving] = useState(false)

  // Products modal
  const [activeSale, setActiveSale] = useState<FlashSale | null>(null)
  
  // Product Search & Add
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null)
  const [productForm, setProductForm] = useState({ discountedPrice: '', stockLimit: '' })
  const [addingProduct, setAddingProduct] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminFlashSales()
      .then(data => {
        setSales(data)
        // update activeSale if it's currently open
        if (activeSale) {
          const updated = data.find(s => s.id === activeSale.id)
          if (updated) setActiveSale(updated)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, []) // eslint-disable-next-line react-hooks/exhaustive-deps

  // ── Flash Sales Actions ──

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.startTime || !createForm.endTime) return setError('Vui lòng nhập đủ thông tin')
    setSaving(true)
    setError('')
    try {
      await createFlashSale({
        name: createForm.name,
        startTime: new Date(createForm.startTime).toISOString(),
        endTime: new Date(createForm.endTime).toISOString()
      })
      setShowCreate(false)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleFlashSale(id)
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa Flash Sale này? Tất cả sản phẩm thuộc sale sẽ bị gỡ.')) return
    try {
      await deleteFlashSale(id)
      if (activeSale?.id === id) setActiveSale(null)
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ── Product Actions ──

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      getProducts({ search, limit: 5 }).then(res => setSearchResults(res.items)).catch(console.error)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSale || !selectedProduct) return
    const price = Number(productForm.discountedPrice)
    const stock = Number(productForm.stockLimit)
    if (isNaN(price) || price < 0 || isNaN(stock) || stock <= 0) return setError('Giá trị không hợp lệ')
    if (price >= selectedProduct.price) return setError('Giá flash sale phải thấp hơn giá gốc')

    setAddingProduct(true)
    setError('')
    try {
      await addProductToFlashSale(activeSale.id, {
        productId: selectedProduct.id,
        discountedPrice: price,
        stockLimit: stock
      })
      setSelectedProduct(null)
      setSearch('')
      setProductForm({ discountedPrice: '', stockLimit: '' })
      load() // Will auto refresh activeSale
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAddingProduct(false)
    }
  }

  const handleRemoveProduct = async (productId: number) => {
    if (!activeSale) return
    if (!confirm('Xóa sản phẩm này khỏi Flash Sale?')) return
    try {
      await removeProductFromFlashSale(activeSale.id, productId)
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading && !sales.length) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
            <Zap className="text-orange-500" /> Quản Lý Flash Sale
          </h1>
          <p className="text-muted-foreground">Tạo và quản lý các chương trình Flash Sale giới hạn thời gian.</p>
        </div>
        <button
          onClick={() => {
            setCreateForm({ name: '', startTime: '', endTime: '' })
            setShowCreate(true)
            setError('')
          }}
          className="bg-foreground text-primary-foreground px-4 py-2 rounded font-medium flex items-center gap-2 hover:opacity-90"
        >
          <Plus size={20} /> Tạo Flash Sale
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}

      {/* ── LIST ── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="p-4 font-semibold text-foreground">Tên Chương Trình</th>
              <th className="p-4 font-semibold text-foreground">Thời Gian Bắt Đầu</th>
              <th className="p-4 font-semibold text-foreground">Thời Gian Kết Thúc</th>
              <th className="p-4 font-semibold text-foreground">Trạng Thái</th>
              <th className="p-4 font-semibold text-foreground text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-secondary/20">
                <td className="p-4 font-medium text-foreground">{sale.name}</td>
                <td className="p-4 text-sm">{new Date(sale.startTime).toLocaleString('vi-VN')}</td>
                <td className="p-4 text-sm">{new Date(sale.endTime).toLocaleString('vi-VN')}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggle(sale.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sale.isActive ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sale.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="p-4 text-right space-x-3">
                  <button onClick={() => setActiveSale(sale)} className="text-foreground hover:text-orange-500 inline-flex items-center gap-1 text-sm font-medium">
                    <Settings size={16} /> Quản lý SP
                  </button>
                  <button onClick={() => handleDelete(sale.id)} className="text-destructive hover:opacity-70">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Chưa có Flash Sale nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Tạo Flash Sale Mới</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên chương trình</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:border-foreground"
                  placeholder="Ví dụ: Siêu Sale Giữa Tháng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.startTime}
                  onChange={e => setCreateForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.endTime}
                  onChange={e => setCreateForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:border-foreground"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-foreground text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Đang tạo...' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE PRODUCTS MODAL ── */}
      {activeSale && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-lg shadow-xl border border-border my-8 flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30 sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Zap className="text-orange-500" /> {activeSale.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(activeSale.startTime).toLocaleString()} — {new Date(activeSale.endTime).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setActiveSale(null)} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Product Selection Form */}
              <div className="md:col-span-1 space-y-4">
                <h3 className="font-semibold text-foreground mb-4">Thêm Sản Phẩm</h3>
                
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm tên sản phẩm..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-border rounded focus:outline-none focus:border-foreground"
                    />
                  </div>
                  {searchResults.length > 0 && !selectedProduct && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProduct(p); setSearchResults([]) }}
                          className="w-full text-left px-3 py-2 hover:bg-secondary/50 text-sm flex items-center gap-2"
                        >
                          <img src={p.img} alt="" className="w-8 h-8 rounded object-cover" />
                          <div className="truncate">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className="text-muted-foreground">{p.price.toLocaleString()}đ</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <form onSubmit={handleAddProduct} className="bg-secondary/20 p-4 rounded-lg border border-border space-y-4">
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex gap-3">
                        <img src={selectedProduct.img} alt="" className="w-12 h-12 rounded object-cover" />
                        <div>
                          <p className="font-medium text-sm line-clamp-2">{selectedProduct.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">Gốc: {selectedProduct.price.toLocaleString()}đ</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setSelectedProduct(null)} className="text-muted-foreground"><X size={16}/></button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Giá Flash Sale (VNĐ)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.discountedPrice}
                        onChange={e => setProductForm(f => ({ ...f, discountedPrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Giới hạn số lượng bán</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={productForm.stockLimit}
                        onChange={e => setProductForm(f => ({ ...f, stockLimit: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:border-foreground"
                      />
                    </div>

                    <button type="submit" disabled={addingProduct} className="w-full py-2 bg-orange-600 text-white font-medium rounded hover:bg-orange-700 disabled:opacity-50">
                      {addingProduct ? 'Đang thêm...' : 'Thêm Vào Flash Sale'}
                    </button>
                  </form>
                )}
              </div>

              {/* Products List */}
              <div className="md:col-span-2">
                <h3 className="font-semibold text-foreground mb-4">Sản Phẩm Đang Chạy ({activeSale.products?.length || 0})</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="p-3 font-medium text-muted-foreground">Sản Phẩm</th>
                        <th className="p-3 font-medium text-muted-foreground">Giá Flash Sale</th>
                        <th className="p-3 font-medium text-muted-foreground">Đã Bán</th>
                        <th className="p-3 font-medium text-muted-foreground text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeSale.products?.map(p => (
                        <tr key={p.productId} className="hover:bg-secondary/20">
                          <td className="p-3 flex items-center gap-3">
                            <img src={p.img} alt="" className="w-10 h-10 rounded object-cover" />
                            <div className="max-w-[200px]">
                              <p className="font-medium truncate" title={p.name}>{p.name}</p>
                              <p className="text-xs text-muted-foreground line-through">{p.originalPrice.toLocaleString()}đ</p>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-orange-600">
                            {p.discountedPrice.toLocaleString()}đ
                          </td>
                          <td className="p-3">
                            {p.soldCount} / {p.stockLimit}
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-orange-500" 
                                style={{ width: `${Math.min(100, (p.soldCount / p.stockLimit) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleRemoveProduct(p.productId)} className="text-destructive hover:opacity-70 p-1">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!activeSale.products?.length && (
                        <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Chưa có sản phẩm nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
