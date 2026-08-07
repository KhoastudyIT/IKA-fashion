import React from 'react'

/**
 * Render nội dung bài viết tin tức.
 *
 * Nội dung lưu trong DB là văn bản thuần (backend đã gỡ hết thẻ HTML) với cú
 * pháp rút gọn. Ở đây chỉ dựng React element — không dùng dangerouslySetInnerHTML.
 *
 *   ## / ###        tiêu đề mục
 *   -               gạch đầu dòng
 *   1.              danh sách đánh số
 *   >               trích dẫn
 *   **đậm**  *nghiêng*
 *   [chữ](url)      liên kết
 *   ![mô tả](url)   ảnh
 */

// Chỉ cho phép http(s) và đường dẫn nội bộ — chặn javascript:, data:, vbscript:
// kể cả khi có ai đó ghi thẳng vào DB.
function safeUrl(url: string): string | null {
  const u = String(url).trim()
  return /^(https?:\/\/|\/)/i.test(u) ? u : null
}

// Bắt cả 4 dạng inline trong một lượt để không phải quét chồng nhiều lần.
const INLINE_RE = /(!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*\n]+\*)/g

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE_RE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }

    const img = part.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (img) {
      const src = safeUrl(img[2])
      if (!src) return <span key={key}>{part}</span>
      return <img key={key} src={src} alt={img[1]} className="max-w-full rounded-lg align-middle" />
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (link) {
      const href = safeUrl(link[2])
      if (!href) return <span key={key}>{link[1]}</span>
      const external = /^https?:\/\//i.test(href)
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-accent font-medium underline"
        >
          {link[1]}
        </a>
      )
    }

    return <span key={key}>{part}</span>
  })
}

const NUMBERED_RE = /^\d+\.\s+/

export default function ArticleContent({ content }: { content: string }) {
  if (!content?.trim()) return null

  // Chuẩn hoá CRLF/CR về LF trước khi tách đoạn — nội dung có thể do admin dán
  // từ Word, nếu lọt \r\n\r\n thì regex không khớp và cả bài dồn thành một khối.
  const normalized = content.replace(/\r\n?/g, '\n')
  const blocks: React.ReactNode[] = []

  normalized.split(/\n{2,}/).forEach((raw, blockIndex) => {
    const block = raw.trim()
    if (!block) return

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    const key = `b${blockIndex}`

    // Ảnh đứng riêng một khối
    const loneImage = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (loneImage) {
      const src = safeUrl(loneImage[2])
      if (src) {
        blocks.push(
          <figure key={key} className="my-8">
            <img src={src} alt={loneImage[1]} className="w-full h-auto rounded-lg block" />
            {loneImage[1] && (
              <figcaption className="mt-2 text-xs text-muted-foreground text-center italic">
                {loneImage[1]}
              </figcaption>
            )}
          </figure>,
        )
        return
      }
    }

    if (lines.every(l => l.startsWith('>'))) {
      const text = lines.map(l => l.replace(/^>\s?/, '')).join(' ')
      blocks.push(
        <blockquote key={key} className="my-6 border-l-4 border-accent pl-6 py-2 italic text-muted-foreground leading-[1.85]">
          {renderInline(text, key)}
        </blockquote>,
      )
      return
    }

    if (lines.every(l => l.startsWith('- '))) {
      blocks.push(
        <ul key={key} className="mb-6 pl-6 list-disc space-y-2.5 text-foreground/90 leading-[1.85]">
          {lines.map((l, i) => <li key={i}>{renderInline(l.slice(2), `${key}-${i}`)}</li>)}
        </ul>,
      )
      return
    }

    if (lines.length > 0 && lines.every(l => NUMBERED_RE.test(l))) {
      blocks.push(
        <ol key={key} className="mb-6 pl-6 list-decimal space-y-2.5 text-foreground/90 leading-[1.85]">
          {lines.map((l, i) => <li key={i}>{renderInline(l.replace(NUMBERED_RE, ''), `${key}-${i}`)}</li>)}
        </ol>,
      )
      return
    }

    if (block.startsWith('### ')) {
      blocks.push(
        <h3 key={key} className="text-lg font-heading font-semibold text-foreground mt-8 mb-3 leading-snug">
          {block.slice(4)}
        </h3>,
      )
      return
    }

    if (block.startsWith('## ')) {
      blocks.push(
        <h2 key={key} className="text-xl md:text-2xl font-heading font-semibold text-foreground mt-10 mb-4 leading-snug">
          {block.slice(3)}
        </h2>,
      )
      return
    }

    blocks.push(
      <p key={key} className="mb-6 text-foreground/90 leading-[1.85] font-sans text-base">
        {renderInline(block, key)}
      </p>,
    )
  })

  return <>{blocks}</>
}
