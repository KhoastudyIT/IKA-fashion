'use client'

import { useEffect, useState } from 'react'
import { getAdminCustomers, deleteCustomer, toggleLockCustomer, ApiUser } from '@/api'
import { Users, Search, Trash2, RefreshCw, Lock, Unlock } from 'lucide-react'
import { useAdminRole } from '@/lib/permissions'
import AdminPagination from '@/components/ui/AdminPagination'
import { useSearchParams } from 'next/navigation'

export default function AdminCustomersPage() {
  const { canWrite } = useAdminRole()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [customers, setCustomers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const loadCustomers = async (pageToLoad: number) => {
    try {
      setLoading(true)
      const res = await getAdminCustomers({ page: pageToLoad, limit: 10 })
      const { items: data, pagination } = res
      setCustomers(data ?? [])
      setTotalPages(pagination?.totalPages ?? 1)
      setTotal(pagination?.total ?? (data?.length || 0))
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers(currentPage)
  }, [currentPage])

  const handleDeleteCustomer = async (userId: string, name: string) => {
    if (!confirm(`Bạn chắc chắn muốn xóa tài khoản "${name}"? Thao tác này không thể hoàn tác.`)) return
    try {
      await deleteCustomer(userId)
      // Tải lại để trang hiện tại được lấp đầy và tổng số cập nhật theo.
      await loadCustomers(currentPage)
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa tài khoản')
    }
  }

  const handleToggleLock = async (userId: string, name: string, isLocked: boolean) => {
    const action = isLocked ? 'mở khóa' : 'khóa'
    if (!confirm(`Bạn chắc chắn muốn ${action} tài khoản "${name}"?`)) return
    try {
      const updated = await toggleLockCustomer(userId)
      setCustomers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch (err: any) {
      alert(err.message || `Lỗi ${action} tài khoản`)
    }
  }

  // Filter customers by search term
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    )
  })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">
            {canWrite ? 'Quản Lý Khách Hàng' : 'Khách Hàng'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {canWrite
              ? 'Danh sách khách hàng đã đăng ký thành viên — khóa/mở tài khoản và kiểm tra thông tin liên hệ. Tài khoản nhân viên nằm ở mục Nhân Viên.'
              : 'Danh sách khách hàng đã đăng ký thành viên và thông tin liên hệ của họ.'}
          </p>
        </div>
        <button
          onClick={() => loadCustomers(currentPage)}
          className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
          title="Tải lại danh sách"
        >
          <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tổng khách hàng</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{total}</p>
        </div>
        {/* Hai ô dưới đếm trong trang đang xem — API chưa lọc được theo trạng
            thái khóa nên không có con số toàn hệ thống để hiển thị. */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Đang hoạt động (trang này)</p>
          <p className="text-2xl font-heading font-semibold text-[#D4AF37]">
            {customers.filter((c) => !c.isLocked).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Bị khóa (trang này)</p>
          <p className="text-2xl font-heading font-semibold text-red-600">
            {customers.filter((c) => c.isLocked).length}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E5DFD8]">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng theo tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Họ Tên</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Email</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Số Điện Thoại</th>
                <th className="py-4 px-6 font-medium text-[#2C2C2C]">Ngày Tạo</th>
                {canWrite && <th className="py-4 px-6 font-medium text-[#2C2C2C] text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="text-center py-12 text-muted-foreground">Đang tải danh sách người dùng...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="text-center py-12 text-muted-foreground">Không tìm thấy khách hàng nào.</td>
                </tr>
              ) : (
                filteredCustomers.map((user) => (
                  <tr key={user.id} className="border-b border-[#E5DFD8] hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-[#2C2C2C]">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {user.isLocked && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 uppercase tracking-wider">
                            Bị Khóa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#2C2C2C]">{user.email}</td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {user.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mặc định'}
                    </td>
                    {canWrite && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleToggleLock(user.id, user.name, !!user.isLocked)}
                            className={`p-1.5 rounded transition-all cursor-pointer ${
                              user.isLocked
                                ? 'text-green-600 hover:bg-green-50 hover:text-green-800'
                                : 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                            title={user.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(user.id, user.name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition-all cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50 rounded-b-xl">
            <AdminPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  )
}
