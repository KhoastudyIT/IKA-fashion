'use client'

import { useEffect, useState } from 'react'
import {
  getAdminUsers, updateUserRole, createStaffAccount, deleteCustomer, toggleLockCustomer, ApiUser,
} from '@/api'
import { RefreshCw, X, ShieldCheck, UserPlus, Lock, Unlock, Trash2 } from 'lucide-react'
import AdminPagination from '@/components/ui/AdminPagination'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/auth-client'

import { useUI } from '@/components/context/UIDialogContext'
const PAGE_SIZE = 10

type NewAccount = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: string
}

const emptyAccount: NewAccount = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'staff',
}

export default function AdminStaffPage() {
  const { toast, confirm } = useUI()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [staffCount, setStaffCount] = useState(0)
  const [usersList, setUsersList] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Role changing state
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)
  const [selectedRole, setSelectedRole] = useState('staff')
  const [saving, setSaving] = useState(false)

  // Tạo tài khoản mới
  const [showCreate, setShowCreate] = useState(false)
  const [newAccount, setNewAccount] = useState<NewAccount>(emptyAccount)
  const [createError, setCreateError] = useState('')
  const [createdInfo, setCreatedInfo] = useState('')
  const [creating, setCreating] = useState(false)

  // Chỉ tài khoản nội bộ — khách hàng thuộc trang Khách Hàng, không lẫn vào đây.
  const loadUsers = async (pageToLoad: number) => {
    try {
      setLoading(true)
      // Gọi kèm một truy vấn đếm: danh sách đã phân trang nên không đếm được
      // số nhân viên từ mảng của riêng trang hiện tại.
      const [list, staffOnly] = await Promise.all([
        getAdminUsers({ roles: ['staff', 'admin'], page: pageToLoad, limit: PAGE_SIZE }),
        getAdminUsers({ roles: ['staff'], page: 1, limit: 1 }),
      ])
      setUsersList(list.items ?? [])
      setTotalPages(list.pagination?.totalPages ?? 1)
      setTotal(list.pagination?.total ?? (list.items?.length || 0))
      setStaffCount(staffOnly.pagination?.total ?? 0)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(currentPage)
  }, [currentPage])

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setSaving(true)
    setError('')
    try {
      await updateUserRole(selectedUser.id, selectedRole)
      // Reload everything to reflect changes
      await loadUsers(currentPage)
      setSelectedUser(null)
    } catch (err: any) {
      setError(err.message || 'Cập nhật vai trò thất bại')
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setNewAccount(emptyAccount)
    setCreateError('')
    setCreatedInfo('')
    setShowCreate(true)
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    // Kiểm tra ngay ở form: backend chỉ nhận `password`, không biết ô nhập lại.
    if (newAccount.password !== newAccount.confirmPassword) {
      setCreateError('Mật khẩu nhập lại không khớp')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const user = await createStaffAccount({
        name: newAccount.name.trim(),
        email: newAccount.email.trim(),
        password: newAccount.password,
        role: newAccount.role,
      })
      // Tải lại thay vì chèn vào đầu mảng: danh sách đã phân trang nên chèn tay
      // sẽ lệch với tổng số và thứ tự thật.
      await loadUsers(currentPage)
      setShowCreate(false)
      setCreatedInfo(
        `Đã tạo tài khoản ${newAccount.role === 'admin' ? 'quản trị viên' : 'nhân viên'} `
        + `cho ${user.name} (${user.email}). Hãy gửi mật khẩu vừa đặt cho họ.`,
      )
    } catch (err: any) {
      setCreateError(err.message || 'Tạo tài khoản thất bại')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleLock = async (user: ApiUser) => {
    const action = user.isLocked ? 'mở khóa' : 'khóa'
    if (!(await confirm({ title: `Bạn chắc chắn muốn ${action} tài khoản "${user.name}"?` }))) return
    try {
      const updated = await toggleLockCustomer(user.id)
      setUsersList((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (err: any) {
      toast(err.message || `Lỗi ${action} tài khoản`, 'error')
    }
  }

  const handleDelete = async (user: ApiUser) => {
    if (!(await confirm({ title: `Xóa tài khoản "${user.name}"? Thao tác này không thể hoàn tác.`, danger: true }))) return
    try {
      await deleteCustomer(user.id)
      await loadUsers(currentPage)
    } catch (err: any) {
      toast(err.message || 'Lỗi xóa tài khoản', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Tài Khoản Nhân Viên</h1>
          <p className="text-muted-foreground text-sm">Tạo tài khoản nhân viên mới, quản lý danh sách các tài khoản có quyền truy cập quản trị hệ thống bán hàng và phân quyền.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadUsers(currentPage)}
            className="p-2 border border-[#E5DFD8] rounded-full hover:bg-[#F9F5F0] transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-medium rounded shadow-sm transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Tạo Tài Khoản Nhân Viên
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      {createdInfo && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex justify-between items-start gap-4">
          <p className="text-green-800 text-sm">{createdInfo}</p>
          <button
            onClick={() => setCreatedInfo('')}
            className="p-1 hover:bg-green-100 rounded-full shrink-0 cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4 text-green-700" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tổng tài khoản nội bộ</p>
          <p className="text-2xl font-heading font-semibold text-[#2C2C2C]">{total}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Nhân viên</p>
          <p className="text-2xl font-heading font-semibold text-slate-700">{staffCount}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E5DFD8]">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Quản trị viên</p>
          <p className="text-2xl font-heading font-semibold text-[#D4AF37]">
            {Math.max(0, total - staffCount)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD8] p-6 space-y-6">
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
                <th className="py-3 px-4 font-medium text-[#2C2C2C]">Ngày Tạo</th>
                <th className="py-3 px-4 font-medium text-[#2C2C2C] text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải danh sách nhân viên...</td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chưa có tài khoản nhân viên nào. Hãy bấm &quot;Tạo Tài Khoản Nhân Viên&quot; để thêm.
                  </td>
                </tr>
              ) : (
                usersList.map((user) => (
                  <tr key={user.id} className="border-b border-[#E5DFD8] last:border-none hover:bg-[#F9F5F0]/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-[#2C2C2C]">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {user.isLocked && (
                          <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded bg-red-100 text-red-800 uppercase tracking-wider">
                            Bị Khóa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#2C2C2C]">{user.email}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Nhân Viên'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mặc định'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-3 justify-end items-center">
                        {/* Không cho tự hạ quyền chính mình — backend cũng chặn,
                            đây chỉ là để không mời người dùng bấm vào lỗi. */}
                        {user.id === session?.user?.id ? (
                          <span className="text-xs text-muted-foreground italic">Bạn (đang đăng nhập)</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setSelectedRole(user.role)
                            }}
                            className="text-[#D4AF37] hover:underline text-xs font-semibold cursor-pointer"
                          >
                            Đổi vai trò
                          </button>
                        )}
                        {/* Tài khoản admin không khóa/xóa được — backend chặn để hệ
                            thống không rơi vào cảnh mất sạch quản trị viên. */}
                        {user.role === 'admin' ? (
                          <span className="text-xs text-muted-foreground italic">Không thể khóa/xóa</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleLock(user)}
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
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition-all cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pt-4 border-t border-[#E5DFD8] flex justify-end">
            <AdminPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-[#2C2C2C] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#D4AF37]" /> Tạo Tài Khoản
              </h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-[#F9F5F0] rounded-full cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {createError && <p className="text-red-600 mb-4 text-sm">{createError}</p>}

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Họ Tên *</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="Vd: Trần Thu Hà"
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Email Đăng Nhập *</label>
                <input
                  required
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  placeholder="Vd: ha.tran@ika.vn"
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Mật Khẩu *</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Nhập Lại *</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={newAccount.confirmPassword}
                    onChange={(e) => setNewAccount({ ...newAccount, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Vai Trò</label>
                <select
                  value={newAccount.role}
                  onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="staff">Nhân Viên (Staff)</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                </select>
                <p className="mt-2 text-[0.6875rem] text-muted-foreground leading-relaxed">
                  {newAccount.role === 'staff' ? (
                    <>
                      <strong className="text-[#2C2C2C]">Nhân viên</strong> chỉ xem được sản phẩm, danh mục,
                      khách hàng, khuyến mãi và quản lý được đơn hàng, tin nhắn, liên hệ.
                    </>
                  ) : (
                    <>
                      <strong className="text-[#2C2C2C]">Quản trị viên</strong> có toàn quyền trên hệ thống,
                      kể cả cài đặt và phân quyền tài khoản khác.
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 border border-[#E5DFD8] text-[#2C2C2C] font-semibold rounded hover:bg-[#F9F5F0] transition-colors cursor-pointer text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <option value="staff">Nhân Viên (Staff)</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                </select>
                <p className="mt-2 text-[0.6875rem] text-muted-foreground leading-relaxed">
                  <strong className="text-[#2C2C2C]">Nhân viên</strong> chỉ xem được sản phẩm, danh mục,
                  khách hàng, khuyến mãi và quản lý được đơn hàng, tin nhắn, liên hệ.
                  Vai trò mới có hiệu lực khi tài khoản đó đăng nhập lại.
                </p>
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
