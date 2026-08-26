'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X, TriangleAlert } from 'lucide-react'

/**
 * Thông báo và hộp thoại của riêng website, thay cho alert/confirm/prompt của
 * trình duyệt.
 *
 * Vì sao phải thay: hộp thoại của trình duyệt khoá cứng cả trang, không đổi
 * được chữ trên nút, mỗi trình duyệt hiện một kiểu, và trên iOS còn có thể bị
 * chặn — người dùng bấm nút xoá mà không thấy gì xảy ra.
 *
 * Cách dùng:
 *   const { toast, confirm, promptText } = useUI()
 *
 *   toast('Đã lưu thay đổi')                       // mặc định: thành công
 *   toast(err.message, 'error')
 *   if (!(await confirm({ ... }))) return          // trả về true/false
 *   const url = await promptText({ ... })          // trả về chuỗi hoặc null
 */

type ToastKind = 'success' | 'error' | 'info'

type Toast = { id: number; kind: ToastKind; message: string }

type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type PromptOptions = {
  title: string
  message?: string
  label?: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
}

type UIContextValue = {
  toast: (message: string, kind?: ToastKind) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  promptText: (opts: PromptOptions) => Promise<string | null>
}

const UIContext = createContext<UIContextValue | null>(null)

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (ctx) return ctx
  return {
    toast: (m) => { if (typeof window !== 'undefined') window.alert(m) },
    confirm: async (o) => (typeof window !== 'undefined' ? window.confirm(`${o.title}${o.message ? `\n\n${o.message}` : ''}`) : false),
    promptText: async (o) => (typeof window !== 'undefined' ? window.prompt(o.title, o.defaultValue ?? '') : null),
  }
}

const TOAST_MS = 4200

const TOAST_STYLE: Record<ToastKind, { icon: typeof Info; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: '#15803D', bg: '#F0FAF3' },
  error: { icon: AlertTriangle, color: '#B91C1C', bg: '#FEF2F2' },
  info: { icon: Info, color: '#1E3E7B', bg: '#F1F5FD' },
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dialog, setDialog] = useState<
    | null
    | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOptions)
    | ({ kind: 'prompt'; resolve: (v: string | null) => void } & PromptOptions)
  >(null)
  const [draft, setDraft] = useState('')
  const nextId = useRef(1)
  const primaryRef = useRef<HTMLButtonElement | HTMLInputElement | null>(null)

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, kind, message }])
    setTimeout(() => remove(id), TOAST_MS)
  }, [remove])

  const confirm = useCallback((opts: ConfirmOptions) => (
    new Promise<boolean>((resolve) => setDialog({ kind: 'confirm', resolve, ...opts }))
  ), [])

  const promptText = useCallback((opts: PromptOptions) => (
    new Promise<string | null>((resolve) => {
      setDraft(opts.defaultValue ?? '')
      setDialog({ kind: 'prompt', resolve, ...opts })
    })
  ), [])

  const close = useCallback((value: boolean | string | null) => {
    setDialog((d) => {
      if (!d) return null
      if (d.kind === 'confirm') d.resolve(value === true)
      else d.resolve(typeof value === 'string' ? value : null)
      return null
    })
  }, [])

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(dialog.kind === 'confirm' ? false : null) }
      if (e.key === 'Enter' && dialog.kind === 'confirm') { e.preventDefault(); close(true) }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => primaryRef.current?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(t)
    }
  }, [dialog, close])

  const nguyHiem = dialog?.kind === 'confirm' && dialog.danger

  return (
    <UIContext.Provider value={{ toast, confirm, promptText }}>
      {children}

      {/* ── Thông báo ─────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        className="fixed z-[100] left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const s = TOAST_STYLE[t.kind]
          const Icon = s.icon
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg motion-safe:animate-in"
              style={{ background: s.bg, borderColor: `${s.color}33` }}
            >
              <Icon size={18} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
              <p className="flex-1 text-sm leading-snug" style={{ color: s.color }}>{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Đóng thông báo"
                className="shrink-0 opacity-60 hover:opacity-100"
                style={{ color: s.color }}
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Hộp thoại xác nhận / nhập liệu ────────────────────────── */}
      {dialog && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center p-4"
          style={{ background: 'rgba(20,18,15,0.45)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(dialog.kind === 'confirm' ? false : null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-dialog-title"
            className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-6"
          >
            <div className="flex gap-3">
              {nguyHiem && <TriangleAlert size={22} className="shrink-0 mt-0.5" style={{ color: '#B91C1C' }} />}
              <div className="min-w-0 flex-1">
                <h2 id="ui-dialog-title" className="font-heading text-lg font-semibold text-foreground">
                  {dialog.title}
                </h2>
                {dialog.message && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dialog.message}</p>
                )}

                {dialog.kind === 'prompt' && (
                  <div className="mt-4">
                    {dialog.label && (
                      <label htmlFor="ui-dialog-input" className="block text-sm font-medium text-foreground mb-1.5">
                        {dialog.label}
                      </label>
                    )}
                    <input
                      id="ui-dialog-input"
                      ref={(el) => { primaryRef.current = el }}
                      value={draft}
                      placeholder={dialog.placeholder}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); close(draft) } }}
                      className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => close(dialog.kind === 'confirm' ? false : null)}
                className="px-4 py-2 rounded border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {dialog.kind === 'confirm' ? (dialog.cancelLabel ?? 'Hủy') : 'Hủy'}
              </button>
              <button
                ref={(el) => { if (dialog.kind === 'confirm') primaryRef.current = el }}
                onClick={() => close(dialog.kind === 'confirm' ? true : draft)}
                className="px-4 py-2 rounded text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: nguyHiem ? '#B91C1C' : '#2C2C2C' }}
              >
                {dialog.kind === 'confirm' ? (dialog.confirmLabel ?? 'Xác nhận') : (dialog.confirmLabel ?? 'Đồng ý')}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  )
}
