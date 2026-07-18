'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from '@/auth-client'
import {
  getAdminConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
  Conversation,
  Message,
} from '@/api'
import {
  MessageSquare,
  Send,
  RefreshCw,
  Trash2,
  Search,
  User,
  Clock,
  CheckCheck,
  Check,
  ChevronLeft,
} from 'lucide-react'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = diffMs / (1000 * 60 * 60)
  if (diffH < 24) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminMessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Load all conversations
  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await getAdminConversations()
      setConversations(data)
      // Update selected conversation if it's in the list
      if (selected) {
        const updated = data.find(c => c.id === selected.id)
        if (updated) setSelected(updated)
      }
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selected])

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await getConversationMessages(convId, 'admin')
      setMessages(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      // silent fail
    }
  }, [])

  // Select a conversation
  const selectConversation = async (conv: Conversation) => {
    setSelected(conv)
    setMobileShowChat(true)
    await loadMessages(conv.id)
    // Mark as read
    try {
      const updated = await markConversationRead(conv.id, 'admin')
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadByAdmin: 0 } : c))
    } catch (e) {}
  }

  // Send reply
  const handleSend = async () => {
    if (!input.trim() || !selected || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      const result = await sendMessage({ content, conversationId: selected.id }, 'admin')
      setMessages(prev => [...prev, result.message])
      setConversations(prev => prev.map(c =>
        c.id === selected.id ? { ...c, lastMessage: content, lastMessageAt: result.message.createdAt } : c
      ))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      setInput(content) // restore on error
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

  const handleDelete = async (msgId: string) => {
    if (!confirm('Xóa tin nhắn này?')) return
    try {
      await deleteMessage(msgId)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch (e) {}
  }

  // Auto-polling
  useEffect(() => {
    loadConversations()
    pollingRef.current = setInterval(() => {
      loadConversations(true)
      if (selected) loadMessages(selected.id)
    }, 10000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, []) // eslint-disable-line

  // Reload messages when selected changes (for polling)
  useEffect(() => {
    if (!selected) return
    const interval = setInterval(() => loadMessages(selected.id), 8000)
    return () => clearInterval(interval)
  }, [selected, loadMessages])

  const filtered = conversations.filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((s, c) => s + c.unreadByAdmin, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#2C2C2C] flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-[#D4AF37]" />
            Quản Lý Tin Nhắn
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">{conversations.length} cuộc trò chuyện</p>
        </div>
        <button
          onClick={() => loadConversations(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5DFD8] rounded-lg text-sm text-[#7A7A7A] hover:bg-[#F9F5F0] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 flex bg-white rounded-xl border border-[#E5DFD8] shadow-sm overflow-hidden">

        {/* ── Sidebar: Conversation List ── */}
        <div className={`flex flex-col border-r border-[#E5DFD8] ${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 shrink-0`}>
          {/* Search */}
          <div className="p-3 border-b border-[#E5DFD8]">
            <div className="flex items-center gap-2 bg-[#F9F5F0] rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-[#7A7A7A] shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#2C2C2C] placeholder-[#7A7A7A] outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0EBE5]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-[#7A7A7A] text-sm">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                <p>{search ? 'Không tìm thấy kết quả' : 'Chưa có tin nhắn nào'}</p>
              </div>
            ) : (
              filtered.map(conv => {
                const isActive = selected?.id === conv.id
                const hasUnread = conv.unreadByAdmin > 0
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors ${
                      isActive ? 'bg-[#D4AF37]/10 border-l-4 border-l-[#D4AF37]' : 'hover:bg-[#F9F5F0] border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isActive ? 'bg-[#D4AF37] text-white' : 'bg-[#F0EBE5] text-[#7A7A7A]'
                    }`}>
                      {conv.customerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <span className={`text-sm font-semibold truncate ${hasUnread ? 'text-[#2C2C2C]' : 'text-[#4A4A4A]'}`}>
                          {conv.customerName}
                        </span>
                        <span className="text-[10px] text-[#7A7A7A] shrink-0">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-[#7A7A7A] truncate mt-0.5">{conv.customerEmail}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-[#2C2C2C] font-medium' : 'text-[#7A7A7A]'}`}>
                          {conv.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                            {conv.unreadByAdmin}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-[#E5DFD8] bg-white flex items-center gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1 text-[#7A7A7A] hover:text-[#2C2C2C]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                  {selected.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2C]">{selected.customerName}</p>
                  <p className="text-xs text-[#7A7A7A]">{selected.customerEmail}</p>
                </div>
                <span className="ml-auto text-xs text-[#7A7A7A] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatFullTime(selected.lastMessageAt)}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#FFFBF7]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#7A7A7A] text-sm">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                    <p>Chưa có tin nhắn trong cuộc trò chuyện này</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isAdmin = msg.senderRole === 'admin'
                    return (
                      <div key={msg.id} className={`flex gap-2 group ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        {!isAdmin && (
                          <div className="w-7 h-7 rounded-full bg-[#F0EBE5] flex items-center justify-center text-xs font-bold text-[#7A7A7A] shrink-0 self-end">
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isAdmin
                              ? 'bg-[#2C2C2C] text-white rounded-br-sm'
                              : 'bg-white text-[#2C2C2C] border border-[#E5DFD8] rounded-bl-sm shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] text-[#7A7A7A]">{formatTime(msg.createdAt)}</span>
                            {isAdmin && (
                              msg.isRead
                                ? <CheckCheck className="w-3 h-3 text-[#D4AF37]" />
                                : <Check className="w-3 h-3 text-[#7A7A7A]" />
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-400 hover:text-red-600 cursor-pointer"
                                title="Xóa tin nhắn"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center text-xs font-bold text-white shrink-0 self-end">
                            A
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t border-[#E5DFD8]">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập phản hồi... (Enter để gửi, Shift+Enter xuống dòng)"
                    className="flex-1 resize-none bg-[#F9F5F0] border border-[#E5DFD8] rounded-xl px-4 py-2.5 text-sm text-[#2C2C2C] placeholder-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 max-h-32 overflow-y-auto"
                    style={{ minHeight: '42px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 bg-[#D4AF37] hover:bg-[#C09B2A] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-[#7A7A7A] mt-1.5 pl-1">Tự động làm mới mỗi 10 giây</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-[#F9F5F0] flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-[#2C2C2C] mb-2">
                Chọn một cuộc trò chuyện
              </h3>
              <p className="text-sm text-[#7A7A7A] max-w-xs">
                Chọn một cuộc trò chuyện từ danh sách bên trái để xem và trả lời tin nhắn
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
