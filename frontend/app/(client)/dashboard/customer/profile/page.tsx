'use client'

import { useState, useEffect } from 'react'
import { useSession, updateSessionUser } from '@/auth-client'
import { updateProfile } from '@/api'
import { useRouter } from 'next/navigation'
import { VN_CITIES, isValidPhone } from '@/lib/validation'

import { useUI } from '@/components/context/UIDialogContext'
export default function CustomerProfilePage() {
  const { toast } = useUI()
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [name, setName]           = useState('')
  const [phone, setPhone]         = useState('')
  const [address, setAddress]     = useState('')
  const [city, setCity]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [phoneError, setPhoneError] = useState('')

  // Tracks the last successfully saved snapshot — Cancel resets to this, not to empty strings
  const [savedData, setSavedData] = useState({ name: '', phone: '', address: '', city: '' })

  // Pre-populate once session is available
  useEffect(() => {
    if (session?.user) {
      const initial = {
        name:    session.user.name    ?? '',
        phone:   session.user.phone   ?? '',
        address: session.user.address ?? '',
        city:    session.user.city    ?? '',
      }
      setName(initial.name)
      setPhone(initial.phone)
      setAddress(initial.address)
      setCity(initial.city)
      setSavedData(initial)
    }
  }, [session])

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
    setPhoneError('')

    // Frontend phone validation — mirrors the backend Zod regex
    if (phone && !isValidPhone(phone)) {
      setPhoneError('Số điện thoại không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng 03/05/07/08/09).')
      return
    }

    setLoading(true)
    try {
      const saved = await updateProfile({ name, phone, address, city })
      // Sync global session so checkout & other pages get fresh data instantly
      updateSessionUser({ name: saved.name, phone: saved.phone, address: saved.address, city: saved.city })
      // Update the local saved snapshot so Cancel resets to the NEWLY saved data
      setSavedData({ name: saved.name ?? '', phone: saved.phone ?? '', address: saved.address ?? '', city: saved.city ?? '' })
      toast('Cập nhật thành công')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại'
      toast(`Lỗi: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(savedData.name)
    setPhone(savedData.phone)
    setAddress(savedData.address)
    setCity(savedData.city)
  }

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-8">Hồ Sơ Cá Nhân</h1>

      <div>
        <div className="bg-card rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Tên Đầy Đủ
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  defaultValue={session.user.email}
                  readOnly
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Số Điện Thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                  placeholder="0912345678"
                  className={`w-full px-4 py-2 bg-secondary border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent ${
                    phoneError ? 'border-destructive' : 'border-border'
                  }`}
                />
                {phoneError && (
                  <p className="mt-1 text-xs text-destructive">{phoneError}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                  Thành Phố
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {VN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                Địa Chỉ
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                className="w-full px-4 py-2 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-foreground text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-border text-foreground font-medium rounded hover:bg-secondary transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
