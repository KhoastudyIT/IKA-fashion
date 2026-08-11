import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  // Chuỗi rỗng được chấp nhận: users.phone là NOT NULL DEFAULT '',
  // nên user chưa nhập SĐT vẫn phải lưu được các trường khác.
  phone: z.string()
    .regex(/^$|^(0[35789])[0-9]{8}$/, 'Số điện thoại không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng 03/05/07/08/09)')
    .optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').max(100),
});
