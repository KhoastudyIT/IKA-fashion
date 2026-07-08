'use client'

import { useState } from 'react'
import { signIn } from '@/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user } = await signIn.email({ email, password })
      router.push(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer')
    } catch (err) {
      setError('Email hoặc mật khẩu không đúng')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded p-8 shadow-lg">
          <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Đăng Nhập</h1>
          <p className="text-muted-foreground mb-8">Chào mừng quay lại IKA Fashion</p>

          {error && (
            <div className="bg-destructive/20 border border-destructive rounded p-4 mb-6 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Chưa có tài khoản?{' '}
              <Link href="/auth/signup" className="text-accent hover:underline font-medium">
                Đăng Ký Ngay
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-accent hover:underline text-sm">
              ← Quay Lại Trang Chủ
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-secondary rounded p-4 mt-6 text-sm text-muted-foreground">
          <p className="font-medium mb-2">Demo Account:</p>
          <p>Email: demo@example.com</p>
          <p>Password: demo123456</p>
        </div>
      </div>
    </main>
  )
}
