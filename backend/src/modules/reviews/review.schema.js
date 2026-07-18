import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.coerce.number().int().positive(),
  rating:    z.coerce.number().int().min(1).max(5),
  comment:   z.string().max(2000).optional().default(''),
});

export const replyReviewSchema = z.object({
  reply: z.string().max(2000).optional().default(''),
});
