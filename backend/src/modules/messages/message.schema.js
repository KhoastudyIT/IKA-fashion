import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn quá dài'),
  conversationId: z.string().optional(), // admin dùng để reply vào conversation cụ thể
});
