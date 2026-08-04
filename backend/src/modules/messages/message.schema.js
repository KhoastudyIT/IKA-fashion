import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn quá dài'),
  conversationId: z.string().optional(),
  productId: z.coerce.number().int().positive().nullable().optional(),
});

export const toggleBotSchema = z.object({
  aiEnabled: z.boolean({ required_error: 'Cần chỉ định aiEnabled' }),
});
