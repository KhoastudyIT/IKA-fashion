'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type PinnedProduct = { id: number; name: string; img?: string }

type ChatContextValue = {
  open: boolean
  setOpen: (value: boolean) => void
  pinned: PinnedProduct | null
  /** Mở khung chat, kèm sản phẩm muốn hỏi (nếu có). */
  openChat: (product?: PinnedProduct | null) => void
  clearPinned: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

// State ở cấp layout để trang chi tiết sản phẩm mở được khung chat và ghim
// sẵn sản phẩm, thay vì bắt khách gõ lại tên mẫu.
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState<PinnedProduct | null>(null)

  const openChat = useCallback((product: PinnedProduct | null = null) => {
    setPinned(product)
    setOpen(true)
  }, [])

  const clearPinned = useCallback(() => setPinned(null), [])

  const value = useMemo(
    () => ({ open, setOpen, pinned, openChat, clearPinned }),
    [open, pinned, openChat, clearPinned],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

/** null khi nằm ngoài ChatProvider (khu admin) — nơi gọi tự ẩn nút chat. */
export function useChat() {
  return useContext(ChatContext)
}
