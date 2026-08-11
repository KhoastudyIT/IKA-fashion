'use client'

// Trang Cài Đặt lo phần bảo mật tài khoản (đổi mật khẩu).
// Thông tin cá nhân (tên, SĐT, địa chỉ) thuộc về trang Hồ Sơ — không làm trùng ở đây.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from '@/auth-client'
import { changePassword } from '@/api'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function CustomerSettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!session) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Kiểm tra phía client trước để khỏi tốn một vòng request cho lỗi hiển nhiên.
    // Backend vẫn kiểm tra lại đầy đủ.
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các ô.')
      return
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }

    setLoading(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setSuccess('Đổi mật khẩu thành công.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-8">Cài Đặt</h1>

      <div className="max-w-xl">
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Đổi Mật Khẩu</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tài khoản <span className="text-foreground">{session.user.email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                Mật khẩu hiện tại
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setError(''); setSuccess('') }}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                Mật khẩu mới
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); setSuccess('') }}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">Ít nhất 6 ký tự.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSuccess('') }}
                className={inputCls}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            </button>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Đổi Mật Khẩu'}
            </button>
          </form>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Thông Tin Cá Nhân</h2>
          <p className="text-sm text-muted-foreground">
            Tên, số điện thoại và địa chỉ được quản lý ở{' '}
            <Link href="/dashboard/customer/profile" className="text-foreground underline hover:opacity-80">
              trang Hồ Sơ
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  )
}
