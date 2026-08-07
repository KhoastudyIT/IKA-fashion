'use client'

import { useRef, useState } from 'react'
import { Upload, X, Plus } from 'lucide-react'
import { uploadImage, validateImageFile, UploadType } from '@/api'

type Props = {
  value: string[]
  onChange: (urls: string[]) => void
  type: UploadType
  label?: string
  required?: boolean
  onUploadingChange?: (uploading: boolean) => void
}

/**
 * Ô chọn NHIỀU ảnh cho form sản phẩm. Ảnh đầu tiên được dùng làm ảnh bìa —
 * kéo lên đầu bằng nút "Đặt làm bìa" thay vì bắt admin sắp xếp bằng chuỗi CSV.
 *
 * Vẫn giữ ô dán đường dẫn thủ công vì dữ liệu seed dùng đường dẫn tĩnh
 * (`/products/ao-thun-trang.png`).
 */
export default function ImageListField({
  value, onChange, type, label = 'Ảnh sản phẩm', required = false, onUploadingChange,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const setBusy = (busy: boolean) => {
    setUploading(busy)
    onUploadingChange?.(busy)
  }

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    setError('')
    setBusy(true)
    const uploaded: string[] = []
    const failed: string[] = []

    // Tải tuần tự để thông báo lỗi gắn đúng với từng file thay vì gộp chung
    for (const file of files) {
      const invalid = validateImageFile(file)
      if (invalid) { failed.push(`${file.name}: ${invalid}`); continue }
      try {
        uploaded.push(await uploadImage(file, type))
      } catch (err: any) {
        failed.push(`${file.name}: ${err.message || 'tải thất bại'}`)
      }
    }

    if (uploaded.length) onChange([...value, ...uploaded])
    if (failed.length) setError(failed.join(' · '))
    setBusy(false)
  }

  const addManual = () => {
    const url = manualUrl.trim()
    if (!url) return
    onChange([...value, url])
    setManualUrl('')
  }

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index))

  const makeCover = (index: number) => {
    const next = [...value]
    const [picked] = next.splice(index, 1)
    onChange([picked, ...next])
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
        {label}{required && ' *'}
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {value.map((src, i) => (
            <div key={`${src}-${i}`} className="relative group rounded border border-[#E5DFD8] overflow-hidden bg-[#F9F5F0]">
              <img src={src} alt={`Ảnh ${i + 1}`} className="w-full h-24 object-cover" />

              {i === 0 ? (
                <span className="absolute top-1 left-1 bg-[#D4AF37] text-[#2C2C2C] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Ảnh bìa
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="absolute bottom-1 left-1 bg-black/65 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Đặt làm bìa
                </button>
              )}

              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Xoá ảnh ${i + 1}`}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
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
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManual() } }}
          placeholder="hoặc dán đường dẫn ảnh rồi bấm Thêm"
          className="flex-1 px-3 py-2 bg-[#F9F5F0] border border-[#E5DFD8] rounded text-sm text-[#2C2C2C] font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        />
        <button
          type="button"
          onClick={addManual}
          className="px-3 py-2 border border-[#E5DFD8] text-[#2C2C2C] text-sm font-medium rounded hover:bg-[#F9F5F0] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
      </div>

      {error
        ? <p className="text-xs text-red-600 mt-1">{error}</p>
        : <p className="text-xs text-muted-foreground mt-1">JPG, PNG hoặc WEBP · tối đa 5MB mỗi ảnh · chọn được nhiều ảnh cùng lúc</p>}
    </div>
  )
}
