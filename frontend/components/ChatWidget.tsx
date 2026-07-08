'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from '@/auth-client'
import {
  getMyConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  Conversation,
  Message,
} from '@/api'
import { MessageSquare, X, Send, ChevronDown, CheckCheck, Check } from 'lucide-react'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
  if (diffH < 24) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function ChatWidget() {
  const { data: session, isPending } = useSession()
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const isHidden = isPending || !session || session.user.role === 'admin'

  const loadData = useCallback(async (scrollToBottom = false) => {
    try {
      const conv = await getMyConversation()
      setConversation(conv)
      if (conv) {
        setUnread(conv.unreadByCustomer)
        const msgs = await getConversationMessages(conv.id)
        setMessages(msgs)
        if (scrollToBottom) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      }
    } catch (e) {}
  }, [])

  // On open: load data, mark read, start polling
  useEffect(() => {
    if (!open) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    setLoading(true)
    loadData(true).finally(() => setLoading(false))

    // Mark as read when opened
    if (conversation) {
      markConversationRead(conversation.id).then(updated => {
        setUnread(0)
        setConversation(updated)
      }).catch(() => {})
    }

    pollingRef.current = setInterval(async () => {
      if (!conversation) {
        await loadData(false)
        return
      }
      try {
        const msgs = await getConversationMessages(conversation.id)
        setMessages(msgs)
        await markConversationRead(conversation.id)
        setUnread(0)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      } catch (e) {}
    }, 12000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [open]) // eslint-disable-line

  // Background polling for unread badge (when widget is closed)
  useEffect(() => {
    if (!session) return
    const interval = setInterval(async () => {
      if (open) return
      try {
        const conv = await getMyConversation()
        if (conv) setUnread(conv.unreadByCustomer)
      } catch (e) {}
    }, 20000)
    // initial
    getMyConversation().then(conv => { if (conv) setUnread(conv.unreadByCustomer) }).catch(() => {})
    return () => clearInterval(interval)
  }, [session, open])

  const handleOpen = async () => {
    setOpen(true)
    if (conversation) {
      markConversationRead(conversation.id).catch(() => {})
      setUnread(0)
    }
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      const result = await sendMessage({ content, conversationId: conversation?.id })
      setConversation(result.conversation)
      setMessages(prev => [...prev, result.message])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      setInput(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Popup */}
      {open && (
        <div
          className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5DFD8] flex flex-col overflow-hidden"
          style={{ height: '480px', animation: 'slideUp 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#2C2C2C] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Hỗ Trợ IKA Fashion</p>
              <p className="text-[10px] text-gray-400">Phản hồi trong vòng 24 giờ</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFBF7]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-14 h-14 rounded-full bg-[#F9F5F0] flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <p className="text-sm font-medium text-[#2C2C2C] mb-1">Chào {session?.user.name}!</p>
                <p className="text-xs text-[#7A7A7A] max-w-[220px]">
                  Gửi tin nhắn để được hỗ trợ về sản phẩm, đơn hàng hoặc bất kỳ câu hỏi nào.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === session?.user.id
                return (
                  <div key={msg.id} className={`flex gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-6 h-6 rounded-full bg-[#2C2C2C] flex items-center justify-center text-[10px] font-bold text-[#D4AF37] shrink-0 self-end">
                        A
                      </div>
                    )}
                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#2C2C2C] text-white rounded-br-sm'
                          : 'bg-white text-[#2C2C2C] border border-[#E5DFD8] rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-0.5 mt-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[9px] text-[#7A7A7A]">{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.isRead
                            ? <CheckCheck className="w-2.5 h-2.5 text-[#D4AF37]" />
                            : <Check className="w-2.5 h-2.5 text-[#7A7A7A]" />
                        )}
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[10px] font-bold text-white shrink-0 self-end">
                        {session?.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 bg-white border-t border-[#E5DFD8]">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Enter gửi)"
                className="flex-1 resize-none bg-[#F9F5F0] border border-[#E5DFD8] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] placeholder-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 max-h-20 overflow-y-auto"
                style={{ minHeight: '36px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-9 h-9 bg-[#D4AF37] hover:bg-[#C09B2A] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                {sending
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-3.5 h-3.5 text-white" />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-14 h-14 rounded-full bg-[#2C2C2C] hover:bg-[#3D3D3D] shadow-lg flex items-center justify-center transition-all duration-200 relative cursor-pointer hover:scale-105 active:scale-95"
        aria-label="Chat với hỗ trợ"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unread}
          </span>
        )}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  )
}
