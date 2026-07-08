'use client'

import { useState } from 'react'
import { signUp } from '@/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu không trùng khớp')
      return
    }

    setLoading(true)

    try {
      await signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard/customer',
      })
      router.push('/dashboard/customer')
    } catch (err) {
      setError('Lỗi tạo tài khoản. Email có thể đã được sử dụng.')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded p-8 shadow-lg">
          <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Đăng Ký</h1>
          <p className="text-muted-foreground mb-8">Tạo tài khoản IKA của bạn</p>

          {error && (
            <div className="bg-destructive/20 border border-destructive rounded p-4 mb-6 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Tên Đầy Đủ
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Mật Khẩu
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Xác Nhận Mật Khẩu
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang Tạo Tài Khoản...' : 'Đăng Ký'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-accent hover:underline font-medium">
                Đăng Nhập
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-accent hover:underline text-sm">
              ← Quay Lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
