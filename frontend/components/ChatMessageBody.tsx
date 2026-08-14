'use client'

import Link from 'next/link'
import { ProductSuggestion } from '@/api'

/** Bot trả lời bằng markdown tối giản: **đậm** + xuống dòng. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={i} className="block">
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>,
          )}
        </span>
      ))}
    </>
  )
}

export function SuggestionCards({
  items,
  onNavigate,
}: {
  items: ProductSuggestion[]
  onNavigate?: () => void
}) {
  return (
    <div className="mt-2 space-y-1.5">
      {items.map(p => (
        <Link
          key={p.id}
          href={`/products/${p.handle}`}
          onClick={onNavigate}
          className="flex items-center gap-2 bg-white border border-[#E5DFD8] rounded-lg p-1.5 hover:border-[#D4AF37] transition-colors"
        >
          <img src={p.img} alt={p.name} className="w-10 h-10 rounded object-cover shrink-0 bg-[#F9F5F0]" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] font-medium text-[#2C2C2C] truncate">{p.name}</p>
            <p className="text-[0.6875rem] text-[#D4AF37] font-semibold">{p.price.toLocaleString('vi-VN')} đ</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
