import { z } from 'zod';
import { SHIPPING_CODES, PAYMENT_CODES } from './shipping.js';

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(5).max(255),
  phone:           z.string().min(8).max(20),
  notes:           z.string().max(500).optional().default(''),
  couponCode:      z.string().max(50).optional(),

  // Tỉnh/thành gửi riêng để server kiểm tra điều kiện giao hỏa tốc. Không lưu
  // thành cột — shipping_address đã chứa sẵn tên tỉnh/thành ở cuối chuỗi.
  city:            z.string().max(100).optional(),

  // Chỉ nhận MÃ phương thức; phí ship do server tra bảng, không lấy từ client.
  shippingMethod:  z.enum(SHIPPING_CODES).optional().default('standard'),
  paymentMethod:   z.enum(PAYMENT_CODES, {
    message: 'Hiện cửa hàng chỉ hỗ trợ thanh toán khi nhận hàng (COD).',
  }).optional().default('cod'),
});

// 'returned' KHÔNG có ở đây: đơn chỉ vào trạng thái đó qua luồng duyệt yêu cầu
// trả hàng (module returns), để không ai đặt tay mà quên hoàn kho.
const STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

export const updateOrderStatusSchema = z.object({
  status:        z.enum(STATUSES).optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
});

// Khách tự hủy đơn. Lý do không bắt buộc — bắt khách giải thích mới cho hủy chỉ
// làm họ gõ bừa; có ghi thì cửa hàng đọc được ở trang quản lý đơn.
export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500, 'Lý do tối đa 500 ký tự').optional().default(''),
});

// Bộ lọc danh sách đơn của admin. 'returned' được phép LỌC (chỉ không được đặt
// tay qua updateOrderStatusSchema).
export const orderQuerySchema = z.object({
  status: z.enum([...STATUSES, 'returned']).optional(),
  search: z.string().trim().max(200).optional(),
  page:   z.coerce.number().int().positive().optional().default(1),
  limit:  z.coerce.number().int().positive().max(100).optional().default(15),
});

export { STATUSES };
