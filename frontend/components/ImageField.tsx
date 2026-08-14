'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X, ZoomIn, Trash2 } from 'lucide-react'
import { uploadImage, validateImageFile, UploadType } from '@/api'

/** Xem ảnh phóng to. z-index 60 để nằm trên modal admin (z-50). */
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    // Khoá cuộn nền để trang phía sau không trôi khi đang xem ảnh
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-8 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-5 right-6 w-10 h-10 rounded-full bg-white/90 text-[#2C2C2C] flex items-center justify-center cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[min(1100px,92vw)] max-h-[88vh] object-contain rounded-lg cursor-default"
      />
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs">
        Bấm ra ngoài hoặc nhấn Esc để đóng
      </p>
    </div>
  )
}

type Props = {
  value: string
  onChange: (url: string) => void
  type: UploadType
  label?: string
  required?: boolean
  /** Để form khoá nút Lưu trong lúc đang tải ảnh */
  onUploadingChange?: (uploading: boolean) => void
  hint?: string
  shape?: 'wide' | 'square'
}

/**
 * Ô chọn ảnh dùng chung cho form admin: tải file từ máy lên backend, kèm ô dán
 * đường dẫn thủ công — dữ liệu seed đang dùng đường dẫn tĩnh như
 * `/products/ao-thun-trang.png` nên không thể bỏ cách nhập tay.
 */
export default function ImageField({
  value, onChange, type, label = 'Ảnh', required = false, onUploadingChange, hint,
  shape = 'wide',
}: Props) {
  const isSquare = shape === 'square'
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [zoomed, setZoomed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const setBusy = (busy: boolean) => {
    setUploading(busy)
    onUploadingChange?.(busy)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset ngay để chọn lại đúng file vừa rồi vẫn kích hoạt onChange
    e.target.value = ''
    if (!file) return

    const invalid = validateImageFile(file)
    if (invalid) { setError(invalid); return }

    setError('')
    setBusy(true)
    try {
      onChange(await uploadImage(file, type))
    } catch (err: any) {
      setError(err.message || 'Tải ảnh thất bại')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
        {label}{required && ' *'}
      </label>

      <div className="flex gap-4 items-start">
        {/* Ảnh trong ô nhỏ khó soi chi tiết — bấm để phóng to */}
        <div
          onClick={() => value && setZoomed(true)}
          title={value ? 'Bấm để phóng to' : undefined}
          className={`${isSquare ? 'w-28 h-28' : 'w-40 h-28'} shrink-0 rounded border border-[#E5DFD8] bg-[#F9F5F0] overflow-hidden relative flex items-center justify-center ${value ? 'cursor-zoom-in' : ''
            }`}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Xem trước"
                className={`w-full h-full ${isSquare ? 'object-contain p-2' : 'object-cover'}`}
              />
              <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 bg-black/60 text-white px-2 py-0.5 rounded-full text-[0.625rem] font-medium pointer-events-none">
                <ZoomIn className="w-3 h-3" /> Phóng to
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có ảnh</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />

          <div className="flex gap-2 flex-wrap mb-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] text-sm font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Đang tải lên...' : 'Chọn ảnh từ máy'}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-2 border border-[#E5DFD8] text-red-500 text-sm font-medium rounded hover:bg-[#F9F5F0] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Bỏ ảnh
              </button>
            )}
          </div>

          <input
            type="text"
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hoặc dán đường dẫn ảnh"
            className="w-full px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />

          {error
            ? <p className="text-xs text-red-600 mt-1">{error}</p>
            : <p className="text-xs text-muted-foreground mt-1">{hint || 'JPG, PNG hoặc WEBP · tối đa 5MB'}</p>}
        </div>
      </div>

      {zoomed && value && <ImageLightbox src={value} alt={label} onClose={() => setZoomed(false)} />}
    </div>
  )
}
