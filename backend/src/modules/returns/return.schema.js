import { z } from 'zod';

export const RETURN_TYPES = ['return', 'exchange'];
// 'cancelled' = khách tự rút yêu cầu. Admin không đặt tay được trạng thái này
// (bảng NEXT_STATUSES trong service không có bước nào dẫn tới nó), nhưng vẫn cần
// nằm trong danh sách để lọc được ở trang quản trị.
export const RETURN_STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

export const MIN_RETURN_IMAGES = 2;
export const MAX_RETURN_IMAGES = 5;

export const createReturnSchema = z.object({
  orderId: z.string().uuid('Mã đơn hàng không hợp lệ'),
  type: z.enum(RETURN_TYPES, {
    errorMap: () => ({ message: 'Chỉ nhận yêu cầu trả hàng hoặc đổi mới' }),
  }),
  reason: z.string()
    .trim()
    .min(10, 'Vui lòng mô tả lý do ít nhất 10 ký tự')
    .max(500),
  // Ảnh minh họa lỗi sản phẩm — BẮT BUỘC ít nhất 2 tấm để cửa hàng có đủ căn cứ
  // đối chiếu với lý do (thường cần một ảnh toàn cảnh và một ảnh cận chỗ lỗi).
  // Chỉ nhận đường dẫn do chính API upload sinh ra, không nhận URL ngoài —
  // tránh biến trang quản trị thành nơi nhúng ảnh lạ.
  images: z.array(
    z.string().regex(/^\/uploads\/returns\/[\w.-]+$/, 'Đường dẫn ảnh không hợp lệ'),
  )
    .min(MIN_RETURN_IMAGES, `Vui lòng đính kèm ít nhất ${MIN_RETURN_IMAGES} ảnh sản phẩm`)
    .max(MAX_RETURN_IMAGES, `Chỉ đính kèm tối đa ${MAX_RETURN_IMAGES} ảnh`),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(RETURN_STATUSES, {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' }),
  }).optional(),
  adminNote: z.string().trim().max(500).optional(),
});

export const returnQuerySchema = z.object({
  status: z.enum(RETURN_STATUSES).optional(),
  page:   z.coerce.number().int().positive().optional().default(1),
  limit:  z.coerce.number().int().positive().max(100).optional().default(15),
});
