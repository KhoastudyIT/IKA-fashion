'use client'

import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, List, ListOrdered, Quote, Link2, Image as ImageIcon, Eye, Pencil } from 'lucide-react'
import { uploadImage, validateImageFile, UploadType } from '@/api'
import ArticleContent from './ArticleContent'

/**
 * Trình soạn nội dung bài viết: thanh công cụ chèn cú pháp vào textarea, kèm
 * khung xem trước dùng chính bộ render của trang công khai.
 *
 * Cố ý KHÔNG dùng WYSIWYG — nội dung vẫn là văn bản thuần nên không có bề mặt
 * XSS và không cần thêm dependency nào.
 */
export default function ContentEditor({
  value,
  onChange,
  imageType = 'news',
  rows = 14,
}: {
  value: string
  onChange: (next: string) => void
  imageType?: UploadType
  rows?: number
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  // Vị trí con trỏ cần khôi phục sau khi React render lại giá trị mới
  const pendingSelection = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (!pendingSelection.current || !taRef.current) return
    const [start, end] = pendingSelection.current
    pendingSelection.current = null
    taRef.current.focus()
    taRef.current.setSelectionRange(start, end)
  }, [value])

  /** Thay đoạn [from, to) bằng text mới rồi đặt lại con trỏ */
  const splice = (from: number, to: number, text: string, selStart: number, selEnd?: number) => {
    pendingSelection.current = [selStart, selEnd ?? selStart]
    onChange(value.slice(0, from) + text + value.slice(to))
  }

  const getSel = () => {
    const ta = taRef.current
    if (!ta) return { start: value.length, end: value.length }
    return { start: ta.selectionStart, end: ta.selectionEnd }
  }

  /** Bọc vùng chọn: **đậm**, *nghiêng* */
  const wrap = (marker: string, placeholder: string) => {
    const { start, end } = getSel()
    const selected = value.slice(start, end) || placeholder
    const text = `${marker}${selected}${marker}`
    splice(start, end, text, start + marker.length, start + marker.length + selected.length)
  }

  /** Thêm tiền tố vào đầu mỗi dòng đang chọn. Bấm lại để bỏ. */
  const prefixLines = (prefix: string, { numbered = false } = {}) => {
    const { start, end } = getSel()
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineEndRaw = value.indexOf('\n', end)
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw

    const lines = value.slice(lineStart, lineEnd).split('\n')
    const re = numbered ? /^\d+\.\s+/ : new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    const allPrefixed = lines.every(l => re.test(l))

    const next = lines.map((l, i) => {
      if (allPrefixed) return l.replace(re, '')
      // Gỡ tiền tố cũ trước, không thì "## " chồng lên "- " thành rác
      const clean = l.replace(/^(#{2,3}\s+|-\s+|>\s?|\d+\.\s+)/, '')
      return numbered ? `${i + 1}. ${clean}` : `${prefix}${clean}`
    }).join('\n')

    splice(lineStart, lineEnd, next, lineStart, lineStart + next.length)
  }

  /** Chèn một khối riêng, tự thêm dòng trống ngăn cách nếu cần */
  const insertBlock = (text: string) => {
    const { start, end } = getSel()
    const before = value.slice(0, start)
    const after = value.slice(end)
    const lead = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
    const tail = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : ''
    splice(start, end, `${lead}${text}${tail}`, start + lead.length + text.length)
  }

  const addLink = () => {
    const { start, end } = getSel()
    const selected = value.slice(start, end)
    const url = window.prompt('Đường dẫn (https://... hoặc /duong-dan)', 'https://')
    if (!url) return
    const label = selected || window.prompt('Chữ hiển thị', 'xem thêm') || url
    const text = `[${label}](${url.trim()})`
    splice(start, end, text, start + text.length)
  }

  const pickImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      const invalid = validateImageFile(file)
      if (invalid) { setError(invalid); return }

      setError('')
      setUploading(true)
      try {
        const url = await uploadImage(file, imageType)
        const caption = window.prompt('Chú thích ảnh (để trống nếu không cần)', '') || ''
        insertBlock(`![${caption}](${url})`)
      } catch (err: any) {
        setError(err.message || 'Tải ảnh thất bại')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const Btn = ({ onClick, title, children, wide = false }: {
    onClick: () => void; title: string; children: React.ReactNode; wide?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={uploading}
      className={`h-8 ${wide ? 'px-2.5' : 'w-8'} rounded border border-[#E5DFD8] bg-white text-[#2C2C2C] text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-[#F9F5F0] hover:border-[#D4AF37] transition-colors disabled:opacity-50 cursor-pointer`}
    >
      {children}
    </button>
  )

  const Sep = () => <span className="w-px h-5 bg-[#E5DFD8] mx-0.5" />

  return (
    <div className="border border-[#E5DFD8] rounded overflow-hidden">
      {/* Thanh công cụ */}
      <div className="flex items-center gap-1 flex-wrap px-2.5 py-2 bg-[#F9F5F0] border-b border-[#E5DFD8]">
        <Btn onClick={() => wrap('**', 'chữ đậm')} title="Đậm"><Bold className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => wrap('*', 'chữ nghiêng')} title="Nghiêng"><Italic className="w-3.5 h-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => prefixLines('## ')} title="Tiêu đề mục">H2</Btn>
        <Btn onClick={() => prefixLines('### ')} title="Tiêu đề phụ">H3</Btn>
        <Sep />
        <Btn onClick={() => prefixLines('- ')} title="Gạch đầu dòng"><List className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => prefixLines('', { numbered: true })} title="Danh sách đánh số"><ListOrdered className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => prefixLines('> ')} title="Trích dẫn"><Quote className="w-3.5 h-3.5" /></Btn>
        <Sep />
        <Btn onClick={addLink} title="Chèn liên kết" wide><Link2 className="w-3.5 h-3.5" /> Link</Btn>
        <Btn onClick={pickImage} title="Tải ảnh từ máy và chèn vào bài" wide>
          <ImageIcon className="w-3.5 h-3.5" /> {uploading ? 'Đang tải...' : 'Ảnh'}
        </Btn>

        <div className="ml-auto">
          <Btn onClick={() => setPreview(p => !p)} title="Xem trước như trang công khai" wide>
            {preview
              ? <><Pencil className="w-3.5 h-3.5" /> Soạn thảo</>
              : <><Eye className="w-3.5 h-3.5" /> Xem trước</>}
          </Btn>
        </div>
      </div>

      {/* Vùng soạn thảo / xem trước */}
      {preview ? (
        <div className="px-5 py-4 bg-white overflow-y-auto" style={{ height: `${rows * 1.7}rem` }}>
          {value.trim()
            ? <ArticleContent content={value} />
            : <p className="text-sm text-muted-foreground">Chưa có nội dung để xem trước.</p>}
        </div>
      ) : (
        <textarea
          ref={taRef}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={'Đoạn mở đầu...\n\n## Tiêu đề mục\n\n- **Ý chính**: diễn giải'}
          className="block w-full px-4 py-3 border-0 outline-none resize-y font-mono text-[13px] leading-[1.7] text-[#2C2C2C] bg-white"
        />
      )}

      {error && <p className="px-4 py-2 text-xs text-red-600 border-t border-[#E5DFD8] bg-red-50">{error}</p>}
    </div>
  )
}
