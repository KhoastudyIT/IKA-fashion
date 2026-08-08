'use client'

// Cấu hình cửa hàng lưu ở DB qua /api/v1/admin/settings.
// Trước đây trang này ghi vào localStorage nên chỉ máy admin thấy được — khách
// vào web luôn nhận giá trị hardcode. Giờ mọi thay đổi ở đây hiện thẳng lên
// Header, Footer và trang Liên hệ của web khách.

import { useEffect, useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import { getSettings, updateSettings, StoreSettings, DEFAULT_SETTINGS } from '@/api'
import ImageField from '@/components/ImageField'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err: any) => setError(err.message || 'Không tải được cấu hình'))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      // updatedAt là field chỉ đọc của server, gửi lên sẽ bị zod từ chối.
      const { updatedAt, ...payload } = settings
      const updated = await updateSettings(payload)
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Lưu cấu hình hệ thống thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Đang tải cấu hình...</p>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Cài Đặt Hệ Thống</h1>
        <p className="text-muted-foreground text-sm">
          Thông tin nhận diện và liên hệ của cửa hàng. Lưu xong là khách hàng thấy ngay trên Header, Footer và trang Liên hệ.
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 text-sm rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Cấu hình hệ thống đã được cập nhật thành công!</span>
        </div>
      )}

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nhận diện thương hiệu */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E5DFD8] space-y-4">
            <h2 className="text-md font-heading font-semibold text-[#2C2C2C] border-b border-[#F9F5F0] pb-2 mb-4">
              Nhận Diện Thương Hiệu
            </h2>

            <ImageField
              value={settings.logo}
              onChange={(url) => set('logo', url)}
              type="settings"
              label="Logo"
              shape="square"
              onUploadingChange={setUploading}
              hint="Ảnh vuông, nền trong suốt (PNG/WEBP), tối thiểu 128×128. Bỏ trống thì web dùng dấu hiệu thương hiệu mặc định."
            />

            <div>
              <label className={labelCls}>Tên Cửa Hàng</label>
              <input
                required
                value={settings.storeName}
                onChange={(e) => set('storeName', e.target.value)}
                className={inputCls}
              />
              <p className={hintCls}>Hiện ở Header khi chưa có logo, ở Footer và dòng bản quyền.</p>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E5DFD8] space-y-4">
            <h2 className="text-md font-heading font-semibold text-[#2C2C2C] border-b border-[#F9F5F0] pb-2 mb-4">
              Thông Tin Liên Hệ
            </h2>

            <div>
              <label className={labelCls}>Hotline</label>
              <input
                value={settings.hotline}
                onChange={(e) => set('hotline', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Email Hỗ Trợ</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Địa Chỉ Cửa Hàng</label>
              <textarea
                value={settings.address}
                onChange={(e) => set('address', e.target.value)}
                rows={2}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Giờ Làm Việc</label>
              <input
                value={settings.workingHours}
                onChange={(e) => set('workingHours', e.target.value)}
                className={inputCls}
                placeholder="T2–T6: 9:00 – 18:00 · T7: 10:00 – 16:00"
              />
            </div>
          </div>
        </div>

        {/* Mạng xã hội */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E5DFD8] space-y-4">
          <h2 className="text-md font-heading font-semibold text-[#2C2C2C] border-b border-[#F9F5F0] pb-2 mb-4">
            Mạng Xã Hội
          </h2>
          <p className={hintCls}>Bỏ trống mục nào thì Footer ẩn luôn icon đó. Phải nhập URL đầy đủ kèm https://</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Facebook</label>
              <input
                type="url"
                value={settings.facebookUrl}
                onChange={(e) => set('facebookUrl', e.target.value)}
                className={inputCls}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className={labelCls}>Instagram</label>
              <input
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => set('instagramUrl', e.target.value)}
                className={inputCls}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className={labelCls}>TikTok</label>
              <input
                type="url"
                value={settings.tiktokUrl}
                onChange={(e) => set('tiktokUrl', e.target.value)}
                className={inputCls}
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-6 py-3 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {uploading ? 'Đang tải ảnh...' : saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]'
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'
const hintCls = 'text-xs text-muted-foreground mt-1'
