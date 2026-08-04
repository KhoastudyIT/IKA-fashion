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
import { useChat } from '@/components/ChatContext'
import { RichText, SuggestionCards } from '@/components/ChatMessageBody'
import { QUICK_REPLIES } from '@/components/chatQuickReplies'
import {
  MessageSquare, X, Send, ChevronDown, CheckCheck, Check,
  Sparkles, Headset, Plus, ShoppingBag,
} from 'lucide-react'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
  if (diffH < 24) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function ChatWidget() {
  const { data: session, isPending } = useSession()
  const chat = useChat()
  const open = chat?.open ?? false
  const pinned = chat?.pinned ?? null

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [showQuick, setShowQuick] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const isHidden = isPending || !session || session.user.role === 'admin'

  // Cuộn trong khung chat; scrollIntoView có thể kéo theo cả trang phía sau
  // vì widget là position: fixed.
  const scrollToBottom = () =>
    setTimeout(() => {
      const el = listRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 50)

  // Đang đọc tin cũ thì không giật xuống đáy khi có tin mới về.
  const isNearBottom = () => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const loadMessages = useCallback(async (convId: string) => {
    const msgs = await getConversationMessages(convId)
    setMessages(msgs)
    return msgs
  }, [])

  useEffect(() => {
    if (!open) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    let convId = conversation?.id ?? null
    setLoading(true)
      ; (async () => {
        try {
          const conv = await getMyConversation(true)
          if (!conv) return
          convId = conv.id
          setConversation(conv)
          const msgs = await loadMessages(conv.id)
          // Hội thoại mới chỉ có lời chào -> bung sẵn bảng gợi ý.
          setShowQuick(msgs.length <= 1)
          await markConversationRead(conv.id)
          setUnread(0)
          scrollToBottom()
        } catch {
          // lỗi mạng: bỏ qua, không phá vỡ giao diện
        } finally {
          setLoading(false)
        }
      })()

    pollingRef.current = setInterval(async () => {
      if (!convId) return
      try {
        const stick = isNearBottom()
        await loadMessages(convId)
        await markConversationRead(convId)
        setUnread(0)
        if (stick) scrollToBottom()
      } catch {
        // lỗi mạng: bỏ qua, lần poll sau thử lại
      }
    }, 12000)

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [open]) // eslint-disable-line

  useEffect(() => {
    if (isHidden) return
    const refresh = () =>
      getMyConversation().then(conv => { if (conv) setUnread(conv.unreadByCustomer) }).catch(() => { })
    refresh()
    const interval = setInterval(() => { if (!open) refresh() }, 20000)
    return () => clearInterval(interval)
  }, [isHidden, open])

  // Vừa ghim sản phẩm -> mở sẵn bảng gợi ý, các câu hay hỏi nhất đều ở đó.
  useEffect(() => {
    if (pinned) {
      setShowQuick(true)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [pinned])

  const submit = async (content: string) => {
    if (!content.trim() || sending) return
    setSending(true)
    setShowQuick(false)
    setInput('')
    try {
      const result = await sendMessage({
        content: content.trim(),
        conversationId: conversation?.id,
        productId: pinned?.id ?? null,
      })
      setConversation(result.conversation)
      setMessages(prev => [...prev, result.message, ...(result.botMessage ? [result.botMessage] : [])])
      // Bỏ ghim sau câu đầu tiên: server đã nhớ qua last_product_id. Giữ ghim
      // mãi thì khách hỏi sang mẫu khác vẫn bị trả lời về mẫu cũ.
      chat?.clearPinned()
      scrollToBottom()
    } catch {
      setInput(content) // trả lại nội dung để khách gửi lại
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  if (isHidden || !chat) return null

  // Bot đang tắt = nhân viên đã tiếp nhận, đổi nhãn để khách biết đang chờ ai
  const botOn = conversation?.aiEnabled ?? true

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5DFD8] flex flex-col overflow-hidden"
          style={{ height: '520px', animation: 'slideUp 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#2C2C2C] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center">
              {botOn
                ? <Sparkles className="w-5 h-5 text-white" />
                : <Headset className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {botOn ? 'Trợ Lý IKA Fashion' : 'Nhân Viên IKA Fashion'}
              </p>
              <p className="text-[10px] text-gray-400">
                {botOn ? 'Trả lời tự động 24/7' : 'Đang chờ nhân viên phản hồi'}
              </p>
            </div>
            <button
              onClick={() => chat.setOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Thu gọn khung chat"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {pinned && (
            <div className="px-3 py-2 bg-[#FDF8E9] border-b border-[#D4AF37]/30 flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="text-[10px] text-[#7A7A7A] truncate flex-1">
                Đang hỏi về: <span className="text-[#2C2C2C] font-medium">{pinned.name}</span>
              </span>
              <button
                onClick={chat.clearPinned}
                className="p-0.5 text-[#7A7A7A] hover:text-[#2C2C2C] cursor-pointer shrink-0"
                aria-label="Bỏ ghim sản phẩm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFBF7]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderRole === 'customer'
                const isBot = msg.senderRole === 'ai'
                return (
                  <div key={msg.id} className={`flex gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 self-end ${isBot ? 'bg-[#D4AF37]' : 'bg-[#2C2C2C]'
                        }`}>
                        {isBot
                          ? <Sparkles className="w-3 h-3 text-white" />
                          : <span className="text-[10px] font-bold text-[#D4AF37]">A</span>}
                      </div>
                    )}
                    <div className={`max-w-[82%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Ghim đã bị gỡ sau khi gửi, nên gắn nhãn mẫu lên chính
                          tin nhắn để khách vẫn thấy mình đã hỏi về sản phẩm nào. */}
                      {isMe && msg.product && (
                        <span className="mb-1 px-2 py-0.5 bg-[#FDF8E9] border border-[#D4AF37]/40 rounded-lg text-[10px] text-[#8A7020] truncate max-w-full">
                          {msg.product.name}
                        </span>
                      )}
                      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${isMe
                          ? 'bg-[#2C2C2C] text-white rounded-br-sm'
                          : 'bg-white text-[#2C2C2C] border border-[#E5DFD8] rounded-bl-sm shadow-sm'
                        }`}>
                        <RichText text={msg.content} />
                        {msg.suggestions?.length > 0 && (
                          <SuggestionCards items={msg.suggestions} onNavigate={() => chat.setOpen(false)} />
                        )}
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

            {sending && (
              <div className="flex gap-1.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shrink-0 self-end">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white border border-[#E5DFD8] rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {showQuick && !loading && (
            <div className="px-3 py-2 border-t border-[#E5DFD8] bg-[#FFFBF7] max-h-28 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => submit(q)}
                    disabled={sending}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-[#D4AF37]/50 text-[#2C2C2C] bg-white hover:bg-[#D4AF37] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2.5 bg-white border-t border-[#E5DFD8]">
            <div className="flex gap-2 items-end">
              <button
                onClick={() => setShowQuick(v => !v)}
                title={showQuick ? 'Ẩn câu hỏi nhanh' : 'Câu hỏi nhanh'}
                aria-label={showQuick ? 'Ẩn câu hỏi nhanh' : 'Câu hỏi nhanh'}
                aria-expanded={showQuick}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${showQuick
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-white'
                    : 'bg-[#F9F5F0] border-[#E5DFD8] text-[#7A7A7A] hover:text-[#2C2C2C]'
                  }`}
              >
                {showQuick ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
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
                onClick={() => submit(input)}
                disabled={!input.trim() || sending}
                className="w-9 h-9 bg-[#D4AF37] hover:bg-[#C09B2A] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Gửi tin nhắn"
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
        onClick={() => chat.setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#2C2C2C] hover:bg-[#3D3D3D] shadow-lg flex items-center justify-center transition-all duration-200 relative cursor-pointer hover:scale-105 active:scale-95"
        aria-label="Chat với trợ lý IKA"
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

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  )
}
