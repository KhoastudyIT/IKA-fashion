'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Percent, DollarSign } from 'lucide-react'
import {
  getAdminCoupons, createCoupon, updateCoupon, toggleCoupon, deleteCoupon,
  type Coupon,
} from '@/api'
import { useAdminRole } from '@/lib/permissions'
import AdminPagination from '@/components/ui/AdminPagination'
import { useSearchParams } from 'next/navigation'

import { useUI } from '@/components/context/UIDialogContext'
export default function AdminPromotionsPage() {
  const { confirm } = useUI()
  const { canWrite } = useAdminRole()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrder: '',
    quantity: '',
    active: true,
    expiryDate: '',
  })
  const [saving, setSaving] = useState(false)

  const load = (pageToLoad: number) => {
    setLoading(true)
    getAdminCoupons({ page: pageToLoad, limit: 10 })
      .then((res) => {
        const { items: data, pagination } = res
        setCoupons(data ?? [])
        setTotalPages(pagination?.totalPages ?? 1)
        setTotal(pagination?.total ?? (data?.length || 0))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(currentPage) }, [currentPage])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      code: '', type: 'percentage', value: '', minOrder: '', quantity: '', active: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    })
    setError('')
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder),
      quantity: String(c.quantity), active: c.active, expiryDate: c.expiryDate,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const codeUpper = form.code.toUpperCase().replace(/\s+/g, '')
    const valueNum = Number(form.value)
    if (!codeUpper) return setError('Mã giảm giá không được để trống')
    if (isNaN(valueNum) || valueNum <= 0) return setError('Mức giảm giá phải lớn hơn 0')
    if (form.type === 'percentage' && valueNum > 100) return setError('Mức giảm phần trăm không thể vượt quá 100%')

    const payload = {
      code: codeUpper,
      type: form.type,
      value: valueNum,
      minOrder: Number(form.minOrder) || 0,
      quantity: Number(form.quantity) || 100,
      active: form.active,
      expiryDate: form.expiryDate,
    }

    setSaving(true)
    try {
      if (editingId) await updateCoupon(editingId, payload)
      else await createCoupon(payload)
      setShowForm(false)
      load(currentPage)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, code: string) => {
    if (!(await confirm({ title: `Xóa mã giảm giá "${code}"?`, danger: true }))) return
    try {
      await deleteCoupon(id)
      load(currentPage)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      const updated = await toggleCoupon(id)
      setCoupons((cs) => cs.map((c) => (c.id === id ? updated : c)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Mã Giảm Giá & Ưu Đãi</h1>
          <p className="text-muted-foreground text-sm">
            {canWrite
              ? 'Quản lý các chương trình ưu đãi, coupon chiết khấu và mã vận chuyển cho khách hàng.'
              : 'Xem các chương trình ưu đãi, coupon chiết khấu và mã vận chuyển đang áp dụng.'}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Mã Giảm Giá
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Grid List */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Mã Coupon</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Loại Chiết Khấu</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Mức Giảm</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Đơn Tối Thiểu</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Đã Dùng / Số Lượng</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Hạn Sử Dụng</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C] text-center">Trạng Thái</th>
                {canWrite && <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="text-center py-12 text-muted-foreground">Đang tải danh sách coupon...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="text-center py-12 text-muted-foreground">Không có mã giảm giá nào. Hãy tạo mã mới.</td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date()
                  return (
                    <tr key={coupon.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-3 py-1 rounded font-mono font-bold text-xs uppercase tracking-wider border border-[#D4AF37]/30">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-xs capitalize">
                        {coupon.type === 'percentage' ? (
                          <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5 text-blue-500" /> Theo Phần Trăm</span>
                        ) : (
                          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-green-500" /> Số Tiền Cố Định</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[#2C2C2C] font-semibold">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toLocaleString()} đ`}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {coupon.minOrder > 0 ? `${coupon.minOrder.toLocaleString()} đ` : 'Không yêu cầu'}
                      </td>
                      <td className="py-4 px-6 text-center text-[#2C2C2C] font-medium">
                        {coupon.used} / {coupon.quantity}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <span className={isExpired ? 'text-red-500 font-medium' : ''}>
                          {new Date(coupon.expiryDate).toLocaleDateString('vi-VN')}
                        </span>
                        {isExpired && <span className="text-[0.625rem] block text-red-500">(Đã hết hạn)</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {/* Nhân viên chỉ được xem nên ô trạng thái thành nhãn tĩnh. */}
                        {canWrite ? (
                          <button
                            onClick={() => handleToggleActive(coupon.id)}
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                              coupon.active && !isExpired
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {coupon.active && !isExpired ? 'Đang chạy' : 'Tạm dừng'}
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                              coupon.active && !isExpired
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {coupon.active && !isExpired ? 'Đang chạy' : 'Tạm dừng'}
                          </span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => openEdit(coupon)}
                              className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id, coupon.code)}
                              className="text-red-500 hover:underline text-xs font-semibold cursor-pointer"
                            >
                              Xóa
                            </button>
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
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5DFD8] flex justify-end bg-white rounded-b-lg">
            <AdminPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">
                {editingId ? 'Sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Mã Coupon *</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="Vd: CHAOMUAHE"
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Loại Chiết Khấu</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="percentage">Phần Trăm (%)</option>
                    <option value="fixed">Số Tiền (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Mức Giảm *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === 'percentage' ? '10' : '50000'}
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Đơn Tối Thiểu (đ)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="200000"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Số Lượng Phát Hành</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Ngày Hết Hạn *</label>
                <input
                  required
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-[#D4AF37] w-4 h-4"
                />
                <label htmlFor="active" className="text-sm font-medium text-[#2C2C2C] cursor-pointer">Kích hoạt coupon ngay lập tức</label>
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
