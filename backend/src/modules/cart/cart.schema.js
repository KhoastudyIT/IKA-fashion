import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  size:      z.string().min(1),
  color:     z.string().min(1),
  quantity:  z.number().int().positive().max(99).optional().default(1),
});

// Sửa dòng giỏ hàng: gửi trường nào sửa trường đó, trường bỏ trống thì giữ
// nguyên. Body rỗng thì không có gì để làm — chặn ngay chứ đừng đi tới DB.
export const updateItemSchema = z
  .object({
    quantity: z.number().int().positive().max(99).optional(),
    size:     z.string().min(1).optional(),
    color:    z.string().min(1).optional(),
  })
  .refine(
    (b) => b.quantity !== undefined || b.size !== undefined || b.color !== undefined,
    { message: 'Cần ít nhất một trong: quantity, size, color' },
  );
