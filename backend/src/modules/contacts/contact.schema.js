import { z } from 'zod';

export const CONTACT_STATUSES = ['new', 'processing', 'resolved'];

// Người gửi hay để khoảng trắng thừa khi copy-paste, cắt trước khi kiểm tra
// độ dài để không từ chối oan một chuỗi thực chất vẫn hợp lệ.
export const createContactSchema = z.object({
  name:    z.string().trim().min(2, 'Vui lòng nhập họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  email:   z.string().trim().email('Email không hợp lệ').max(150),

  // Không bắt buộc — form chỉ cần email là đủ để phản hồi. Nhưng đã nhập thì
  // phải đúng định dạng, dùng chung quy tắc với SĐT hồ sơ khách hàng.
  phone:   z.string()
             .trim()
             .transform(v => v.replace(/[\s.\-()]/g, ''))
             .refine(
               v => v === '' || /^(0[35789])[0-9]{8}$/.test(v),
               'Số điện thoại không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng 03/05/07/08/09)',
             )
             .optional()
             .default(''),

  subject: z.string().trim().min(1, 'Vui lòng chọn chủ đề').max(100),
  message: z.string().trim().min(10, 'Nội dung cần ít nhất 10 ký tự').max(2000, 'Nội dung tối đa 2000 ký tự'),
});

export const updateContactSchema = z.object({
  status:    z.enum(CONTACT_STATUSES, {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' }),
  }).optional(),
  adminNote: z.string().trim().max(1000).optional(),
});

export const contactQuerySchema = z.object({
  page:   z.coerce.number().int().positive().optional().default(1),
  limit:  z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(CONTACT_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  sort:   z.enum(['newest', 'oldest']).optional().default('newest'),
});
