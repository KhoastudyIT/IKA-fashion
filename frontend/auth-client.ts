'use client'

// =============================================================
// Auth client cho IKA Fashion — gọi Express API, lưu token + user
// ở localStorage. Giữ nguyên API surface (signIn / signUp / signOut /
// useSession) để các trang cũ dùng được mà gần như không phải sửa.
// =============================================================

import { useEffect, useState } from 'react'
import { apiLogin, apiRegister, apiLogout, setToken, clearToken, getToken } from './api'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  address?: string
}
export interface Session {
  user: SessionUser
}

const USER_KEY = 'ika_user'
const AUTH_EVENT = 'ika-auth-change'

function emitAuthChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_EVENT))
}

function persist(user: SessionUser, token: string) {
  setToken(token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  emitAuthChange()
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw || !getToken()) return null
  try {
    return { user: JSON.parse(raw) as SessionUser }
  } catch {
    return null
  }
}

export const signIn = {
  async email({ email, password }: { email: string; password: string; callbackURL?: string }) {
    const { user, token } = await apiLogin({ email, password })
    persist(user, token)
    return { user, token }
  },
}

export const signUp = {
  async email({ name, email, password }: { name: string; email: string; password: string; callbackURL?: string }) {
    const { user, token } = await apiRegister({ name, email, password })
    persist(user, token)
    return { user, token }
  },
}

export async function signOut() {
  try {
    await apiLogout()
  } catch {
    // bỏ qua lỗi mạng khi đăng xuất
  }
  clearToken()
  localStorage.removeItem(USER_KEY)
  emitAuthChange()
}

export function useSession() {
  const [data, setData] = useState<Session | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    const sync = () => {
      setData(readSession())
      setIsPending(false)
    }
    sync()
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { data, isPending }
}
