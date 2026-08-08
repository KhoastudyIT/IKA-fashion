import { z } from 'zod';

// URL mạng xã hội: cho phép chuỗi rỗng (chưa khai báo) hoặc một URL hợp lệ.
// z.string().url() một mình sẽ chặn cả '' nên phải nới bằng union.
const optionalUrl = z.union([z.literal(''), z.string().url().max(300)]);

// Logo là đường dẫn nội bộ do endpoint upload trả về (/uploads/settings/...),
// không phải URL đầy đủ — nên chỉ giới hạn độ dài.
export const updateSettingsSchema = z.object({
  storeName:    z.string().min(1).max(150).optional(),
  logo:         z.string().max(500).optional(),
  hotline:      z.string().max(30).optional(),
  email:        z.union([z.literal(''), z.string().email().max(150)]).optional(),
  address:      z.string().max(255).optional(),
  workingHours: z.string().max(255).optional(),
  facebookUrl:  optionalUrl.optional(),
  instagramUrl: optionalUrl.optional(),
  tiktokUrl:    optionalUrl.optional(),
});
