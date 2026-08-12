import { z } from 'zod';

// Mỗi flash sale gắn với đúng một sản phẩm.
export const createFlashSaleSchema = z.object({
  productId: z.coerce.number().int().positive(),
  price:     z.coerce.number().int().positive(),
  stock:     z.coerce.number().int().positive('Số suất phải lớn hơn 0'),
  startsAt:  z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
  // null = chạy tới khi tắt tay.
  endsAt:    z.string().min(1).nullable().optional(),
  active:    z.coerce.boolean().optional().default(true),
});

export const updateFlashSaleSchema = createFlashSaleSchema.partial();
