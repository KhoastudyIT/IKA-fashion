import { z } from 'zod';

export const addWishlistSchema = z.object({
  productId: z.coerce.number().int().positive(),
});
