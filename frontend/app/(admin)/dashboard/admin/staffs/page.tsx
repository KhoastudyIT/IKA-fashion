'use client'

import { useEffect, useState } from 'react'
import { getAdminCustomers, updateUserRole, ApiUser } from '@/api'
import { Users, Shield, User, ArrowRight, RefreshCw, X, ShieldCheck } from 'lucide-react'

export default function AdminStaffPage() {
  const [usersList, setUsersList] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Role changing state
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)
  const [selectedRole, setSelectedRole] = useState('customer')
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await getAdminCustomers()
      setUsersList(res)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách thành viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateUserRole(selectedUser.id, selectedRole)
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)))
      setSelectedUser(null)
    } catch (err: any) {
      setError(err.message || 'Cập nhật vai trò thất bại')
    } finally {
      setSaving(false)
    }
  }

  // Filter only staffs/admins or show all with role change
  const filteredAdmins = usersList.filter((u) => u.role === 'admin')
  const filteredCustomers = usersList.filter((u) => {
    const term = searchTerm.toLowerCase()
    return (
      u.role === 'customer' &&
      (u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Tài Khoản Nhân Viên</h1>
          <p className="text-muted-foreground text-sm">Quản lý danh sách các tài khoản có quyền truy cập quản trị hệ thống bán hàng và phân quyền.</p>
        </div>
        <button
          onClick={loadUsers}
          className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
          title="Tải lại danh sách"
        >
          <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Staff accounts list */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 lg:col-span-2 space-y-6">
          <h2 className="text-lg font-heading font-semibold text-[#2C2C2C] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Danh Sách Nhân Viên & Admin
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F9F5F0] border-b border-[#E5DFD8] text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium text-[#2C2C2C]">Họ Tên</th>
                  <th className="py-3 px-4 font-medium text-[#2C2C2C]">Email</th>
                  <th className="py-3 px-4 font-medium text-[#2C2C2C]">Vai Trò</th>
                  <th className="py-3 px-4 font-medium text-[#2C2C2C] text-right">Phân Quyền</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">Đang tải danh sách nhân viên...</td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">Không có tài khoản quản trị nào khác.</td>
                  </tr>
                ) : (
                  filteredAdmins.map((user) => (
                    <tr key={user.id} className="border-b border-[#E5DFD8] last:border-none hover:bg-[#F9F5F0]/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-[#2C2C2C]">{user.name}</td>
                      <td className="py-4 px-4 text-[#2C2C2C]">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-[#D4AF37]/15 text-[#D4AF37] uppercase tracking-wider">
                          Admin
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setSelectedRole(user.role)
                          }}
                          className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer"
                        >
                          Thay đổi vai trò
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Promote customer to admin card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-heading font-semibold text-[#2C2C2C] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4AF37]" /> Cấp Quyền Nhân Viên
            </h2>
            <p className="text-xs text-muted-foreground">
              Tìm kiếm khách hàng đã đăng ký tài khoản trong hệ thống để cấp quyền Admin quản trị cửa hàng.
            </p>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchTerm && filteredCustomers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy khách hàng nào</p>
              ) : searchTerm ? (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedUser(c)
                      setSelectedRole('admin')
                    }}
                    className="flex justify-between items-center p-2.5 bg-[#F9F5F0] hover:bg-[#D4AF37]/10 rounded border border-[#E5DFD8] cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#2C2C2C]">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.email}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Hãy nhập tên hoặc email để tìm kiếm</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-[#2C2C2C]">
                Thay Đổi Vai Trò
              </h2>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-[#F9F5F0] p-3 rounded mb-4 text-xs border border-[#E5DFD8]">
              <p><strong>Tên người dùng:</strong> {selectedUser.name}</p>
              <p className="mt-1"><strong>Email:</strong> {selectedUser.email}</p>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Chọn vai trò mới</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="admin">Quản Trị Viên (Admin)</option>
                  <option value="customer">Khách Hàng (Customer)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {saving ? 'Đang cập nhật...' : 'Cập Nhật'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
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
