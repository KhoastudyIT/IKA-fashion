'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  /** Max page buttons before collapsing to ellipsis (default 7) */
  maxVisible?: number
}

export default function AdminPagination({
  currentPage,
  totalPages,
  maxVisible = 7,
}: AdminPaginationProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const goTo = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(page))
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams, currentPage, totalPages],
  )

  if (totalPages <= 1) return null

  const pages: (number | null)[] = buildPageList(currentPage, totalPages, maxVisible)

  return (
    <div className="flex items-center justify-center gap-1.5 py-4 select-none">
      {/* Prev */}
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Trang trước"
        className="inline-flex items-center justify-center w-8 h-8 rounded border border-[#E5DFD8] bg-white text-[#2C2C2C] hover:bg-[#F9F5F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === null ? (
          <span
            key={`dots-${i}`}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            aria-label={`Trang ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`w-8 h-8 rounded border text-xs font-medium transition-colors cursor-pointer ${
              p === currentPage
                ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                : 'bg-white text-[#2C2C2C] border-[#E5DFD8] hover:bg-[#F9F5F0]'
            }`}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Trang sau"
        className="inline-flex items-center justify-center w-8 h-8 rounded border border-[#E5DFD8] bg-white text-[#2C2C2C] hover:bg-[#F9F5F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Info label */}
      <span className="ml-3 text-xs text-muted-foreground whitespace-nowrap">
        Trang {currentPage} / {totalPages}
      </span>
    </div>
  )
}

/** Returns a list of page numbers + nulls (=ellipsis) to render */
function buildPageList(current: number, total: number, maxVisible: number): (number | null)[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const half       = Math.floor(maxVisible / 2)
  let   start      = Math.max(2, current - half)
  let   end        = Math.min(total - 1, current + half)
  const windowSize = maxVisible - 2

  if (end - start + 1 < windowSize) {
    if (current < total / 2) end   = Math.min(total - 1, start + windowSize - 1)
    else                     start = Math.max(2,         end - windowSize + 1)
  }

  const result: (number | null)[] = [1]
  if (start > 2)       result.push(null)
  for (let p = start; p <= end; p++) result.push(p)
  if (end < total - 1) result.push(null)
  result.push(total)
  return result
}
