'use client'

// =============================================================
// Thông tin cửa hàng (logo, tên, hotline, địa chỉ, mạng xã hội).
//
// Navigation, Footer và trang Liên hệ đều cần cùng bộ dữ liệu này. Gọi API một
// lần ở provider rồi chia xuống, thay vì mỗi component tự fetch — tránh 3
// request giống hệt nhau trên mọi trang.
//
// Trước đây dữ liệu nằm ở localStorage nên chỉ máy admin thấy được; giờ đọc từ
// /api/v1/settings nên khách vào web cũng thấy đúng cấu hình.
// =============================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getSettings, StoreSettings, DEFAULT_SETTINGS } from '@/api'

interface SettingsContextType {
  settings: StoreSettings
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)

  const refreshSettings = useCallback(async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch {
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    return { settings: DEFAULT_SETTINGS, refreshSettings: async () => { } }
  }
  return context
}
