// Shared constants for Vietnamese city/province list and phone validation.
// Used by profile/page.tsx, checkout/page.tsx, and any future form.

export const VN_CITIES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Hưng Yên',
  'Thái Nguyên',
  'Nghệ An',
] as const

/**
 * Vietnamese mobile phone: must start with 03, 05, 07, 08, or 09
 * followed by exactly 8 more digits → 10 digits total.
 * Examples: 0912345678 ✅ | 0123456789 ❌ | 123 ❌
 */
export const PHONE_REGEX = /^(0[35789])[0-9]{8}$/

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ''))
}
