'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from '@/auth-client'
import { useRouter } from 'next/navigation'
import {
  getMyConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  Conversation,
  Message,
} from '@/api'
import { RichText, SuggestionCards } from '@/components/ChatMessageBody'
import { QUICK_REPLIES } from '@/components/chatQuickReplies'
import { MessageSquare, Send, CheckCheck, Check, RefreshCw, Sparkles, Plus, X } from 'lucide-react'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
  if (diffH < 24) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function CustomerMessagesPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cuộn chính khung tin nhắn, không phải cả trang.
  const scrollToBottom = () => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // Khách đang đọc tin cũ ở phía trên thì đừng kéo họ xuống đáy.
  const isNearBottom = () => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    if (!isPending && !session) router.push('/auth/login')
  }, [session, isPending, router])

  const loadConversation = useCallback(async () => {
    try {
      const conv = await getMyConversation(true)
      setConversation(conv)
      if (conv) {
        const msgs = await getConversationMessages(conv.id)
        setMessages(msgs)
        // Hội thoại mới chỉ có lời chào của bot -> bung sẵn bảng gợi ý.
        if (msgs.length <= 1) setShowQuick(true)
        await markConversationRead(conv.id)
        setTimeout(scrollToBottom, 50)
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    loadConversation()
    // Poll every 10s
    const interval = setInterval(async () => {
      if (!conversation) {
        await loadConversation()
        return
      }
      try {
        // Chốt vị trí TRƯỚC khi thêm tin mới: sau khi render thì phép đo đã lệch.
        const stick = isNearBottom()
        const msgs = await getConversationMessages(conversation.id)
        setMessages(msgs)
        await markConversationRead(conversation.id)
        if (stick) setTimeout(scrollToBottom, 50)
      } catch (e) { }
    }, 10000)
    return () => clearInterval(interval)
  }, [session]) // eslint-disable-line

  const handleSend = async (preset?: string) => {
    const content = (preset ?? input).trim()
    if (!content || sending) return
    setSending(true)
    setShowQuick(false)
    setInput('')
    try {
      const result = await sendMessage({
        content,
        conversationId: conversation?.id,
      })
      setConversation(result.conversation)
      setMessages(prev => [...prev, result.message, ...(result.botMessage ? [result.botMessage] : [])])
      setTimeout(scrollToBottom, 50)
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

  if (isPending || !session) return null

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-accent" />
            Tin Nhắn
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {conversation
              ? 'Cuộc trò chuyện của bạn · Tự động cập nhật mỗi 10 giây'
              : 'Bắt đầu cuộc trò chuyện với chúng tôi'}
          </p>
        </div>
        <button
          onClick={loadConversation}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer shrink-0"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col w-full">
        {/* Chiều cao CỐ ĐỊNH: để khung tự giãn theo nội dung thì overflow-y-auto
            không bao giờ kích hoạt và cả trang cuộn thay vì khung tin nhắn. */}
        <div className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden h-[65vh] min-h-[420px] max-h-[720px]">

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FFFBF7]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">Chưa có tin nhắn</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Gửi tin nhắn đầu tiên để bắt đầu trò chuyện với đội ngũ hỗ trợ của IKA Fashion
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderRole === 'customer'
                const isBot = msg.senderRole === 'ai'
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 self-end ${isBot ? 'bg-[#D4AF37]' : 'bg-[#2C2C2C]'
                        }`}>
                        {isBot
                          ? <Sparkles className="w-4 h-4 text-white" />
                          : <span className="text-xs font-bold text-[#D4AF37]">A</span>}
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                          ? 'bg-[#2C2C2C] text-white rounded-br-sm'
                          : 'bg-white text-[#2C2C2C] border border-border rounded-bl-sm shadow-sm'
                        }`}>
                        <RichText text={msg.content} />
                        {msg.suggestions?.length > 0 && <SuggestionCards items={msg.suggestions} />}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[0.625rem] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.isRead
                            ? <CheckCheck className="w-3 h-3 text-accent" />
                            : <Check className="w-3 h-3 text-muted-foreground" />
                        )}
                        {!isMe && (
                          <span className="text-[0.625rem] text-muted-foreground">
                            · {isBot ? 'Trợ lý IKA' : 'Admin IKA'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shrink-0 self-end">
                        {session.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Câu hỏi nhanh — bật/tắt bằng nút + cạnh ô nhập */}
          {showQuick && (
            <div className="px-4 py-2.5 bg-secondary/50 border-t border-border flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {QUICK_REPLIES.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={sending}
                  className="text-xs px-3 py-1.5 rounded-full border border-accent/50 text-foreground bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 py-3 bg-card border-t border-border">
            <div className="flex gap-2 items-end">
              <button
                onClick={() => setShowQuick(v => !v)}
                title={showQuick ? 'Ẩn câu hỏi nhanh' : 'Câu hỏi nhanh'}
                aria-label={showQuick ? 'Ẩn câu hỏi nhanh' : 'Câu hỏi nhanh'}
                aria-expanded={showQuick}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                  showQuick
                    ? 'bg-accent border-accent text-accent-foreground'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
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
                placeholder="Nhập tin nhắn của bạn... (Enter để gửi)"
                className="flex-1 resize-none bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 max-h-28 overflow-y-auto"
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="w-10 h-10 bg-[#2C2C2C] hover:bg-[#3D3D3D] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
