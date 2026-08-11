import { z } from 'zod';

// URL mạng xã hội: cho phép chuỗi rỗng (chưa khai báo) hoặc một URL hợp lệ.
// z.string().url() một mình sẽ chặn cả '' nên phải nới bằng union.
//
// .trim() đứng trước .url(): admin copy link từ trình duyệt hay dính khoảng
// trắng ở đuôi, không cắt thì báo "URL không hợp lệ" trong khi nhìn vẫn đúng.
const optionalUrl = z.union([
  z.literal(''),
  z.string().trim().url('Phải là URL đầy đủ, có https://').max(300),
]);

const MAP_EMBED_PREFIX = 'https://www.google.com/maps/embed';

/**
 * Google Maps → Chia sẻ → Nhúng bản đồ đưa ra nguyên thẻ <iframe>. Admin dán
 * cả cụm đó là chuyện bình thường, nên rút src ra thay vì bắt họ tự cắt.
 * Không phải iframe thì trả lại chuỗi đã cắt khoảng trắng.
 */
export function normalizeMapEmbed(value) {
  if (typeof value !== 'string') return value;
  const iframe = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return (iframe ? iframe[1] : value).trim();
}

// Chỉ nhận đúng dạng URL nhúng. Link chia sẻ thường (maps.app.goo.gl/...) hay
// link trên thanh địa chỉ đều KHÔNG hiển thị được trong iframe.
const mapEmbedUrl = z.preprocess(
  normalizeMapEmbed,
  z.union([
    z.literal(''),
    z.string()
      .max(4096)
      .startsWith(MAP_EMBED_PREFIX, `Phải là mã nhúng Google Maps (bắt đầu bằng ${MAP_EMBED_PREFIX})`),
  ]),
);

// Logo là đường dẫn nội bộ do endpoint upload trả về (/uploads/settings/...),
// không phải URL đầy đủ — nên chỉ giới hạn độ dài.
export const updateSettingsSchema = z.object({
  storeName:    z.string().trim().min(1, 'Tên cửa hàng là bắt buộc').max(150).optional(),
  logo:         z.string().trim().max(500).optional(),
  hotline:      z.string().trim().max(30).optional(),
  email:        z.union([z.literal(''), z.string().trim().email('Email không hợp lệ').max(150)]).optional(),
  address:      z.string().trim().max(255).optional(),
  mapUrl:       mapEmbedUrl.optional(),
  workingHours: z.string().trim().max(255).optional(),
  facebookUrl:  optionalUrl.optional(),
  instagramUrl: optionalUrl.optional(),
  tiktokUrl:    optionalUrl.optional(),
});
