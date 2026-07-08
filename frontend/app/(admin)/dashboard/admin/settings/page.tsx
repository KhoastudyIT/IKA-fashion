'use client'

import { useEffect, useState } from 'react'
import { Settings, Save, CheckCircle } from 'lucide-react'

type StoreSettings = {
  storeName: string
  hotline: string
  email: string
  address: string
  shippingFee: string
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
}

const defaultSettings: StoreSettings = {
  storeName: 'IKA - Luxury Fashion',
  hotline: '0987.654.321',
  email: 'support@ika-fashion.vn',
  address: 'Số 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  shippingFee: '30000',
  bankName: 'Vietcombank (VCB)',
  bankAccountName: 'CONG TY TNHH IKA FASHION',
  bankAccountNumber: '1023456789',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('ika_settings')
      if (raw) {
        try {
          setSettings(JSON.parse(raw))
        } catch {
          // fallback to default
        }
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      localStorage.setItem('ika_settings', JSON.stringify(settings))
      setSaved(true)
      // Tự kích hoạt sự kiện storage để đồng bộ
      window.dispatchEvent(new Event('storage'))
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Lưu cấu hình hệ thống thất bại')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[#2C2C2C] mb-1">Cài Đặt Hệ Thống</h1>
        <p className="text-muted-foreground text-sm">Cấu hình thông tin cơ bản của shop thời trang, phí vận chuyển và tài khoản thanh toán nhận tiền.</p>
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
          {/* General Store info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E5DFD8] space-y-4">
            <h2 className="text-md font-heading font-semibold text-[#2C2C2C] border-b border-[#F9F5F0] pb-2 mb-4">
              Thông Tin Cửa Hàng
            </h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tên Cửa Hàng</label>
              <input
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Hotline Liên Hệ</label>
              <input
                required
                value={settings.hotline}
                onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Hỗ Trợ</label>
              <input
                required
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Địa Chỉ Shop (Footer)</label>
              <textarea
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={2}
                className={inputCls}
              />
            </div>
          </div>

          {/* Shipping & Payment settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E5DFD8] space-y-4">
            <h2 className="text-md font-heading font-semibold text-[#2C2C2C] border-b border-[#F9F5F0] pb-2 mb-4">
              Vận Chuyển & Thanh Toán
            </h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phí Vận Chuyển (đ)</label>
              <input
                required
                type="number"
                min="0"
                value={settings.shippingFee}
                onChange={(e) => setSettings({ ...settings, shippingFee: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ngân Hàng Nhận Tiền</label>
              <input
                required
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tên Chủ Tài Khoản</label>
              <input
                required
                value={settings.bankAccountName}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Số Tài Khoản</label>
              <input
                required
                value={settings.bankAccountNumber}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] font-semibold rounded shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" /> Lưu cấu hình
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]'
