'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from '@/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getMyConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  Conversation,
  Message,
} from '@/api'
import { MessageSquare, Send, ArrowLeft, CheckCheck, Check, RefreshCw } from 'lucide-react'

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPending && !session) router.push('/auth/login')
  }, [session, isPending, router])

  const loadConversation = useCallback(async () => {
    try {
      const conv = await getMyConversation()
      setConversation(conv)
      if (conv) {
        const msgs = await getConversationMessages(conv.id)
        setMessages(msgs)
        await markConversationRead(conv.id)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
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
        const msgs = await getConversationMessages(conversation.id)
        setMessages(msgs)
        await markConversationRead(conversation.id)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      } catch (e) {}
    }, 10000)
    return () => clearInterval(interval)
  }, [session]) // eslint-disable-line

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      const result = await sendMessage({
        content,
        conversationId: conversation?.id,
      })
      if (!conversation) {
        setConversation(result.conversation)
      } else {
        setConversation(result.conversation)
      }
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

  if (isPending || !session) return null

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard/customer" className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Tin Nhắn 
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversation
                ? `Cuộc trò chuyện của bạn · Tự động cập nhật mỗi 10 giây`
                : 'Bắt đầu cuộc trò chuyện với chúng tôi'}
            </p>
          </div>
          <button
            onClick={loadConversation}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex-1 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden" style={{ minHeight: '60vh' }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FFFBF7]">
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
                const isMe = msg.senderId === session.user.id
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-[#2C2C2C] flex items-center justify-center text-xs font-bold text-[#D4AF37] shrink-0 self-end">
                        A
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[#2C2C2C] text-white rounded-br-sm'
                          : 'bg-white text-[#2C2C2C] border border-border rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.isRead
                            ? <CheckCheck className="w-3 h-3 text-accent" />
                            : <Check className="w-3 h-3 text-muted-foreground" />
                        )}
                        {!isMe && (
                          <span className="text-[10px] text-muted-foreground">· Admin IKA</span>
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
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-3 bg-card border-t border-border">
            <div className="flex gap-2 items-end">
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
                onClick={handleSend}
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
    </main>
  )
}
